/**
 * Dev/demo sync — BroadcastChannel (same context) + HTTP relay (cross-tab/incognito).
 */

import { mergeRemoteMessages, mergeRemoteMoments, mergeRemoteProfiles } from './merge.js';

const CHANNEL_NAME = 'wechat-mvp-mock-sync-v1';
const RELAY_URL = import.meta.env?.VITE_WECHAT_RELAY_URL || 'http://127.0.0.1:8765';

let channel = null;
let myWechatId = null;
let es = null;
let relayOk = false;

export function isMockSyncAvailable() {
  return typeof BroadcastChannel !== 'undefined' || typeof EventSource !== 'undefined';
}

async function probeRelay() {
  try {
    const res = await fetch(`${RELAY_URL}/health`, { signal: AbortSignal.timeout(2000) });
    relayOk = res.ok;
  } catch {
    relayOk = false;
  }
  return relayOk;
}

async function relayPost(type, payload) {
  if (!relayOk) return;
  try {
    await fetch(`${RELAY_URL}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload, from: myWechatId }),
    });
  } catch {
    relayOk = false;
  }
}

function post(type, payload) {
  channel?.postMessage({ type, payload, from: myWechatId });
  relayPost(type, payload);
}

export function mockBroadcastMessage(row) {
  post('message', row);
}

export function mockBroadcastMoment(row) {
  post('moment', row);
}

export function mockBroadcastProfile(row) {
  post('profile', row);
}

function handleEvent(type, payload, from, { onPatch }) {
  if (from && from === myWechatId) return;

  if (type === 'message' && payload) {
    onPatch?.((prev) => mergeRemoteMessages(prev, [payload], prev.profile.wechatId));
  }
  if (type === 'moment' && payload) {
    onPatch?.((prev) => mergeRemoteMoments(prev, [payload]));
  }
  if (type === 'profile' && payload) {
    onPatch?.((prev) => mergeRemoteProfiles(prev, [payload]));
  }
}

export function startMockSync(profile, { onPatch, onStatus }) {
  myWechatId = profile.wechatId?.toLowerCase();

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (ev) => {
      const { type, payload, from } = ev.data || {};
      handleEvent(type, payload, from, { onPatch });
    };
  }

  probeRelay().then((ok) => {
    if (ok && typeof EventSource !== 'undefined') {
      es = new EventSource(`${RELAY_URL}/events`);
      es.addEventListener('message', (ev) => {
        try {
          const { payload, from } = JSON.parse(ev.data);
          handleEvent('message', payload, from, { onPatch });
        } catch { /* ignore */ }
      });
      es.addEventListener('moment', (ev) => {
        try {
          const { payload, from } = JSON.parse(ev.data);
          handleEvent('moment', payload, from, { onPatch });
        } catch { /* ignore */ }
      });
      es.addEventListener('profile', (ev) => {
        try {
          const { payload, from } = JSON.parse(ev.data);
          handleEvent('profile', payload, from, { onPatch });
        } catch { /* ignore */ }
      });
    }
    onStatus?.({
      mode: 'live',
      error: null,
      mock: true,
      relay: ok,
      lastSync: Date.now(),
    });
  });

  mockBroadcastProfile({
    wechat_id: profile.wechatId,
    display_name: profile.name,
    avatar: profile.avatar || '👤',
    status: profile.status || '',
    region: profile.region || '',
    wallet_balance: profile.wallet?.balance ?? 0,
    updated_at: new Date().toISOString(),
  });

  return () => {
    channel?.close();
    channel = null;
    es?.close();
    es = null;
  };
}

export function mockUpsertProfile(profile) {
  mockBroadcastProfile({
    wechat_id: profile.wechatId,
    display_name: profile.name,
    avatar: profile.avatar || '👤',
    status: profile.status || '',
    region: profile.region || '',
    wallet_balance: profile.wallet?.balance ?? 0,
    updated_at: new Date().toISOString(),
  });
  return { ok: true };
}

export function mockPushMessage({ id, chatId, senderWechatId, content, type = 'text' }) {
  mockBroadcastMessage({
    id,
    chat_id: chatId,
    sender_wechat_id: senderWechatId,
    content,
    msg_type: type,
    created_at: new Date().toISOString(),
  });
  return { ok: true };
}

export function mockPushMoment(moment, authorWechatId) {
  mockBroadcastMoment({
    id: moment.id,
    author_wechat_id: authorWechatId,
    content: moment.content,
    images: moment.images,
    likes: moment.likes,
    comments: moment.comments,
    created_at: new Date(moment.time).toISOString(),
  });
  return { ok: true };
}
