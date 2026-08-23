/**
 * WeChat sync — Supabase Realtime when configured, BroadcastChannel mock otherwise.
 */

import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase/client.js';
import { loadStoredSession } from '@/lib/auth/supabaseAuth.js';
import { directChatId } from './chatId.js';
import {
  mergeRemoteMessages,
  mergeRemoteMoments,
  mergeRemoteProfiles,
} from './merge.js';
import {
  isMockSyncAvailable,
  startMockSync,
  mockPushMessage,
  mockPushMoment,
  mockUpsertProfile,
} from './mockSync.js';

let client = null;
let channel = null;
let usingMock = false;

function getClient() {
  if (client) return client;
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  const session = loadStoredSession();
  client = createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: session?.access_token
      ? { headers: { Authorization: `Bearer ${session.access_token}` } }
      : {},
  });

  if (session?.access_token) {
    client.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token || '',
    }).catch(() => {});
  }

  return client;
}

export function getSyncBackend() {
  if (isSupabaseConfigured()) return 'supabase';
  if (isMockSyncAvailable()) return 'mock';
  return 'local';
}

export function isWeChatSyncAvailable() {
  return getSyncBackend() !== 'local';
}

function profilePayload(profile) {
  return {
    wechat_id: profile.wechatId,
    display_name: profile.name,
    avatar: profile.avatar || '👤',
    status: profile.status || '',
    region: profile.region || '',
    wallet_balance: profile.wallet?.balance ?? 0,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertProfile(profile) {
  if (!profile?.wechatId) return { ok: false, reason: 'no_profile' };
  if (!isSupabaseConfigured()) {
    return isMockSyncAvailable() ? mockUpsertProfile(profile) : { ok: false, reason: 'no_client' };
  }

  const sb = getClient();
  if (!sb) return { ok: false, reason: 'no_client' };

  const session = loadStoredSession();
  const row = {
    ...profilePayload(profile),
    ...(session?.user?.id ? { auth_user_id: session.user.id } : {}),
  };

  const { error } = await sb
    .from('wechat_profiles')
    .upsert(row, { onConflict: 'wechat_id' });

  if (error) return { ok: false, reason: 'upsert_failed', error: error.message };
  return { ok: true };
}

export async function fetchProfileByWechatId(wechatId) {
  const sb = getClient();
  if (!sb) return { ok: false, reason: 'no_client' };

  const { data, error } = await sb
    .from('wechat_profiles')
    .select('*')
    .eq('wechat_id', wechatId)
    .maybeSingle();

  if (error) return { ok: false, reason: 'fetch_failed', error: error.message };
  return { ok: true, data };
}

export async function fetchAllProfiles() {
  const sb = getClient();
  if (!sb) return { ok: false, reason: 'no_client', data: [] };

  const { data, error } = await sb
    .from('wechat_profiles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) return { ok: false, reason: 'fetch_failed', data: [], error: error.message };
  return { ok: true, data: data || [] };
}

export async function fetchMessagesForUser(wechatId) {
  const sb = getClient();
  if (!sb) return { ok: false, reason: 'no_client', data: [] };

  const me = wechatId?.toLowerCase();
  const { data, error } = await sb
    .from('wechat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) return { ok: false, reason: 'fetch_failed', data: [], error: error.message };

  const filtered = (data || []).filter(
    (m) =>
      m.sender_wechat_id?.toLowerCase() === me
      || m.chat_id?.toLowerCase().includes(me),
  );
  return { ok: true, data: filtered };
}

export async function fetchMoments() {
  const sb = getClient();
  if (!sb) return { ok: false, reason: 'no_client', data: [] };

  const { data, error } = await sb
    .from('wechat_moments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return { ok: false, reason: 'fetch_failed', data: [], error: error.message };
  return { ok: true, data: data || [] };
}

export async function pushMessage({ id, chatId, senderWechatId, content, type = 'text' }) {
  if (!isSupabaseConfigured()) {
    return isMockSyncAvailable()
      ? mockPushMessage({ id, chatId, senderWechatId, content, type })
      : { ok: false, reason: 'no_client' };
  }

  const sb = getClient();
  if (!sb) return { ok: false, reason: 'no_client' };

  const { error } = await sb.from('wechat_messages').insert({
    id,
    chat_id: chatId,
    sender_wechat_id: senderWechatId,
    content,
    msg_type: type,
    created_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === '23505') return { ok: true, duplicate: true };
    return { ok: false, reason: 'insert_failed', error: error.message };
  }
  return { ok: true };
}

export async function pushMoment(moment, authorWechatId) {
  if (!isSupabaseConfigured()) {
    return isMockSyncAvailable()
      ? mockPushMoment(moment, authorWechatId)
      : { ok: false, reason: 'no_client' };
  }

  const sb = getClient();
  if (!sb) return { ok: false, reason: 'no_client' };

  const { error } = await sb.from('wechat_moments').upsert({
    id: moment.id,
    author_wechat_id: authorWechatId,
    content: moment.content,
    images: moment.images,
    likes: moment.likes,
    comments: moment.comments,
    created_at: new Date(moment.time).toISOString(),
  });

  if (error) return { ok: false, reason: 'upsert_failed', error: error.message };
  return { ok: true };
}

export async function updateMomentRemote(moment, authorWechatId) {
  const sb = getClient();
  if (!sb) return { ok: false, reason: 'no_client' };

  const { error } = await sb
    .from('wechat_moments')
    .update({ likes: moment.likes, comments: moment.comments })
    .eq('id', moment.id)
    .eq('author_wechat_id', authorWechatId);

  if (error) return { ok: false, reason: 'update_failed', error: error.message };
  return { ok: true };
}

/** Full initial pull + Realtime subscription (Supabase) or BroadcastChannel (mock). */
export async function startWeChatSync(profile, { onPatch, onStatus }) {
  if (!isSupabaseConfigured()) {
    if (isMockSyncAvailable()) {
      usingMock = true;
      mockUpsertProfile(profile);
      return startMockSync(profile, { onPatch, onStatus });
    }
    onStatus?.({ mode: 'local', error: null });
    return () => {};
  }

  usingMock = false;
  onStatus?.({ mode: 'syncing', error: null });

  const upsert = await upsertProfile(profile);
  if (!upsert.ok) {
    onStatus?.({ mode: 'offline', error: upsert.error || upsert.reason });
    return () => {};
  }

  const [profilesRes, messagesRes, momentsRes] = await Promise.all([
    fetchAllProfiles(),
    fetchMessagesForUser(profile.wechatId),
    fetchMoments(),
  ]);

  const profiles = profilesRes.ok ? profilesRes.data : [];
  const messages = messagesRes.ok ? messagesRes.data : [];
  const moments = momentsRes.ok ? momentsRes.data : [];

  onPatch?.((prev) => {
    let next = prev;
    if (profiles.length) next = mergeRemoteProfiles(next, profiles);
    if (messages.length) next = mergeRemoteMessages(next, messages, profile.wechatId);
    if (moments.length) next = mergeRemoteMoments(next, moments);
    return next;
  });
  onStatus?.({
    mode: 'live',
    error: null,
    lastSync: Date.now(),
    tables: {
      profiles: profiles.length,
      messages: messages.length,
      moments: moments.length,
    },
  });

  const sb = getClient();
  if (!sb) return () => {};

  if (channel) {
    sb.removeChannel(channel);
    channel = null;
  }

  channel = sb
    .channel('wechat-mvp-sync')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'wechat_messages' },
      (payload) => {
        const row = payload.new;
        if (!row) return;
        onPatch?.((prev) => mergeRemoteMessages(prev, [row], profile.wechatId));
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'wechat_moments' },
      (payload) => {
        const row = payload.new;
        if (!row) return;
        onPatch?.((prev) => mergeRemoteMoments(prev, [row]));
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'wechat_profiles' },
      (payload) => {
        const row = payload.new;
        if (!row) return;
        onPatch?.((prev) => mergeRemoteProfiles(prev, [row]));
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        onStatus?.({ mode: 'offline', error: 'realtime_error' });
      } else if (status === 'SUBSCRIBED') {
        onStatus?.({ mode: 'live', error: null, lastSync: Date.now() });
      }
    });

  return () => {
    if (channel && sb) {
      sb.removeChannel(channel);
      channel = null;
    }
  };
}

export { directChatId };
