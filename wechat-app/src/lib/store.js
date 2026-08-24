import { createContext, createElement, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { createSeedState, ME_ID } from './seedData.js';
import { ONBOARDING_KEY } from './onboarding.js';
import { uid } from './format.js';
import { directChatId } from './chatId.js';
import {
  isWeChatSyncAvailable,
  startWeChatSync,
  pushMessage,
  pushMoment,
  updateMomentRemote,
  upsertProfile,
  fetchProfileByWechatId,
} from './sync.js';

const STORAGE_KEY = 'weichat_v1';

export { STORAGE_KEY };

const defaultSyncMeta = { mode: 'local', error: null, lastSync: null };

export function isOnboardingComplete() {
  try {
    if (localStorage.getItem(ONBOARDING_KEY) === '1') return true;
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

/** Apply onboarding choice and persist. */
export function initWeChatStore(initialState) {
  state = { ...initialState, syncMeta: { ...defaultSyncMeta } };
  saveState(state);
  emit();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { ...createSeedState(), syncMeta: { ...defaultSyncMeta } };
}

function saveState(state) {
  const { syncMeta, ...persistable } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...persistable, syncMeta: syncMeta || defaultSyncMeta }));
}

let state = typeof localStorage !== 'undefined' ? loadState() : { ...createSeedState(), syncMeta: { ...defaultSyncMeta } };
if (!state.syncMeta) state = { ...state, syncMeta: { ...defaultSyncMeta } };

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

function setSyncMeta(meta) {
  setState((s) => ({ ...s, syncMeta: { ...s.syncMeta, ...meta } }));
}

function applyRemotePatch(patch) {
  setState((s) => {
    const next = typeof patch === 'function' ? patch(s) : { ...s, ...patch };
    return { ...next, syncMeta: s.syncMeta };
  });
}

function resolveSyncChatId(chat, snapshot = state) {
  if (chat?.syncChatId) return chat.syncChatId;
  if (chat?.type !== 'direct') return null;
  const contact = getContact(snapshot, chat.contactId);
  if (!contact?.wechatId || contact.isGroup) return null;
  return directChatId(snapshot.profile.wechatId, contact.wechatId);
}

/** Reset to demo seed (for testing / demo). */
export function resetWeChatStore() {
  state = { ...createSeedState(), syncMeta: { ...defaultSyncMeta } };
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

function syncPushMessage(msg, chatId) {
  const chat = state.chats.find((c) => c.id === chatId);
  const syncId = resolveSyncChatId(chat);
  if (!syncId || !isWeChatSyncAvailable()) return;
  pushMessage({
    id: msg.id,
    chatId: syncId,
    senderWechatId: state.profile.wechatId,
    content: msg.content,
    type: msg.type,
  }).catch(() => setSyncMeta({ mode: 'offline', error: 'push_failed' }));
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
    if (senderId === ME_ID) syncPushMessage(msg, chatId);
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
    if (isWeChatSyncAvailable()) {
      upsertProfile({ ...state.profile, ...patch }).catch(() => {});
    }
  },

  toggleMomentLike(momentId, userId = ME_ID) {
    setState((s) => {
      const moments = s.moments.map((m) => {
        if (m.id !== momentId) return m;
        const likes = m.likes.includes(userId)
          ? m.likes.filter((id) => id !== userId)
          : [...m.likes, userId];
        return { ...m, likes };
      });
      const updated = moments.find((m) => m.id === momentId);
      if (updated && isWeChatSyncAvailable()) {
        updateMomentRemote(updated, s.profile.wechatId).catch(() => {});
      }
      return { ...s, moments };
    });
  },

  addMomentComment(momentId, text, authorId = ME_ID) {
    if (!text?.trim()) return;
    setState((s) => {
      const moments = s.moments.map((m) =>
        m.id === momentId
          ? {
              ...m,
              comments: [...m.comments, { id: uid('cm'), authorId, text: text.trim() }],
            }
          : m,
      );
      const updated = moments.find((m) => m.id === momentId);
      if (updated && isWeChatSyncAvailable()) {
        updateMomentRemote(updated, s.profile.wechatId).catch(() => {});
      }
      return { ...s, moments };
    });
  },

  publishMoment(content, images = []) {
    const now = Date.now();
    const moment = {
      id: uid('mo'),
      authorId: ME_ID,
      content: content.trim(),
      images,
      likes: [],
      comments: [],
      time: now,
    };
    setState((s) => ({
      ...s,
      moments: [moment, ...s.moments],
    }));
    if (isWeChatSyncAvailable()) {
      pushMoment(moment, state.profile.wechatId).catch(() => {});
    }
  },

  startChat(contactId) {
    const contact = getContact(state, contactId);
    const syncChatId = contact?.wechatId && !contact.isGroup
      ? directChatId(state.profile.wechatId, contact.wechatId)
      : null;

    if (syncChatId) {
      const bySync = state.chats.find((c) => c.syncChatId === syncChatId);
      if (bySync) return bySync.id;
    }

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
          syncChatId,
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

  addContactByWechatId(wechatId, { name, avatar = '👤' } = {}) {
    const id = wechatId?.trim()?.toLowerCase();
    if (!id) return { ok: false, error: 'WeChat ID חסר' };
    if (id === state.profile.wechatId?.toLowerCase()) {
      return { ok: false, error: 'זה הפרופיל שלך' };
    }
    const existing = state.contacts.find((c) => c.wechatId?.toLowerCase() === id);
    if (existing) return { ok: true, contact: existing, existed: true };

    const contact = {
      id: uid('c'),
      name: name || id,
      wechatId: id,
      avatar,
      remark: '',
      region: '',
      tags: [],
    };
    setState((s) => ({ ...s, contacts: [...s.contacts, contact] }));

    if (isWeChatSyncAvailable()) {
      fetchProfileByWechatId(id).then((res) => {
        if (!res.ok || !res.data) return;
        setState((s) => ({
          ...s,
          contacts: s.contacts.map((c) =>
            c.wechatId?.toLowerCase() === id
              ? {
                  ...c,
                  name: res.data.display_name || c.name,
                  avatar: res.data.avatar || c.avatar,
                  region: res.data.region || c.region,
                }
              : c,
          ),
        }));
      }).catch(() => {});
    }

    return { ok: true, contact, existed: false };
  },

  updateWallet(delta) {
    setState((s) => ({
      ...s,
      profile: {
        ...s.profile,
        wallet: {
          ...s.profile.wallet,
          balance: Math.max(0, (s.profile.wallet?.balance ?? 0) + delta),
        },
      },
    }));
  },
};

const WeChatStoreContext = createContext(null);

export function WeChatProvider({ children }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    let stop = () => {};
    startWeChatSync(snapshot.profile, {
      onPatch: applyRemotePatch,
      onStatus: setSyncMeta,
    }).then((fn) => {
      stop = fn || (() => {});
    });
    return () => stop();
  }, [snapshot.profile.wechatId]);

  const value = useMemo(
    () => ({
      state: snapshot,
      syncMeta: snapshot.syncMeta || defaultSyncMeta,
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
        (c.remark && c.remark.toLowerCase().includes(q)) ||
        (c.wechatId && c.wechatId.toLowerCase().includes(q)),
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

export { ME_ID, sortChats, resolveSyncChatId };
