/**
 * Relay sync — zero-cost realtime (SSE) + history pull from relay server.
 */

import { mergeRemoteMessages, mergeRemoteMoments, mergeRemoteProfiles } from './merge.js';
import { getRelayUrl } from './zeroCost.js';

const CHANNEL_NAME = 'weichat-mock-sync-v1';

let channel = null;
let myWechatId = null;
let es = null;
let pollTimer = null;
let relayOk = false;
let relayUrl = '';

export function isRelaySyncAvailable() {
  return typeof EventSource !== 'undefined' || typeof BroadcastChannel !== 'undefined';
}

export function getRelayStatus() {
  return { relayOk, relayUrl };
}

async function probeRelay() {
  relayUrl = getRelayUrl();
  if (!relayUrl) {
    relayOk = false;
    return false;
  }
  try {
    const res = await fetch(`${relayUrl}/health`, { signal: AbortSignal.timeout(4000) });
    relayOk = res.ok;
  } catch {
    relayOk = false;
  }
  return relayOk;
}

async function pullHistory(profile, onPatch) {
  if (!relayOk || !profile?.wechatId) return;
  try {
    const res = await fetch(
      `${relayUrl}/sync?wechatId=${encodeURIComponent(profile.wechatId)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return;
    const data = await res.json();
    onPatch?.((prev) => {
      let next = prev;
      if (data.profiles?.length) next = mergeRemoteProfiles(next, data.profiles);
      if (data.messages?.length) next = mergeRemoteMessages(next, data.messages, profile.wechatId);
      if (data.moments?.length) next = mergeRemoteMoments(next, data.moments);
      return next;
    });
  } catch {
    /* offline */
  }
}

async function relayPost(type, payload) {
  if (!relayOk || !relayUrl) return;
  try {
    await fetch(`${relayUrl}/broadcast`, {
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

export function relayBroadcastMessage(row) {
  post('message', row);
}

export function relayBroadcastMoment(row) {
  post('moment', row);
}

export function relayBroadcastProfile(row) {
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

function startPolling(profile, onPatch) {
  if (pollTimer) return;
  pollTimer = setInterval(() => pullHistory(profile, onPatch), 5000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function connectSse(profile, onPatch, onStatus) {
  if (typeof EventSource === 'undefined') {
    startPolling(profile, onPatch);
    return;
  }

  es = new EventSource(`${relayUrl}/events`);
  es.onopen = () => stopPolling();

  es.onerror = () => {
    es?.close();
    es = null;
    startPolling(profile, onPatch);
    onStatus?.({
      mode: 'live',
      error: 'sse_fallback_poll',
      zeroCost: true,
      backend: 'relay',
      relay: true,
      relayUrl,
      poll: true,
      lastSync: Date.now(),
    });
  };

  const bind = (eventType) => {
    es.addEventListener(eventType, (ev) => {
      try {
        const { payload, from } = JSON.parse(ev.data);
        handleEvent(eventType, payload, from, { onPatch });
      } catch { /* ignore */ }
    });
  };
  bind('message');
  bind('moment');
  bind('profile');
}

export function startRelaySync(profile, { onPatch, onStatus }) {
  myWechatId = profile.wechatId?.toLowerCase();

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (ev) => {
      const { type, payload, from } = ev.data || {};
      handleEvent(type, payload, from, { onPatch });
    };
  }

  onStatus?.({ mode: 'syncing', error: null, zeroCost: true, backend: 'relay' });

  probeRelay().then(async (ok) => {
    if (ok) {
      await pullHistory(profile, onPatch);
      connectSse(profile, onPatch, onStatus);
    }

    onStatus?.({
      mode: ok ? 'live' : 'local',
      error: ok ? null : 'relay_offline',
      zeroCost: true,
      backend: 'relay',
      relay: ok,
      relayUrl: ok ? relayUrl : null,
      lastSync: Date.now(),
    });
  });

  relayBroadcastProfile({
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
    stopPolling();
  };
}

export async function relayFetchProfile(wechatId) {
  await probeRelay();
  if (!relayOk || !relayUrl || !wechatId) {
    return { ok: false, reason: 'no_client' };
  }
  try {
    const res = await fetch(
      `${relayUrl}/profile?wechatId=${encodeURIComponent(wechatId)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return { ok: false, reason: 'fetch_failed' };
    const data = await res.json();
    if (!data?.profile) return { ok: false, reason: 'not_found' };
    return { ok: true, data: data.profile };
  } catch {
    return { ok: false, reason: 'fetch_failed' };
  }
}

export function relayUpsertProfile(profile) {
  relayBroadcastProfile({
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

export function relayPushMessage({ id, chatId, senderWechatId, content, type = 'text' }) {
  relayBroadcastMessage({
    id,
    chat_id: chatId,
    sender_wechat_id: senderWechatId,
    content,
    msg_type: type,
    created_at: new Date().toISOString(),
  });
  return { ok: true };
}

export function relayPushMoment(moment, authorWechatId) {
  relayBroadcastMoment({
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

export function relayUpdateMoment(moment, authorWechatId) {
  relayBroadcastMoment({
    id: moment.id,
    author_wechat_id: authorWechatId,
    content: moment.content,
    images: moment.images,
    likes: moment.likes,
    comments: moment.comments,
    created_at: new Date(moment.time).toISOString(),
    updated: true,
  });
  return { ok: true };
}
