/* eslint-disable @typescript-eslint/no-explicit-any */
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'lawsome_token';

// ─── Core token helpers ───────────────────────────────────────────────────────

export const storeToken  = (token: string): void  => localStorage.setItem(TOKEN_KEY, token);
export const getToken    = (): string | null       => localStorage.getItem(TOKEN_KEY);
export const clearToken  = (): void               => localStorage.removeItem(TOKEN_KEY);
export const isLoggedIn  = (): boolean            => !!getToken();

// Returns the token's `exp` claim in epoch ms, or null if absent/unreadable
export const getTokenExpiry = (): number | null => {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

// kept for backward compat with old code that calls storeTokens(token, refreshToken)
export const storeTokens = (token?: string): void => { if (token) storeToken(token); };

// Returns { email } decoded from our JWT, plus name fields read from localStorage
export const getUserInfo = async (): Promise<any> => {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<{ email: string }>(token);

    const orgRaw = localStorage.getItem('orgData');
    if (orgRaw) {
      const orgData = JSON.parse(orgRaw);
      const fullName: string = orgData?.currentUser?.fullName || '';
      const parts = fullName.trim().split(' ').filter(Boolean);
      return {
        email:      decoded.email,
        username:   fullName,
        firstName:  parts[0]  || '',
        lastName:   parts.slice(1).join(' ') || '',
        attributes: { fullName: fullName ? [fullName] : [] },
      };
    }

    const cuRaw = localStorage.getItem('currentUser');
    if (cuRaw) {
      const cu = JSON.parse(cuRaw);
      const fullName: string = cu?.fullName || '';
      const parts = fullName.trim().split(' ').filter(Boolean);
      return {
        email:      decoded.email,
        username:   fullName,
        firstName:  parts[0]  || '',
        lastName:   parts.slice(1).join(' ') || '',
        attributes: { fullName: fullName ? [fullName] : [] },
      };
    }

    return { email: decoded.email };
  } catch {
    return null;
  }
};

// Returns true/false — checks if user is authenticated
export const initAuth = async (): Promise<boolean> => isLoggedIn();

// Clears token and localStorage
export const logout = async (): Promise<void> => {
  clearToken();
  localStorage.clear();
};

// Returns a minimal auth client stub for components that need login/logout methods
export const getAuthClient = () => ({
  onAuthSuccess:   undefined as any,
  onAuthLogout:    undefined as any,
  onTokenExpired:  undefined as any,
  authenticated:   isLoggedIn(),
  token:           getToken(),
  login:  async (opts: { redirectUri?: string; prompt?: string } = {}) => {
    if (opts.redirectUri) sessionStorage.setItem('post_login_redirect', opts.redirectUri);
    window.location.href = '/';
  },
  logout: async () => {
    clearToken();
    localStorage.clear();
    window.location.href = '/';
  },
});
