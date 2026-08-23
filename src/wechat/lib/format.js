/** Time formatting helpers (WeChat-style). */

export function formatChatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) {
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }
  if (isYesterday) return 'אתמול';

  const diffDays = Math.floor((now - d) / (24 * 60 * 60 * 1000));
  if (diffDays < 7) {
    return d.toLocaleDateString('he-IL', { weekday: 'short' });
  }
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
}

export function formatMessageTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

export function formatMomentTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 60) return `לפני ${diffMin} דק׳`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `לפני ${diffHr} שע׳`;
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
