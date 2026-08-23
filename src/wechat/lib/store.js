import { createContext, createElement, useContext, useMemo, useSyncExternalStore } from 'react';
import { createSeedState, ME_ID } from './seedData.js';
import { uid } from './format.js';

const STORAGE_KEY = 'wechat_mvp_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return createSeedState();
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = typeof localStorage !== 'undefined' ? loadState() : createSeedState();
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

function setState(next) {
  state = typeof next === 'function' ? next(state) : next;
  saveState(state);
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

/** Reset to demo seed (for testing / demo). */
export function resetWeChatStore() {
  state = createSeedState();
  saveState(state);
  emit();
}

export function getContact(stateSnapshot, contactId) {
  return stateSnapshot.contacts.find((c) => c.id === contactId);
}

export function getChatTitle(stateSnapshot, chat) {
  const contact = getContact(stateSnapshot, chat.contactId);
  if (!contact) return 'צ\'אט';
  if (chat.type === 'group') return contact.name;
  return contact.remark || contact.name;
}

export function getChatAvatar(stateSnapshot, chat) {
  return getContact(stateSnapshot, chat.contactId)?.avatar || '💬';
}

function sortChats(chats) {
  return [...chats].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.lastTime || 0) - (a.lastTime || 0);
  });
}

export const wechatActions = {
  sendMessage(chatId, content, senderId = ME_ID) {
    if (!content?.trim()) return;
    const now = Date.now();
    const msg = { id: uid('msg'), senderId, type: 'text', content: content.trim(), time: now };
    setState((s) => ({
      ...s,
      messages: {
        ...s.messages,
        [chatId]: [...(s.messages[chatId] || []), msg],
      },
      chats: sortChats(
        s.chats.map((c) =>
          c.id === chatId
            ? { ...c, lastMessage: content.trim(), lastTime: now, unread: 0 }
            : c,
        ),
      ),
    }));
  },

  markChatRead(chatId) {
    setState((s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)),
    }));
  },

  togglePin(chatId) {
    setState((s) => ({
      ...s,
      chats: sortChats(
        s.chats.map((c) => (c.id === chatId ? { ...c, pinned: !c.pinned } : c)),
      ),
    }));
  },

  updateProfile(patch) {
    setState((s) => ({
      ...s,
      profile: { ...s.profile, ...patch },
    }));
  },

  toggleMomentLike(momentId, userId = ME_ID) {
    setState((s) => ({
      ...s,
      moments: s.moments.map((m) => {
        if (m.id !== momentId) return m;
        const likes = m.likes.includes(userId)
          ? m.likes.filter((id) => id !== userId)
          : [...m.likes, userId];
        return { ...m, likes };
      }),
    }));
  },

  addMomentComment(momentId, text, authorId = ME_ID) {
    if (!text?.trim()) return;
    setState((s) => ({
      ...s,
      moments: s.moments.map((m) =>
        m.id === momentId
          ? {
              ...m,
              comments: [...m.comments, { id: uid('cm'), authorId, text: text.trim() }],
            }
          : m,
      ),
    }));
  },

  publishMoment(content, images = []) {
    const now = Date.now();
    setState((s) => ({
      ...s,
      moments: [
        {
          id: uid('mo'),
          authorId: ME_ID,
          content: content.trim(),
          images,
          likes: [],
          comments: [],
          time: now,
        },
        ...s.moments,
      ],
    }));
  },

  startChat(contactId) {
    const existing = state.chats.find(
      (c) => c.type === 'direct' && c.contactId === contactId,
    );
    if (existing) return existing.id;

    const chatId = uid('chat');
    setState((s) => ({
      ...s,
      chats: sortChats([
        {
          id: chatId,
          contactId,
          type: 'direct',
          pinned: false,
          muted: false,
          lastMessage: '',
          lastTime: Date.now(),
          unread: 0,
        },
        ...s.chats,
      ]),
      messages: { ...s.messages, [chatId]: [] },
    }));
    return chatId;
  },
};

const WeChatStoreContext = createContext(null);

export function WeChatProvider({ children }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const value = useMemo(
    () => ({
      state: snapshot,
      actions: wechatActions,
    }),
    [snapshot],
  );

  return createElement(WeChatStoreContext.Provider, { value }, children);
}

export function useWeChat() {
  const ctx = useContext(WeChatStoreContext);
  if (!ctx) throw new Error('useWeChat must be used within WeChatProvider');
  return ctx;
}

export function useWeChatSearch(query) {
  const { state } = useWeChat();
  const q = query.trim().toLowerCase();
  return useMemo(() => {
    if (!q) return { chats: state.chats, contacts: state.contacts };
    const contacts = state.contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.remark && c.remark.toLowerCase().includes(q)),
    );
    const contactIds = new Set(contacts.map((c) => c.id));
    const chats = state.chats.filter(
      (ch) =>
        contactIds.has(ch.contactId) ||
        ch.lastMessage.toLowerCase().includes(q),
    );
    return { chats, contacts };
  }, [state.chats, state.contacts, q]);
}

/** Hook for filtered sorted chats */
export function useSortedChats(filterQuery = '') {
  const { state } = useWeChat();
  return useMemo(() => {
    let chats = [...state.chats];
    const q = filterQuery.trim().toLowerCase();
    if (q) {
      chats = chats.filter((ch) => {
        const title = getChatTitle(state, ch).toLowerCase();
        return title.includes(q) || ch.lastMessage.toLowerCase().includes(q);
      });
    }
    return sortChats(chats);
  }, [state, filterQuery]);
}

export { ME_ID, sortChats };
