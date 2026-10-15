import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  defer,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { registerLocaleTeardownBarrier } from '../i18n/locale-runtime';
import { SKIP_ERROR_NOTIFICATION } from '../interceptors/loading-interceptor';
import {
  AuthError,
  AuthSession,
  AuthUser,
  isStudent,
  safeReturnUrl,
  SKIP_AUTH,
} from './auth.models';

const SESSION_KEY = 'basstahali-auth-session';
const DEVICE_KEY = 'basstahali-auth-device';
const AUTH_URL = `${environment.baseUrl}/api/v1/auth`;

// Used only in the browser when storage is disabled; survives Angular's language rebootstrap.
let memorySession: AuthSession | null = null;
let memoryDevice: string | undefined;
let memoryAuthoritative = false;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function displayText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') throw new AuthError('invalid-response');
  return value;
}

function userFrom(value: unknown): AuthUser {
  if (
    !record(value) ||
    typeof value['id'] !== 'string' ||
    !value['id'].trim() ||
    !Array.isArray(value['roles']) ||
    !value['roles'].every((role) => typeof role === 'string' && role.trim().length > 0)
  ) {
    throw new AuthError('invalid-response');
  }
  const user: AuthUser = {
    id: value['id'],
    userName: displayText(value['userName']),
    fullName: displayText(value['fullName']),
    email: displayText(value['email']),
    roles: [...value['roles']],
  };
  if (!isStudent(user)) throw new AuthError('student-only');
  return user;
}

function expiry(value: unknown): number {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  ) {
    throw new AuthError('invalid-response');
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new AuthError('invalid-response');
  return timestamp;
}

function sessionFrom(value: unknown, allowExpiredAccess = false): AuthSession {
  if (
    !record(value) ||
    typeof value['accessToken'] !== 'string' ||
    !value['accessToken'].trim() ||
    /\s/.test(value['accessToken']) ||
    typeof value['refreshToken'] !== 'string' ||
    !value['refreshToken'].trim() ||
    /\s/.test(value['refreshToken'])
  ) {
    throw new AuthError('invalid-response');
  }
  const accessExpiry = expiry(value['accessTokenExpiresAt']);
  const refreshExpiry = expiry(value['refreshTokenExpiresAt']);
  if (refreshExpiry <= Date.now() || (!allowExpiredAccess && accessExpiry <= Date.now())) {
    throw new AuthError('session-expired');
  }
  return {
    accessToken: value['accessToken'],
    accessTokenExpiresAt: value['accessTokenExpiresAt'] as string,
    refreshToken: value['refreshToken'],
    refreshTokenExpiresAt: value['refreshTokenExpiresAt'] as string,
    user: userFrom(value['user']),
  };
}

function envelopeData(value: unknown): unknown {
  if (!record(value) || value['success'] !== true || !('data' in value)) {
    throw new AuthError('invalid-response');
  }
  return value['data'];
}

