/** Merge remote Supabase rows into local WeChat state. */

import { uid } from './format.js';
import { peerWechatId } from './chatId.js';

export function rowToMessage(row, contactIdMap) {
  const senderWechat = row.sender_wechat_id?.toLowerCase();
  return {
    id: row.id,
    senderId: contactIdMap[senderWechat] || senderWechat,
    type: row.msg_type || 'text',
    content: row.content,
    time: new Date(row.created_at).getTime(),
    _remote: true,
  };
}

export function profileRowToContact(row, myWechatId) {
  const wid = row.wechat_id?.toLowerCase();
  if (!wid || wid === myWechatId?.toLowerCase()) return null;
  return {
    id: `remote-${wid}`,
    name: row.display_name || row.wechat_id,
    wechatId: row.wechat_id,
    avatar: row.avatar || '👤',
    remark: '',
    region: row.region || '',
    tags: ['remote'],
    _remote: true,
  };
}

export function buildContactIdMap(contacts, profile) {
  const map = { [profile.wechatId?.toLowerCase()]: profile.id };
  for (const c of contacts) {
    if (c.wechatId) map[c.wechatId.toLowerCase()] = c.id;
  }
  return map;
}

export function wechatIdToSenderId(wechatId, contacts, profile) {
  const key = wechatId?.toLowerCase();
  if (key === profile.wechatId?.toLowerCase()) return profile.id;
  const c = contacts.find((x) => x.wechatId?.toLowerCase() === key);
  return c?.id || `remote-${key}`;
}

export function mergeRemoteMessages(state, remoteRows, myWechatId) {
  const contactIdMap = buildContactIdMap(state.contacts, state.profile);
  const messages = { ...state.messages };
  const chatsBySyncId = new Map(
    state.chats.filter((c) => c.syncChatId).map((c) => [c.syncChatId, c]),
  );
  let contacts = [...state.contacts];
  let chats = [...state.chats];

  for (const row of remoteRows) {
    const syncChatId = row.chat_id;
    let chat = chatsBySyncId.get(syncChatId);

    if (!chat) {
      const peer = peerWechatId(syncChatId, myWechatId);
      if (!peer) continue;

      let contact = contacts.find((c) => c.wechatId?.toLowerCase() === peer);
      if (!contact) {
        contact = {
          id: `remote-${peer}`,
          name: peer,
          wechatId: peer,
          avatar: '👤',
          remark: '',
          region: '',
          tags: ['remote'],
          _remote: true,
        };
        contacts = [...contacts, contact];
      }

      chat = {
        id: uid('chat'),
        contactId: contact.id,
        syncChatId,
        type: 'direct',
        pinned: false,
        muted: false,
        lastMessage: '',
        lastTime: 0,
        unread: 0,
      };
      chats = [...chats, chat];
      chatsBySyncId.set(syncChatId, chat);
      messages[chat.id] = messages[chat.id] || [];
    }

    const list = messages[chat.id] || [];
    if (list.some((m) => m.id === row.id)) continue;

    const msg = rowToMessage(row, contactIdMap);
    messages[chat.id] = [...list, msg].sort((a, b) => a.time - b.time);

    const last = messages[chat.id][messages[chat.id].length - 1];
    const isMine = row.sender_wechat_id?.toLowerCase() === myWechatId?.toLowerCase();
    chats = chats.map((c) =>
      c.id === chat.id
        ? {
            ...c,
            lastMessage: last.content,
            lastTime: last.time,
            unread: isMine ? c.unread : (c.unread || 0) + 1,
          }
        : c,
    );
  }

  return { ...state, contacts, chats, messages };
}

export function mergeRemoteProfiles(state, profileRows) {
  let contacts = [...state.contacts];
  const myId = state.profile.wechatId?.toLowerCase();

  for (const row of profileRows) {
    const c = profileRowToContact(row, myId);
    if (!c) continue;
    const exists = contacts.some((x) => x.wechatId?.toLowerCase() === c.wechatId.toLowerCase());
    if (!exists) contacts = [...contacts, c];
  }

  return { ...state, contacts };
}

export function rowToMoment(row, contacts, profile) {
  const authorKey = row.author_wechat_id?.toLowerCase();
  const authorId =
    authorKey === profile.wechatId?.toLowerCase()
      ? profile.id
      : contacts.find((c) => c.wechatId?.toLowerCase() === authorKey)?.id || `remote-${authorKey}`;

  return {
    id: row.id,
    authorId,
    content: row.content,
    images: row.images || [],
    likes: row.likes || [],
    comments: row.comments || [],
    time: new Date(row.created_at).getTime(),
    _remote: true,
  };
}

export function mergeRemoteMoments(state, momentRows) {
  const existing = new Set(state.moments.map((m) => m.id));
  const added = momentRows
    .filter((r) => !existing.has(r.id))
    .map((r) => rowToMoment(r, state.contacts, state.profile));
  if (!added.length) return state;
  return {
    ...state,
    moments: [...added, ...state.moments].sort((a, b) => b.time - a.time),
  };
}
