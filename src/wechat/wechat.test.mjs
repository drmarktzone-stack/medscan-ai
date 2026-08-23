import assert from 'node:assert/strict';
import { createSeedState, ME_ID } from './lib/seedData.js';
import { formatChatTime, uid } from './lib/format.js';

// In-memory store simulation (no DOM/localStorage in node tests)
let memState = createSeedState();

function sortChats(chats) {
  return [...chats].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.lastTime || 0) - (a.lastTime || 0);
  });
}

function sendMessage(state, chatId, content, senderId = ME_ID) {
  const now = Date.now();
  const msg = { id: uid('msg'), senderId, type: 'text', content: content.trim(), time: now };
  return {
    ...state,
    messages: { ...state.messages, [chatId]: [...(state.messages[chatId] || []), msg] },
    chats: sortChats(
      state.chats.map((c) =>
        c.id === chatId ? { ...c, lastMessage: content.trim(), lastTime: now, unread: 0 } : c,
      ),
    ),
  };
}

// --- seed data ---
const seed = createSeedState();
assert.ok(seed.profile.id === ME_ID, 'profile has me id');
assert.ok(seed.chats.length >= 3, 'seed has chats');
assert.ok(seed.contacts.length >= 3, 'seed has contacts');
assert.ok(Object.keys(seed.messages).length >= 3, 'seed has message threads');

// --- format ---
const recent = Date.now() - 30 * 60 * 1000;
assert.match(formatChatTime(recent), /\d/);

// --- send message ---
const chatId = seed.chats[0].id;
memState = sendMessage(memState, chatId, 'בדיקה');
const msgs = memState.messages[chatId];
assert.equal(msgs[msgs.length - 1].content, 'בדיקה');
const updatedChat = memState.chats.find((c) => c.id === chatId);
assert.equal(updatedChat.lastMessage, 'בדיקה');
assert.equal(updatedChat.unread, 0);

console.log('wechat.test.mjs: ok');
