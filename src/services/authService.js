import { getUserByEmail, addAuditLog } from '../db/inMemoryDB';

const TOKEN_KEY = 'fintech_token';
const USER_KEY  = 'fintech_user';

export function login(email, password) {
  const user = getUserByEmail(email);
  if (!user) return { success: false, reason: 'User not found' };
  if (user.suspended) return { success: false, reason: 'Account suspended' };
  if (user.passwordHash !== password) return { success: false, reason: 'Invalid password' };
  return { success: true, user, twoFARequired: true };
}

export function verify2FA(user, code) {
  if (code !== user.twoFASecret) return { success: false, reason: 'Invalid 2FA code' };
  const token = btoa(JSON.stringify({ userId: user.id, role: user.role, exp: Date.now() + 3600000 }));
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  addAuditLog(user.id, 'LOGIN', 'auth', `${user.name} logged in (2FA verified)`, 'INFO');
  return { success: true, token, user };
}

export function logout(userId) {
  addAuditLog(userId, 'LOGOUT', 'auth', 'User logged out', 'INFO');
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = JSON.parse(atob(token));
    if (Date.now() > payload.exp) { localStorage.clear(); return null; }
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    return { token, user };
  } catch { return null; }
}