function privateOptions(skipAuth = false) {
  return {
    transferCache: false,
    cache: 'no-store' as const,
    context: new HttpContext().set(SKIP_AUTH, skipAuth).set(SKIP_ERROR_NOTIFICATION, true),
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly session = signal<AuthSession | null>(null);
  private readonly currentUser = signal<AuthUser | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.session() !== null && this.user() !== null);

  private generation = 0;
  private verified = false;
  private refreshRequest?: Observable<string>;
  private verificationRequest?: Observable<boolean>;
  private expirationTimer?: ReturnType<typeof setTimeout>;
  private redirecting = false;
  private destroyed = false;
  private readonly destroy$ = new Subject<void>();

  constructor() {
    if (this.browser) this.restoreSession();
    const unregisterBarrier = this.browser
      ? registerLocaleTeardownBarrier(() => this.settlePendingRefresh())
      : () => {};
    this.destroyRef.onDestroy(() => {
      unregisterBarrier();
      // A language switch destroys the old injector. Abort its requests without signing out.
      this.destroyed = true;
      this.generation++;
      this.destroy$.next();
      this.destroy$.complete();
      clearTimeout(this.expirationTimer);
    });
  }

  hasSession(): boolean {
    return this.browser && !this.destroyed && this.session() !== null;
  }

  /** Lets in-flight requests avoid retrying or clearing a different, newly signed-in session. */
  sessionGeneration(): number {
    return this.generation;
  }

  /** Finish a token rotation before a language change destroys this application's injector. */
  settlePendingRefresh(): Promise<void> {
    return this.refreshRequest
      ? firstValueFrom(this.refreshRequest).then(
          () => void 0,
          () => void 0,
        )
      : Promise.resolve();
  }

  login(userName: string, password: string): Observable<AuthUser> {
    return defer(() => {
      if (!this.browser || this.destroyed) return throwError(() => new AuthError('unavailable'));
      this.clearLocalSession();
      const generation = this.generation;
      return this.http
        .post<unknown>(
          `${AUTH_URL}/login`,
          { userName: userName.trim(), password, device: this.device() },
          privateOptions(true),
        )
        .pipe(
          takeUntil(this.destroy$),
          map((response) => {
            if (record(response) && response['success'] === false) {
              throw new AuthError('invalid-credentials');
            }
            const session = sessionFrom(envelopeData(response));
            if (generation !== this.generation) throw new AuthError('session-expired');
            this.saveSession(session);
            return session.user;
          }),
          catchError((error: unknown) => {
            if (generation === this.generation) this.clearLocalSession();
            if (error instanceof AuthError) return throwError(() => error);
            const code =
              error instanceof HttpErrorResponse && [400, 401, 403].includes(error.status)
                ? 'invalid-credentials'
                : 'unavailable';
            return throwError(() => new AuthError(code));
          }),
        );
    });
  }

  getValidAccessToken(): Observable<string> {
    return defer(() => {
      const session = this.session();
      if (!this.browser || this.destroyed || !session) {
        return throwError(() => new AuthError('session-expired'));
      }
      if (Date.parse(session.refreshTokenExpiresAt) <= Date.now()) {
        this.invalidateSession();
        return throwError(() => new AuthError('session-expired'));
      }
      return Date.parse(session.accessTokenExpiresAt) > Date.now()
        ? of(session.accessToken)
        : this.refreshAccessToken();
    });
  }

  /** Concurrent expirations and late 401s share one refresh, including rotated refresh tokens. */
  refreshAccessToken(rejectedToken?: string): Observable<string> {
    const session = this.session();
    if (
      !this.browser ||
      this.destroyed ||
      !session ||
      Date.parse(session.refreshTokenExpiresAt) <= Date.now()
    ) {
      if (this.browser && !this.destroyed) this.invalidateSession();
      return throwError(() => new AuthError('session-expired'));
    }
    if (
      rejectedToken &&
      rejectedToken !== session.accessToken &&
      Date.parse(session.accessTokenExpiresAt) > Date.now()
    ) {
      return of(session.accessToken);
    }
    if (this.refreshRequest) return this.refreshRequest;
    const generation = this.generation;
    const refresh = this.http
      .post<unknown>(
        `${AUTH_URL}/refresh-token`,
        { refreshToken: session.refreshToken, device: this.device() },
        privateOptions(true),
      )
      .pipe(
        takeUntil(this.destroy$),
        map((response) => {
          const refreshed = sessionFrom(envelopeData(response));
          if (generation !== this.generation) throw new AuthError('session-expired');
          if (refreshed.user.id !== session.user.id) throw new AuthError('invalid-response');
          this.saveSession(refreshed);
          return refreshed.accessToken;
        }),
        catchError((error: unknown) => {
          if (generation === this.generation) this.invalidateSession();
          return throwError(() =>
            error instanceof AuthError ? error : new AuthError('session-expired'),
          );
        }),
        finalize(() => {
          if (this.refreshRequest === refresh) this.refreshRequest = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    this.refreshRequest = refresh;
    return refresh;
  }

  /** Authoritative /me verification runs once per app, and never during SSR. */
  ensureStudent(): Observable<boolean> {
    return defer(() => {
      if (!this.browser || this.destroyed || !this.session()) return of(false);
      return this.getValidAccessToken().pipe(
        switchMap(() => {
          if (this.verified) return of(true);
          if (this.verificationRequest) return this.verificationRequest;
          const generation = this.generation;
          const verification = this.http.get<unknown>(`${AUTH_URL}/me`, privateOptions()).pipe(
            takeUntil(this.destroy$),
            map((response) => {
              const user = userFrom(envelopeData(response));
              if (generation !== this.generation || user.id !== this.session()?.user.id) {
                throw new AuthError('session-expired');
              }
              this.saveSession({ ...this.session()!, user });
              this.verified = true;
              return true;
            }),
            catchError(() => {
              if (generation === this.generation) this.clearLocalSession();
              return of(false);
            }),
            finalize(() => {
              if (this.verificationRequest === verification) this.verificationRequest = undefined;
            }),
            shareReplay({ bufferSize: 1, refCount: false }),
          );
          this.verificationRequest = verification;
          return verification;
        }),
        catchError(() => of(false)),
      );
    });
  }

  logout(): Observable<void> {
    return defer(() => {
      if (this.destroyed) return of(void 0);
      const session = this.session();
      let device: string | undefined;
      try {
        device = this.browser && session ? this.device() : undefined;
      } catch {
        this.clearLocalSession();
        return of(void 0);
      }
      this.clearLocalSession();
      const generation = this.generation;
      if (!this.browser || !session) return of(void 0);
      return this.http
        .post<unknown>(
          `${AUTH_URL}/logout`,
          { refreshToken: session.refreshToken, device },
          {
            ...privateOptions(true),
            headers:
              Date.parse(session.accessTokenExpiresAt) > Date.now()
                ? { Authorization: `Bearer ${session.accessToken}` }
                : {},
          },
        )
        .pipe(
          takeUntil(this.destroy$),
          catchError((error: unknown) => {
            if (
              error instanceof HttpErrorResponse &&
              error.status === 401 &&
              generation === this.generation
            ) {
              this.invalidateSession();
            }
            return of(null);
          }),
          map(() => void 0),
        );
    });
  }

  invalidateSession(redirect = true): void {
    if (this.destroyed) return;
    this.clearLocalSession();
    if (
      !redirect ||
      !this.browser ||
      this.redirecting ||
      /^\/login(?:[/?#]|$)/.test(this.router.url)
    ) {
      return;
    }
    this.redirecting = true;
    void this.router
      .navigate(['/login'], { queryParams: { returnUrl: safeReturnUrl(this.router.url) } })
      .catch(() => false)
      .finally(() => (this.redirecting = false));
  }

  private restoreSession(): void {
    let stored: unknown;
    let raw: string | null | undefined;
    try {
      raw = sessionStorage.getItem(SESSION_KEY);
      if (memoryAuthoritative) {
        stored = memorySession;
        raw = undefined;
      }
    } catch {
      stored = memorySession;
    }
    if (raw !== undefined) {
      try {
        stored = raw ? JSON.parse(raw) : null;
      } catch {
        this.clearLocalSession();
        return;
      }
    }
    if (!stored) return;
    try {
      this.saveSession(sessionFrom(stored, true));
    } catch {
      this.clearLocalSession();
    }
  }

  private saveSession(session: AuthSession): void {
    if (this.destroyed) throw new AuthError('session-expired');
    this.session.set(session);
    this.currentUser.set(session.user);
    if (!this.browser) return;
    memorySession = session;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      memoryAuthoritative = false;
    } catch {
      memoryAuthoritative = true;
      // The browser-only memory fallback keeps the current tab usable without persistent storage.
    }
    clearTimeout(this.expirationTimer);
    const delay = Math.min(Date.parse(session.refreshTokenExpiresAt) - Date.now(), 2_147_483_647);
    this.expirationTimer = setTimeout(
      () => {
        if (this.destroyed) return;
        if (Date.parse(session.refreshTokenExpiresAt) <= Date.now()) this.invalidateSession();
        else if (this.session() === session) this.saveSession(session);
      },
      Math.max(delay, 0),
    );
  }

  private clearLocalSession(): void {
    this.generation++;
    this.session.set(null);
    this.currentUser.set(null);
    this.verified = false;
    this.refreshRequest = undefined;
    this.verificationRequest = undefined;
    clearTimeout(this.expirationTimer);
    if (!this.browser) return;
    memorySession = null;
    try {
      sessionStorage.removeItem(SESSION_KEY);
      memoryAuthoritative = false;
    } catch {
      memoryAuthoritative = true;
      // No authentication data is written to localStorage.
    }
  }

  private device(): string {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(DEVICE_KEY) ?? memoryDevice ?? null;
    } catch {
      stored = memoryDevice ?? null;
    }
    if (stored && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(stored)) {
      memoryDevice = stored;
      try {
        sessionStorage.setItem(DEVICE_KEY, stored);
      } catch {
        // Preserve the memory device when reads work but storage writes are blocked.
      }
      return stored;
    }
    let device: string;
    try {
      device = crypto.randomUUID();
    } catch {
      throw new AuthError('unavailable');
    }
    memoryDevice = device;
    try {
      sessionStorage.setItem(DEVICE_KEY, device);
    } catch {
      // Stable for this browser tab even when sessionStorage is unavailable.
    }
    return device;
  }
}
