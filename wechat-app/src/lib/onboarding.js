/** Fresh state for new users (zero-cost onboarding). */

import { ME_ID } from './seedData.js';

export function createFreshState({ wechatId, name, avatar = '👤', region = '' }) {
  const id = wechatId?.trim()?.toLowerCase();
  return {
    profile: {
      id: ME_ID,
      name: name?.trim() || id,
      wechatId: id,
      avatar,
      status: 'זמין/ה',
      region,
      wallet: { balance: 0, currency: 'CNY' },
    },
    contacts: [],
    chats: [],
    messages: {},
    moments: [],
  };
}

export const ONBOARDING_KEY = 'weichat_onboarded_v1';

export function isOnboardingComplete() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboardingComplete() {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function validateWechatId(raw) {
  const id = String(raw || '').trim().toLowerCase();
  if (!id) return { ok: false, error: 'נא להזין WeiChat ID' };
  if (id.length < 3 || id.length > 32) {
    return { ok: false, error: '3–32 תווים' };
  }
  if (!/^[a-z0-9_]+$/.test(id)) {
    return { ok: false, error: 'רק אותיות קטנות, מספרים ו-_ ' };
  }
  return { ok: true, id };
}
