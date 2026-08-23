/** Deterministic chat IDs for Supabase sync. */

export function directChatId(wechatIdA, wechatIdB) {
  const a = String(wechatIdA || '').trim().toLowerCase();
  const b = String(wechatIdB || '').trim().toLowerCase();
  if (!a || !b) return null;
  if (a === b) return null;
  return `direct:${[a, b].sort().join(':')}`;
}

export function parseDirectChatId(chatId) {
  if (!chatId?.startsWith('direct:')) return null;
  const parts = chatId.slice('direct:'.length).split(':');
  if (parts.length !== 2) return null;
  return { a: parts[0], b: parts[1] };
}

export function isParticipant(chatId, wechatId) {
  const parsed = parseDirectChatId(chatId);
  if (!parsed) return false;
  const me = String(wechatId || '').trim().toLowerCase();
  return parsed.a === me || parsed.b === me;
}

export function peerWechatId(chatId, myWechatId) {
  const parsed = parseDirectChatId(chatId);
  if (!parsed) return null;
  const me = String(myWechatId || '').trim().toLowerCase();
  if (parsed.a === me) return parsed.b;
  if (parsed.b === me) return parsed.a;
  return null;
}
