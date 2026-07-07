// Sesión del panel admin — token JWT (8h) + datos de usuario en localStorage.
const TOKEN_KEY = 'adminToken';
const USER_KEY = 'adminUser';

export const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return Boolean(payload.exp) && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};

export const getCurrentToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem(USER_KEY);
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

export const hasValidSession = () => {
  const token = getCurrentToken();
  if (!isTokenValid(token)) {
    if (token) clearSession();
    return false;
  }
  return true;
};

export const createSession = (token, user) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const hasRole = (role) => getCurrentUser()?.role === role;

export const hasAnyRole = (roles) => roles.includes(getCurrentUser()?.role);
