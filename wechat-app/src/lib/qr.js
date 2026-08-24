/** WeChat-style QR payload encoding/decoding. */

export const QR_SCHEME = 'wechat://user/';

export function profileQrValue(wechatId) {
  return `${QR_SCHEME}${encodeURIComponent(wechatId)}`;
}

export function parseProfileQr(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith(QR_SCHEME)) {
    const id = decodeURIComponent(trimmed.slice(QR_SCHEME.length));
    return id ? { wechatId: id } : null;
  }
  // Plain wechat id fallback
  if (/^[a-zA-Z0-9_.-]{3,32}$/.test(trimmed)) {
    return { wechatId: trimmed };
  }
  return null;
}

export function findContactByWechatId(state, wechatId) {
  const id = wechatId?.toLowerCase();
  return state.contacts.find((c) => c.wechatId?.toLowerCase() === id);
}
