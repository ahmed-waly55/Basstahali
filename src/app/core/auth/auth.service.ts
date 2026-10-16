import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  defer,
  finalize,
  firstValueFrom,
  from,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
  throwError,
} from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { registerLocaleTeardownBarrier } from '../i18n/locale-runtime';
import { SKIP_ERROR_NOTIFICATION } from '../interceptors/loading-interceptor';
import {
  AuthError,
  AUTH_DEVICE_STORAGE_KEY,
  AUTH_SESSION_STORAGE_KEY,
  AuthSession,
  AuthUser,
  isStudent,
  safeReturnUrl,
  SKIP_AUTH,
} from './auth.models';

const SESSION_KEY = AUTH_SESSION_STORAGE_KEY;
const DEVICE_KEY = AUTH_DEVICE_STORAGE_KEY;
const REFRESH_LOCK = 'basstahali-auth-refresh';
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
  private readonly document = inject(DOCUMENT);
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
  private readonly lifecycleAbort = new AbortController();
  private expirationNotice?: {
    sourceGeneration: number;
    promise: Promise<void>;
  };
  private readonly storageListener = (event: StorageEvent) => this.storageChanged(event);

  constructor() {
    if (this.browser) {
      this.restoreSession();
      window.addEventListener('storage', this.storageListener);
    }
    const unregisterBarrier = this.browser
      ? registerLocaleTeardownBarrier(() => this.settlePendingRefresh())
      : () => {};
    this.destroyRef.onDestroy(() => {
      unregisterBarrier();
      // A language switch destroys the old injector. Abort its requests without signing out.
      this.destroyed = true;
      this.generation++;
      this.lifecycleAbort.abort();
      this.destroy$.next();
      this.destroy$.complete();
      clearTimeout(this.expirationTimer);
      if (this.browser) window.removeEventListener('storage', this.storageListener);
      if (this.expirationNotice) Swal.close();
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
    const refresh = this.refreshRequest
      ? firstValueFrom(this.refreshRequest).then(
          () => void 0,
          () => void 0,
        )
      : Promise.resolve();
    return refresh.then(() => this.expirationNotice?.promise);
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

  /** Refresh before sending an expired token. API 401 responses never replay requests. */
  refreshAccessToken(): Observable<string> {
    const initial = this.session();
    if (
      !this.browser ||
      this.destroyed ||
      !initial ||
      Date.parse(initial.refreshTokenExpiresAt) <= Date.now()
    ) {
      if (this.browser && !this.destroyed) this.invalidateSession();
      return throwError(() => new AuthError('session-expired'));
    }
    if (this.refreshRequest) return this.refreshRequest;
    let generation = this.generation;
    const operation = async (): Promise<string> => {
      if (this.destroyed) throw new AuthError('session-expired');
      const latest = this.readPersistentSession();
      if (!latest) {
        this.applyExternalSession(null);
        throw new AuthError('session-expired');
      }
      if (
        latest.accessToken !== this.session()?.accessToken ||
        latest.refreshToken !== this.session()?.refreshToken ||
        latest.user.id !== this.session()?.user.id
      ) {
        this.applyExternalSession(latest);
      }
      if (latest.user.id !== initial.user.id) throw new AuthError('session-expired');
      generation = this.generation;
      // A different tab may already have completed rotation while this tab waited for its lock.
      if (
        (latest.accessToken !== initial.accessToken ||
          latest.refreshToken !== initial.refreshToken) &&
        Date.parse(latest.accessTokenExpiresAt) > Date.now()
      ) {
        return latest.accessToken;
      }
      const response = await firstValueFrom(
        this.http
          .post<unknown>(
            `${AUTH_URL}/refresh-token`,
            { refreshToken: latest.refreshToken, device: this.device() },
            privateOptions(true),
          )
          .pipe(takeUntil(this.destroy$)),
      );
      const refreshed = sessionFrom(envelopeData(response));
      if (this.destroyed || generation !== this.generation) throw new AuthError('session-expired');
      if (refreshed.user.id !== latest.user.id) throw new AuthError('invalid-response');
      this.saveSession(refreshed);
      return refreshed.accessToken;
    };
    const refresh = defer(() =>
      from(
        Promise.resolve(
          navigator.locks?.request
            ? navigator.locks.request(
                REFRESH_LOCK,
                { mode: 'exclusive', signal: this.lifecycleAbort.signal },
                operation,
              )
            : operation(),
        ),
      ),
    ).pipe(
      takeUntil(this.destroy$),
      catchError((error: unknown) => {
        const failure = error instanceof AuthError ? error : new AuthError('session-expired');
        if (!this.destroyed && generation === this.generation) {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return from(this.expireSession(generation)).pipe(
              switchMap(() => throwError(() => failure)),
            );
          }
          this.invalidateSession();
        }
        return throwError(() => failure);
      }),
      finalize(() => {
        if (this.refreshRequest === refresh) this.refreshRequest = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.refreshRequest = refresh;
    return refresh;
  }

  /** Clear once, show the branded expiry notice, then return to login after acknowledgement. */
  expireSession(expectedGeneration = this.generation): Promise<void> {
    if (this.destroyed || !this.browser) return Promise.resolve();
    if (this.expirationNotice?.sourceGeneration === expectedGeneration)
      return this.expirationNotice.promise;
    if (expectedGeneration !== this.generation) return Promise.resolve();
    // A different tab can rotate or replace the session before its storage event arrives.
    // An old request must not remove that newer persistent login.
    try {
      const latest = this.readPersistentSession();
      const current = this.session();
      if (
        latest &&
        (!current ||
          latest.accessToken !== current.accessToken ||
          latest.refreshToken !== current.refreshToken ||
          latest.user.id !== current.user.id)
      ) {
        this.applyExternalSession(latest);
        return Promise.resolve();
      }
    } catch {
      /* An invalid stored session cannot replace the rejected session. */
    }
    const returnUrl = safeReturnUrl(this.router.url);
    this.clearLocalSession();
    let popup: Promise<unknown>;
    try {
      // SweetAlert returns a thenable at runtime, without native Promise.catch().
      popup = Promise.resolve(
        Swal.fire({
          icon: 'warning',
          title: $localize`:@@authSessionExpiredTitle:انتهت صلاحية الجلسة`,
          text: $localize`:@@authSessionExpiredMessage:انتهت صلاحية جلستك. سجّل الدخول مرة أخرى للمتابعة.`,
          confirmButtonText: $localize`:@@authSessionExpiredConfirm:تسجيل الدخول`,
          buttonsStyling: false,
          showCloseButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          returnFocus: false,
          theme: this.document.documentElement.classList.contains('dark') ? 'dark' : 'light',
          backdrop: 'rgba(20, 12, 37, 0.5)',
          customClass: {
            popup: 'basstahali-dialog',
            title: 'basstahali-dialog__title',
            htmlContainer: 'basstahali-dialog__message',
            actions: 'basstahali-dialog__actions',
            confirmButton: 'basstahali-dialog__confirm',
          },
          didOpen: (popup) => popup.setAttribute('dir', this.document.documentElement.dir || 'rtl'),
        }),
      );
    } catch {
      popup = Promise.resolve();
    }
    const notice = {
      sourceGeneration: expectedGeneration,
      promise: popup
        .catch(() => undefined)
        .then(async () => {
          if (this.destroyed) return;
          try {
            const latest = this.readPersistentSession();
            if (latest && !this.session()) this.applyExternalSession(latest);
          } catch {
            /* An invalid stored session still requires signing in. */
          }
          // Another tab may have confirmed the same logout while the notice was open.
          // A newly signed-in session is the only reason to retain the current page.
          if (!this.destroyed && !this.session()) {
            await this.navigateToLogin(returnUrl);
          }
        })
        .finally(() => {
          if (this.expirationNotice === notice) this.expirationNotice = undefined;
        }),
    };
    this.expirationNotice = notice;
    return notice.promise;
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
              // Verification updates display data, never another tab's persisted token rotation.
              this.saveSession({ ...this.session()!, user }, false);
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
    if (redirect) void this.navigateToLogin();
  }

  private navigateToLogin(returnUrl = safeReturnUrl(this.router.url)): Promise<void> {
    if (
      this.destroyed ||
      !this.browser ||
      this.redirecting ||
      /^\/login(?:[/?#]|$)/.test(this.router.url)
    ) {
      return Promise.resolve();
    }
    this.redirecting = true;
    return this.router
      .navigate(['/login'], { queryParams: { returnUrl } })
      .then(
        () => void 0,
        () => void 0,
      )
      .finally(() => {
        this.redirecting = false;
      });
  }

  private restoreSession(): void {
    let stored: unknown;
    let raw: string | null | undefined;
    let persist = true;
    try {
      raw = localStorage.getItem(SESSION_KEY);
      if (memoryAuthoritative) {
        stored = memorySession;
        raw = undefined;
      } else {
        persist = raw === null;
      }
    } catch {
      stored = memorySession;
    }
    if (raw === null || (raw === undefined && !stored)) {
      try {
        raw = sessionStorage.getItem(SESSION_KEY);
      } catch {
        /* Legacy storage is optional. */
      }
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
      const session = sessionFrom(stored, true);
      // Preserve the original refresh-token binding when migrating an existing tab's session.
      try {
        this.device();
      } catch {
        /* A valid current access token remains usable. */
      }
      if (!persist) {
        memoryAuthoritative = false;
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {
          /* Legacy storage may be blocked. */
        }
      }
      // Restoring an existing persistent snapshot must not write an older token over a
      // concurrent rotation. Only legacy and memory-backed sessions need migration.
      this.saveSession(session, persist);
    } catch {
      this.clearLocalSession();
    }
  }

  private readPersistentSession(): AuthSession | null {
    if (memoryAuthoritative) return memorySession;
    let raw: string | null;
    try {
      raw = localStorage.getItem(SESSION_KEY);
    } catch {
      return memorySession;
    }
    return raw ? sessionFrom(JSON.parse(raw), true) : null;
  }

  private saveSession(session: AuthSession, persist = true): void {
    if (this.destroyed) throw new AuthError('session-expired');
    this.session.set(session);
    this.currentUser.set(session.user);
    if (!this.browser) return;
    memorySession = session;
    if (persist) {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        memoryAuthoritative = false;
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {
          /* Legacy storage may be blocked. */
        }
      } catch {
        memoryAuthoritative = true;
      }
    }
    clearTimeout(this.expirationTimer);
    const delay = Math.min(Date.parse(session.refreshTokenExpiresAt) - Date.now(), 2_147_483_647);
    this.expirationTimer = setTimeout(
      () => {
        if (this.destroyed) return;
        if (Date.parse(session.refreshTokenExpiresAt) <= Date.now()) this.invalidateSession();
        else if (this.session() === session) this.saveSession(session, false);
      },
      Math.max(delay, 0),
    );
  }

  private clearLocalSession(persist = true): void {
    this.generation++;
    this.session.set(null);
    this.currentUser.set(null);
    this.verified = false;
    this.refreshRequest = undefined;
    this.verificationRequest = undefined;
    clearTimeout(this.expirationTimer);
    if (!this.browser) return;
    memorySession = null;
    if (persist) {
      try {
        localStorage.removeItem(SESSION_KEY);
        memoryAuthoritative = false;
      } catch {
        memoryAuthoritative = true;
      }
    } else {
      memoryAuthoritative = false;
    }
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(DEVICE_KEY);
    } catch {
      /* A blocked legacy store never becomes the active session source. */
    }
  }

  private applyExternalSession(session: AuthSession | null): void {
    const previous = this.session();
    memoryAuthoritative = false;
    if (!session) {
      this.clearLocalSession(false);
    } else {
      if (
        previous?.accessToken !== session.accessToken ||
        previous.refreshToken !== session.refreshToken ||
        previous.user.id !== session.user.id ||
        previous.user.roles.join('\0') !== session.user.roles.join('\0')
      ) {
        this.generation++;
        this.verified = false;
        this.refreshRequest = undefined;
        this.verificationRequest = undefined;
      }
      this.saveSession(session, false);
    }
    if (
      (!session || (previous && previous.user.id !== session.user.id)) &&
      /^\/student(?:[/?;#]|$)/.test(this.router.url)
    ) {
      void this.navigateToLogin();
    }
  }

  private storageChanged(event: StorageEvent): void {
    if (!this.browser || this.destroyed) return;
    try {
      if (event.storageArea && event.storageArea !== localStorage) return;
      // Storage events are queued: a newer login, rotation, or logout may already
      // have replaced the value by the time this tab receives the earlier event.
      if (event.key === SESSION_KEY || event.key === DEVICE_KEY) {
        if (localStorage.getItem(event.key) !== event.newValue) return;
      } else if (event.key === null && localStorage.getItem(SESSION_KEY) !== null) {
        return;
      }
    } catch {
      return;
    }
    if (event.key === DEVICE_KEY) {
      memoryDevice =
        event.newValue && this.validDevice(event.newValue) ? event.newValue : undefined;
      return;
    }
    if (event.key !== SESSION_KEY && event.key !== null) return;
    if (event.key === null) memoryDevice = undefined;
    if (!event.newValue) {
      this.applyExternalSession(null);
      return;
    }
    try {
      this.applyExternalSession(sessionFrom(JSON.parse(event.newValue), true));
    } catch {
      this.clearLocalSession();
      if (/^\/student(?:[/?;#]|$)/.test(this.router.url)) void this.navigateToLogin();
    }
  }

  private validDevice(value: string): boolean {
    return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
  }

  private device(): string {
    let stored: string | null = null;
    let legacy: string | null = null;
    try {
      stored = localStorage.getItem(DEVICE_KEY);
    } catch {
      /* Use this browser's memory fallback. */
    }
    try {
      legacy = sessionStorage.getItem(DEVICE_KEY);
    } catch {
      /* Legacy storage is optional. */
    }
    let device = [stored, legacy, memoryDevice].find((value): value is string =>
      Boolean(value && this.validDevice(value)),
    );
    if (!device) {
      try {
        device = crypto.randomUUID();
      } catch {
        throw new AuthError('unavailable');
      }
    }
    memoryDevice = device;
    try {
      localStorage.setItem(DEVICE_KEY, device);
      try {
        sessionStorage.removeItem(DEVICE_KEY);
      } catch {
        /* Legacy storage may be blocked. */
      }
    } catch {
      /* Keep the stable in-memory identifier when localStorage is unavailable. */
    }
    return device;
  }
}
