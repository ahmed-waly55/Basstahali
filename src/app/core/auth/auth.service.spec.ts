import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { clearTranslations, loadTranslations } from '@angular/localize';
import { firstValueFrom } from 'rxjs';
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { SKIP_ERROR_NOTIFICATION } from '../interceptors/loading-interceptor';
import { AuthError, AuthSession, AuthUser, SKIP_AUTH } from './auth.models';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('Student authentication session', () => {
  const url = `${environment.baseUrl}/api/v1/auth`;
  const storageKey = 'basstahali-auth-session';
  const user: AuthUser = {
    id: 'student-id',
    userName: 'student',
    fullName: 'Test Student',
    email: 'student@example.test',
    roles: ['Student'],
  };
  let auth: AuthService;
  let backend: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  function session(overrides: Partial<AuthSession> = {}): AuthSession {
    return {
      accessToken: 'test-access',
      accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      refreshToken: 'test-refresh',
      refreshTokenExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      user,
      ...overrides,
    };
  }

  function configure() {
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { url: '/student/schedule?week=current', navigate } },
      ],
    });
    auth = TestBed.inject(AuthService);
    backend = TestBed.inject(HttpTestingController);
  }

  function signIn(value = session()) {
    auth.login('student', 'test-password').subscribe();
    const request = backend.expectOne(`${url}/login`);
    const device = request.request.body.device;
    request.flush({ success: true, data: value });
    return device;
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.spyOn(Swal, 'fire').mockResolvedValue({
      isConfirmed: true,
      isDenied: false,
      isDismissed: false,
    });
    configure();
  });

  afterEach(() => {
    auth.invalidateSession(false);
    backend.verify();
    vi.restoreAllMocks();
    clearTranslations();
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    document.documentElement.classList.remove('dark');
    localStorage.clear();
    sessionStorage.clear();
  });

  it('uses the documented login contract and persists tokens in localStorage without storing login passwords', () => {
    const writeStorage = vi.spyOn(Storage.prototype, 'setItem');
    let result: AuthUser | undefined;
    auth.login(' student ', 'test-password').subscribe((value) => (result = value));
    const request = backend.expectOne(`${url}/login`);
    expect(request.request.body).toEqual({
      userName: 'student',
      password: 'test-password',
      device: expect.stringMatching(/^[0-9a-f-]{36}$/i),
    });
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.context.get(SKIP_AUTH)).toBe(true);
    expect(request.request.context.get(SKIP_ERROR_NOTIFICATION)).toBe(true);
    expect(request.request.transferCache).toBe(false);
    expect(request.request.cache).toBe('no-store');
    const loginSession = session();
    request.flush({ success: true, data: loginSession });
    expect(result).toEqual(user);
    expect(auth.user()).toEqual(user);
    expect(auth.isAuthenticated()).toBe(true);
    expect(localStorage.getItem(storageKey)).not.toContain('test-password');
    expect(localStorage.getItem(storageKey)).not.toContain('password');
    expect(writeStorage.mock.contexts).toContain(localStorage);
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual(loginSession);
    expect(sessionStorage.getItem(storageKey)).toBeNull();
  });

  it.each(['Student', 'student', 'sTuDeNt'])(
    'recognises the actual Student role with casing %s',
    (role) => {
      signIn(session({ user: { ...user, roles: [role] } }));
      expect(auth.isAuthenticated()).toBe(true);
    },
  );

  it('rejects non-students without inventing role aliases or saving issued tokens', () => {
    let failure: unknown;
    auth.login('teacher', 'test-password').subscribe({ error: (error) => (failure = error) });
    backend.expectOne(`${url}/login`).flush({
      success: true,
      data: session({ user: { ...user, roles: ['Teacher', 'Learner'] } }),
    });
    expect(failure).toBeInstanceOf(AuthError);
    expect((failure as AuthError).code).toBe('student-only');
    expect(auth.user()).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('normalises nullable display fields without rejecting a valid Student identity', () => {
    auth.login('student', 'test-password').subscribe();
    backend.expectOne(`${url}/login`).flush({
      success: true,
      data: {
        ...session(),
        user: { id: user.id, userName: null, fullName: null, email: null, roles: ['Student'] },
      },
    });
    expect(auth.user()).toEqual({
      id: user.id,
      userName: '',
      fullName: '',
      email: '',
      roles: ['Student'],
    });
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('returns a typed bad-credentials error without redirecting or exposing the backend body', () => {
    let failure: unknown;
    auth.login('student', 'wrong-password').subscribe({ error: (error) => (failure = error) });
    backend
      .expectOne(`${url}/login`)
      .flush(
        { message: 'Private backend diagnostic' },
        { status: 401, statusText: 'Unauthorized' },
      );
    expect(failure).toBeInstanceOf(AuthError);
    expect((failure as AuthError).code).toBe('invalid-credentials');
    expect((failure as AuthError).message).not.toContain('Private backend diagnostic');
    expect(navigate).not.toHaveBeenCalled();
    expect(auth.hasSession()).toBe(false);
  });

  it.each([
    { accessToken: '' },
    { accessTokenExpiresAt: 'invalid' },
    { accessTokenExpiresAt: new Date(0).toISOString() },
    { refreshTokenExpiresAt: new Date(0).toISOString() },
  ])('rejects malformed or expired token data: %j', (overrides) => {
    let failure: unknown;
    auth.login('student', 'test-password').subscribe({ error: (error) => (failure = error) });
    backend.expectOne(`${url}/login`).flush({ success: true, data: session(overrides) });
    expect(failure).toBeInstanceOf(AuthError);
    expect(auth.hasSession()).toBe(false);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('refreshes an expired restored access token once and persists rotated tokens', async () => {
    auth.invalidateSession(false);
    TestBed.resetTestingModule();
    localStorage.setItem(
      storageKey,
      JSON.stringify(session({ accessTokenExpiresAt: new Date(Date.now() - 1_000).toISOString() })),
    );
    configure();
    const results: string[] = [];
    auth.getValidAccessToken().subscribe((token) => results.push(token));
    auth.getValidAccessToken().subscribe((token) => results.push(token));
    const refresh = backend.expectOne(`${url}/refresh-token`);
    expect(refresh.request.body.refreshToken).toBe('test-refresh');
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush({
      success: true,
      data: session({ accessToken: 'rotated-access', refreshToken: 'rotated-refresh' }),
    });
    await auth.settlePendingRefresh();
    expect(results).toEqual(['rotated-access', 'rotated-access']);
    auth.getValidAccessToken().subscribe((token) => expect(token).toBe('rotated-access'));
    expect(JSON.parse(localStorage.getItem(storageKey)!).refreshToken).toBe('rotated-refresh');
    backend.expectNone(`${url}/refresh-token`);
  });

  it('verifies the current user with /me once per app, sharing concurrent guard checks', () => {
    signIn();
    const results: boolean[] = [];
    auth.ensureStudent().subscribe((value) => results.push(value));
    auth.ensureStudent().subscribe((value) => results.push(value));
    const request = backend.expectOne(`${url}/me`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-access');
    expect(request.request.transferCache).toBe(false);
    expect(request.request.cache).toBe('no-store');
    request.flush({ success: true, data: { ...user, fullName: 'Verified Student' } });
    auth.ensureStudent().subscribe((value) => results.push(value));
    expect(results).toEqual([true, true, true]);
    expect(auth.user()?.fullName).toBe('Verified Student');
    backend.expectNone(`${url}/me`);
  });

  it('clears the session if /me removes Student membership', () => {
    signIn();
    let allowed = true;
    auth.ensureStudent().subscribe((value) => (allowed = value));
    backend.expectOne(`${url}/me`).flush({ success: true, data: { ...user, roles: ['Teacher'] } });
    expect(allowed).toBe(false);
    expect(auth.user()).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('clears an expired refresh session and redirects to a safe student return target', () => {
    signIn(session({ refreshTokenExpiresAt: new Date(Date.now() + 60_000).toISOString() }));
    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000);
    let failure: unknown;
    auth.getValidAccessToken().subscribe({ error: (error) => (failure = error) });
    expect((failure as AuthError).code).toBe('session-expired');
    expect(auth.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/student/schedule?week=current' },
    });
    backend.expectNone(`${url}/refresh-token`);
    clock.mockRestore();
  });

  it('clears a rejected refresh without retrying it or leaving tokens behind', async () => {
    signIn();
    let failure: unknown;
    auth.refreshAccessToken().subscribe({ error: (error) => (failure = error) });
    backend
      .expectOne(`${url}/refresh-token`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await auth.settlePendingRefresh();
    expect((failure as AuthError).code).toBe('session-expired');
    expect(auth.hasSession()).toBe(false);
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(navigate).toHaveBeenCalled();
    backend.expectNone(`${url}/refresh-token`);
  });

  it('revokes the refresh token with the same device and clears locally even if logout fails', () => {
    signIn();
    const device = localStorage.getItem('basstahali-auth-device');
    let completed = false;
    auth.logout().subscribe(() => (completed = true));
    expect(auth.user()).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
    const request = backend.expectOne(`${url}/logout`);
    expect(request.request.body).toEqual({ refreshToken: 'test-refresh', device });
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-access');
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    expect(completed).toBe(true);
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('redirects after a logout 401 while retaining no session', () => {
    signIn();
    auth.logout().subscribe();
    backend.expectOne(`${url}/logout`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).toHaveBeenCalled();
    expect(auth.hasSession()).toBe(false);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  it('uses the active English catalog and light theme for the expiry prompt without changing the route language', async () => {
    signIn();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    loadTranslations({
      authSessionExpiredTitle: 'Session expired',
      authSessionExpiredMessage: 'Your session has expired. Sign in again to continue.',
      authSessionExpiredConfirm: 'Sign in',
    });
    await auth.expireSession();
    const options = vi.mocked(Swal.fire).mock.calls.at(-1)?.[0] as SweetAlertOptions;
    expect(options.title).toBe('Session expired');
    expect(options.text).toBe('Your session has expired. Sign in again to continue.');
    expect(options.confirmButtonText).toBe('Sign in');
    expect(options.theme).toBe('light');
    const popup = document.createElement('div');
    options.didOpen?.(popup);
    expect(popup.dir).toBe('ltr');
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/student/schedule?week=current' },
    });
  });

  it('does not restore tokens from a refresh that completes after logout', async () => {
    signIn();
    let failure: unknown;
    const completion = firstValueFrom(auth.refreshAccessToken()).catch((error) => {
      failure = error;
    });
    const refresh = backend.expectOne(`${url}/refresh-token`);
    auth.logout().subscribe();
    backend.expectOne(`${url}/logout`).flush({});
    refresh.flush({ success: true, data: session({ accessToken: 'late-access' }) });
    await completion;
    expect((failure as AuthError).code).toBe('session-expired');
    expect(auth.user()).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('aborts an old injector refresh on teardown without removing its persisted session', () => {
    signIn();
    const stored = localStorage.getItem(storageKey);
    const oldAuth = auth;
    auth.refreshAccessToken().subscribe();
    const refresh = backend.expectOne(`${url}/refresh-token`);
    TestBed.resetTestingModule();
    expect(refresh.cancelled).toBe(true);
    expect(localStorage.getItem(storageKey)).toBe(stored);
    oldAuth.invalidateSession();
    expect(localStorage.getItem(storageKey)).toBe(stored);
    expect(navigate).not.toHaveBeenCalled();
    configure();
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('aborts a pending /me check on teardown and leaves the next app to verify independently', () => {
    signIn();
    auth.ensureStudent().subscribe();
    const previous = backend.expectOne(`${url}/me`);
    TestBed.resetTestingModule();
    expect(previous.cancelled).toBe(true);
    configure();
    auth.ensureStudent().subscribe((valid) => expect(valid).toBe(true));
    backend.expectOne(`${url}/me`).flush({ success: true, data: user });
  });

  it('settles a pending refresh before language teardown so the next app restores rotated tokens', async () => {
    signIn();
    auth.refreshAccessToken().subscribe();
    const settled = auth.settlePendingRefresh();
    backend.expectOne(`${url}/refresh-token`).flush({
      success: true,
      data: session({ accessToken: 'rotated-access', refreshToken: 'rotated-refresh' }),
    });
    await settled;
    TestBed.resetTestingModule();
    configure();
    auth.getValidAccessToken().subscribe((token) => expect(token).toBe('rotated-access'));
    expect(JSON.parse(localStorage.getItem(storageKey)!).refreshToken).toBe('rotated-refresh');
    backend.expectNone(`${url}/refresh-token`);
  });

  it('rejects malformed stored JSON instead of reviving an earlier in-memory session', () => {
    signIn();
    TestBed.resetTestingModule();
    localStorage.setItem(storageKey, '{malformed');
    configure();
    expect(auth.hasSession()).toBe(false);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('keeps a browser-only memory session over language rebootstrap when storage is disabled', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    const device = signIn();
    TestBed.resetTestingModule();
    configure();
    expect(auth.user()).toEqual(user);
    expect(auth.isAuthenticated()).toBe(true);
    auth.logout().subscribe();
    const logout = backend.expectOne(`${url}/logout`);
    expect(logout.request.body.device).toBe(device);
    logout.flush({});
  });

  it('retains the newest memory session when storage reads work but writes exceed quota', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    signIn();
    expect(localStorage.getItem(storageKey)).toBeNull();
    TestBed.resetTestingModule();
    configure();
    expect(auth.user()).toEqual(user);
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('never reads browser storage or requests private data on the server', () => {
    auth.invalidateSession(false);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { url: '/student', navigate } },
      ],
    });
    const read = vi.spyOn(Storage.prototype, 'getItem');
    auth = TestBed.inject(AuthService);
    backend = TestBed.inject(HttpTestingController);
    let allowed = true;
    auth.ensureStudent().subscribe((value) => (allowed = value));
    expect(allowed).toBe(false);
    expect(read).not.toHaveBeenCalled();
    backend.expectNone(() => true);
  });
});
