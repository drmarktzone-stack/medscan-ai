/**
 * Unified auth: Base44 (hosted), Supabase (standalone email), or local guest.
 */

import { base44 } from '../../api/base44Client.js';
import { appParams } from '../app-params.js';
import { isStandaloneBuild } from '../clinic/standalone.js';
import { isSupabaseConfigured } from '../supabase/client.js';
import {
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignOut,
  supabaseGetUser,
  supabaseResetPasswordRequest,
  supabaseUpdatePassword,
  loadStoredSession,
  mapSupabaseUser,
  parseRecoveryTokenFromHash,
} from './supabaseAuth.js';

export const AUTH_MODES = Object.freeze({
  BASE44: 'base44',
  SUPABASE: 'supabase',
  LOCAL: 'local',
});

export function getAuthMode() {
  if (!isStandaloneBuild() && appParams.appId) return AUTH_MODES.BASE44;
  if (isStandaloneBuild() && isSupabaseConfigured()) return AUTH_MODES.SUPABASE;
  return AUTH_MODES.LOCAL;
}

export function supportsEmailAuth() {
  const mode = getAuthMode();
  return mode === AUTH_MODES.BASE44 || mode === AUTH_MODES.SUPABASE;
}

export async function loginWithEmail(email, password) {
  if (getAuthMode() === AUTH_MODES.SUPABASE) {
    const session = await supabaseSignIn(email, password);
    return mapSupabaseUser(session);
  }
  await base44.auth.loginViaEmailPassword(email, password);
  return base44.auth.me();
}

export async function registerWithEmail(email, password, metadata = {}) {
  if (getAuthMode() === AUTH_MODES.SUPABASE) {
    return supabaseSignUp(email, password, metadata);
  }
  return base44.auth.register({ email, password });
}

export async function verifyRegistrationOtp({ email, otpCode, password }) {
  if (getAuthMode() === AUTH_MODES.SUPABASE) {
    const session = loadStoredSession();
    if (session?.access_token) return session;
    throw new Error('confirm_email');
  }
  const result = await base44.auth.verifyOtp({ email, otpCode });
  if (result?.access_token) base44.auth.setToken(result.access_token);
  else if (password) await base44.auth.loginViaEmailPassword(email, password);
  return result;
}

export async function resendRegistrationOtp(email) {
  if (getAuthMode() === AUTH_MODES.SUPABASE) {
    throw new Error('confirm_email_resend');
  }
  return base44.auth.resendOtp(email);
}

export async function requestPasswordReset(email) {
  if (getAuthMode() === AUTH_MODES.SUPABASE) {
    return supabaseResetPasswordRequest(email);
  }
  return base44.auth.resetPasswordRequest(email);
}

export async function completePasswordReset(newPassword, recoveryToken) {
  if (getAuthMode() === AUTH_MODES.SUPABASE) {
    return supabaseUpdatePassword(newPassword, recoveryToken);
  }
  return base44.auth.resetPassword({ resetToken: recoveryToken, newPassword });
}

export async function logoutHosted() {
  if (getAuthMode() === AUTH_MODES.SUPABASE) {
    await supabaseSignOut();
    return;
  }
  base44.auth.logout();
}

export async function fetchCurrentUser() {
  const mode = getAuthMode();
  if (mode === AUTH_MODES.SUPABASE) {
    const session = await supabaseGetUser();
    return session ? mapSupabaseUser(session) : null;
  }
  if (mode === AUTH_MODES.BASE44 && appParams.token) {
    return base44.auth.me();
  }
  return null;
}

export { parseRecoveryTokenFromHash, mapSupabaseUser, loadStoredSession };
