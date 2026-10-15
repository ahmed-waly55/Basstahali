import { HttpContextToken } from '@angular/common/http';

export interface AuthUser {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  roles: string[];
}

export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
}

export type AuthErrorCode =
  'invalid-credentials' | 'student-only' | 'invalid-response' | 'session-expired' | 'unavailable';

/** Codes are translated by the screen; server messages and credential-bearing bodies stay private. */
export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
  }
}

/** Login, refresh and revocation do not recursively enter bearer-token handling. */
export const SKIP_AUTH = new HttpContextToken(() => false);

export function isStudent(user: AuthUser): boolean {
  return user.roles.some((role) => role.trim().toLowerCase() === 'student');
}

/** Login returns only to the local student area, including its query and fragment. */
export function safeReturnUrl(value: string | null | undefined): string {
  const fallback = '/student';
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }
  try {
    const base = 'https://basstahali.invalid';
    const url = new URL(value, base);
    const path = decodeURIComponent(url.pathname);
    const normalized = new URL(path, base);
    if (
      url.origin !== base ||
      normalized.origin !== base ||
      path.startsWith('//') ||
      /[\\\u0000-\u001f\u007f]/.test(path) ||
      !/^\/student(?:\/|$)/.test(normalized.pathname)
    ) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
