import assert from 'node:assert/strict';
import { createSeedState, ME_ID } from './lib/seedData.js';
import { formatChatTime, uid } from './lib/format.js';
import { profileQrValue, parseProfileQr } from './lib/qr.js';
import { getMiniApp, MINI_APPS } from './miniapps/registry.js';
import { directChatId, parseDirectChatId, isParticipant, peerWechatId } from './lib/chatId.js';
import { mergeRemoteMessages } from './lib/merge.js';

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
assert.ok(seed.chats[0].syncChatId?.startsWith('direct:'), 'seed chats have syncChatId');

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

// --- QR ---
const qr = profileQrValue('dr_samar');
assert.ok(qr.startsWith('wechat://user/'));
assert.deepEqual(parseProfileQr(qr), { wechatId: 'dr_samar' });
assert.deepEqual(parseProfileQr('david_wu'), { wechatId: 'david_wu' });

// --- mini apps ---
assert.ok(MINI_APPS.length >= 3);
assert.ok(getMiniApp('calculator')?.name);
assert.equal(getMiniApp('missing'), undefined);

// --- wallet in seed ---
assert.ok(seed.profile.wallet?.balance > 0);
assert.ok(seed.contacts.every((c) => c.wechatId));

// --- chatId ---
assert.equal(directChatId('dr_samar', 'li_ming'), 'direct:dr_samar:li_ming');
assert.equal(directChatId('Li_Ming', 'dr_samar'), 'direct:dr_samar:li_ming');
assert.deepEqual(parseDirectChatId('direct:a:b'), { a: 'a', b: 'b' });
assert.ok(isParticipant('direct:dr_samar:li_ming', 'dr_samar'));
assert.equal(peerWechatId('direct:dr_samar:li_ming', 'dr_samar'), 'li_ming');

// --- merge remote message ---
const remoteRow = {
  id: 'remote-msg-1',
  chat_id: 'direct:dr_samar:li_ming',
  sender_wechat_id: 'li_ming',
  content: '你好 from cloud',
  msg_type: 'text',
  created_at: new Date().toISOString(),
};
const merged = mergeRemoteMessages(seed, [remoteRow], 'dr_samar');
const syncedChat = merged.chats.find((c) => c.syncChatId === 'direct:dr_samar:li_ming');
assert.ok(syncedChat, 'creates or updates synced chat');
const syncedMsgs = merged.messages[syncedChat.id];
assert.ok(syncedMsgs.some((m) => m.content === '你好 from cloud'));

console.log('wechat.test.mjs: ok');
