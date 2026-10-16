import {
  HttpClient,
  HttpContext,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthSession, SKIP_AUTH } from './auth.models';
import { AuthService } from './auth.service';

function mockPopup(result: Promise<SweetAlertResult>) {
  return vi.spyOn(Swal, 'fire').mockReturnValue(result);
}

describe('API bearer authentication interceptor', () => {
  const api = `${environment.baseUrl}/api/v1`;
  const protectedUrl = `${api}/profile/student`;
  const storageKey = 'basstahali-auth-session';
  let auth: AuthService;
  let http: HttpClient;
  let backend: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;
  let acknowledge: () => void;
  let popup: ReturnType<typeof mockPopup>;
  let originalLanguage: string | null;
  let originalDirection: string | null;
  let originalDarkMode: boolean;

  function session(token = 'test-access', refreshToken = 'test-refresh'): AuthSession {
    return {
      accessToken: token,
      accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      refreshToken,
      refreshTokenExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      user: {
        id: 'student-id',
        userName: 'student',
        fullName: 'Test Student',
        email: 'student@example.test',
        roles: ['Student'],
      },
    };
  }

  function signInAgain(): void {
    auth.login('student', 'test-password').subscribe();
    backend.expectOne(`${api}/auth/login`).flush({
      success: true,
      data: session('new-login-access', 'new-login-refresh'),
    });
  }

  function expectNewSession(): void {
    expect(auth.isAuthenticated()).toBe(true);
    expect(JSON.parse(localStorage.getItem(storageKey)!).accessToken).toBe('new-login-access');
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    backend.expectNone(`${api}/auth/refresh-token`);
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(storageKey, JSON.stringify(session()));
    originalLanguage = document.documentElement.getAttribute('lang');
    originalDirection = document.documentElement.getAttribute('dir');
    originalDarkMode = document.documentElement.classList.contains('dark');
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    const pending = new Promise<SweetAlertResult>((resolve) => {
      acknowledge = () => resolve({ isConfirmed: true, isDenied: false, isDismissed: false });
    });
    popup = mockPopup(pending);
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { url: '/student/schedule?week=current', navigate } },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(async () => {
    auth.invalidateSession(false);
    acknowledge();
    // Let an outstanding dialog settle after invalidating its session generation.
    for (let index = 0; index < 5; index++) await Promise.resolve();
    backend.verify();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    if (originalLanguage === null) document.documentElement.removeAttribute('lang');
    else document.documentElement.setAttribute('lang', originalLanguage);
    if (originalDirection === null) document.documentElement.removeAttribute('dir');
    else document.documentElement.setAttribute('dir', originalDirection);
    document.documentElement.classList.toggle('dark', originalDarkMode);
  });

  it.each([
    'https://example.test/api/v1/profile/student',
    'https://api.basstahali.com.example.test/api/v1/profile/student',
    `${environment.baseUrl}/images/logo.svg`,
    `${environment.baseUrl}/api/v10/profile/student`,
    '/api/v1/profile/student',
    '//api.basstahali.com/api/v1/profile/student',
    '/i118/en.json',
    `${environment.baseUrl.replace('https://', 'https://user:password@')}/api/v1/profile/student`,
  ])('never sends a bearer token outside the exact API origin/path: %s', (url) => {
    http.get(url).subscribe();
    const request = backend.expectOne(url);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('adds bearer authentication only to the API and disables private response caches', () => {
    http.get(protectedUrl).subscribe();
    const request = backend.expectOne(protectedUrl);
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-access');
    expect(request.request.transferCache).toBe(false);
    expect(request.request.cache).toBe('no-store');
    request.flush({});
    expect(popup).not.toHaveBeenCalled();
  });

  it('preserves an explicit Authorization header and its caller-owned 401 handling', () => {
    http.get(protectedUrl, { headers: { Authorization: 'Basic caller-value' } }).subscribe({
      error: () => {},
    });
    const request = backend.expectOne(protectedUrl);
    expect(request.request.headers.get('Authorization')).toBe('Basic caller-value');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone(`${api}/auth/refresh-token`);
    expect(navigate).not.toHaveBeenCalled();
    expect(popup).not.toHaveBeenCalled();
    expect(auth.hasSession()).toBe(true);
  });

  it('honours SKIP_AUTH, including caller-owned 401 responses', () => {
    http
      .get(protectedUrl, { context: new HttpContext().set(SKIP_AUTH, true) })
      .subscribe({ error: () => {} });
    const skipped = backend.expectOne(protectedUrl);
    expect(skipped.request.headers.has('Authorization')).toBe(false);
    skipped.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.hasSession()).toBe(true);
    expect(popup).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('leaves bad login credentials to the login screen without a session-expiry popup', () => {
    auth.login('student', 'wrong-password').subscribe({ error: () => {} });
    const login = backend.expectOne(`${api}/auth/login`);
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone(`${api}/auth/refresh-token`);
    expect(auth.hasSession()).toBe(false);
    expect(popup).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('clears a rejected session immediately and shares one acknowledged popup for concurrent GET 401s', async () => {
    const errors: unknown[] = [];
    http.get(protectedUrl).subscribe({ error: (error) => errors.push(error) });
    http.get(`${api}/schedules`).subscribe({ error: (error) => errors.push(error) });
    const first = backend.expectOne(protectedUrl);
    const second = backend.expectOne(`${api}/schedules`);
    first.flush({}, { status: 401, statusText: 'Unauthorized' });
    second.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.hasSession()).toBe(false);
    expect(auth.user()).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(popup).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    backend.expectNone(protectedUrl);
    backend.expectNone(`${api}/schedules`);
    backend.expectNone(`${api}/auth/refresh-token`);

    acknowledge();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/student/schedule?week=current' },
    });
    await vi.waitFor(() => expect(errors).toHaveLength(2));
    backend.expectNone(protectedUrl);
    backend.expectNone(`${api}/schedules`);
    backend.expectNone(`${api}/auth/refresh-token`);
  });

  it('never refreshes or automatically replays a write rejected with 401', async () => {
    const failed = vi.fn();
    http
      .post(`${api}/attendance/requests`, { sessionId: 'test-session' })
      .subscribe({ error: failed });
    backend
      .expectOne(`${api}/attendance/requests`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.hasSession()).toBe(false);
    expect(popup).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(failed).not.toHaveBeenCalled();
    backend.expectNone(`${api}/attendance/requests`);
    backend.expectNone(`${api}/auth/refresh-token`);

    acknowledge();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(1));
    backend.expectNone(`${api}/attendance/requests`);
    backend.expectNone(`${api}/auth/refresh-token`);
  });

  it('acknowledges the SweetAlert runtime thenable even when it has no native catch method', async () => {
    const pending = new Promise<SweetAlertResult>((resolve) => {
      acknowledge = () => resolve({ isConfirmed: true, isDenied: false, isDismissed: false });
    });
    const thenable = { then: pending.then.bind(pending), finally: pending.finally.bind(pending) };
    expect(thenable).not.toHaveProperty('catch');
    popup.mockReturnValue(thenable as unknown as Promise<SweetAlertResult>);
    const failed = vi.fn();
    http.get(protectedUrl).subscribe({ error: failed });
    backend.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.hasSession()).toBe(false);
    expect(popup).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(failed).not.toHaveBeenCalled();

    acknowledge();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(1));
    expect(failed.mock.calls[0][0].status).toBe(401);
    backend.expectNone(`${api}/auth/refresh-token`);
  });

  it('waits for session-expiry acknowledgement before redirecting after an authoritative /me 401', async () => {
    const results: boolean[] = [];
    auth.ensureStudent().subscribe((value) => results.push(value));
    const me = backend.expectOne(`${api}/auth/me`);
    expect(me.request.headers.get('Authorization')).toBe('Bearer test-access');
    me.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.hasSession()).toBe(false);
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(popup).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(results).toEqual([]);
    backend.expectNone(`${api}/auth/refresh-token`);

    acknowledge();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(results).toEqual([false]));
    backend.expectNone(`${api}/auth/me`);
    backend.expectNone(`${api}/auth/refresh-token`);
  });

  it('uses the branded dialog and current RTL direction without overriding the dark theme', () => {
    document.documentElement.classList.add('dark');
    http.get(protectedUrl).subscribe({ error: () => {} });
    backend.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(popup).toHaveBeenCalledTimes(1);
    const options = popup.mock.calls[0][0] as unknown as SweetAlertOptions;
    expect(options).toEqual(
      expect.objectContaining({
        title: 'انتهت صلاحية الجلسة',
        text: 'انتهت صلاحية جلستك. سجّل الدخول مرة أخرى للمتابعة.',
        confirmButtonText: 'تسجيل الدخول',
        buttonsStyling: false,
        theme: 'dark',
        customClass: expect.objectContaining({ popup: 'basstahali-dialog' }),
      }),
    );
    expect(options.didOpen).toBeTypeOf('function');
    const element = document.createElement('div');
    options.didOpen!(element);
    expect(element.dir).toBe('rtl');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each(['GET', 'POST'] as const)(
    'does not let a late %s 401 clear a newer login or show a stale popup',
    (method) => {
      http.request(method, protectedUrl).subscribe({ error: () => {} });
      const previous = backend.expectOne(protectedUrl);
      signInAgain();
      previous.flush({}, { status: 401, statusText: 'Unauthorized' });
      expectNewSession();
      expect(popup).not.toHaveBeenCalled();
      backend.expectNone(protectedUrl);
    },
  );

  it('does not redirect or clear a new login when an older expiry popup is acknowledged', async () => {
    const failed = vi.fn();
    http.get(protectedUrl).subscribe({ error: failed });
    backend.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(popup).toHaveBeenCalledTimes(1);
    expect(auth.hasSession()).toBe(false);
    signInAgain();
    expectNewSession();

    acknowledge();
    await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(1));
    expectNewSession();
    expect(popup).toHaveBeenCalledTimes(1);
    backend.expectNone(protectedUrl);
  });

  it('preserves a newer persisted login before its storage event arrives when an old request returns 401', async () => {
    const failed = vi.fn();
    http.get(protectedUrl).subscribe({ error: failed });
    const previous = backend.expectOne(protectedUrl);
    localStorage.setItem(
      storageKey,
      JSON.stringify(session('new-login-access', 'new-login-refresh')),
    );

    previous.flush({}, { status: 401, statusText: 'Unauthorized' });
    await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(1));
    expectNewSession();
    expect(popup).not.toHaveBeenCalled();
    backend.expectNone(protectedUrl);
  });

  it('adopts a new persisted login before its storage event arrives when the old expiry popup is acknowledged', async () => {
    const failed = vi.fn();
    http.get(protectedUrl).subscribe({ error: failed });
    backend.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.hasSession()).toBe(false);
    expect(popup).toHaveBeenCalledTimes(1);
    localStorage.setItem(
      storageKey,
      JSON.stringify(session('new-login-access', 'new-login-refresh')),
    );

    acknowledge();
    await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(1));
    expectNewSession();
    backend.expectNone(protectedUrl);
  });

  it('still redirects after acknowledgement when an already expired session is cleared again', async () => {
    const failed = vi.fn();
    const response = { message: 'The protected session was rejected.' };
    http.get(protectedUrl).subscribe({ error: failed });
    backend.expectOne(protectedUrl).flush(response, {
      status: 401,
      statusText: 'Unauthorized',
    });
    expect(auth.hasSession()).toBe(false);
    expect(popup).toHaveBeenCalledTimes(1);

    auth.invalidateSession(false);
    expect(auth.hasSession()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(failed).not.toHaveBeenCalled();

    acknowledge();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(1));
    expect(failed).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 401,
        url: protectedUrl,
        error: response,
      }),
    );
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(popup).toHaveBeenCalledTimes(1);
    backend.expectNone(protectedUrl);
    backend.expectNone(`${api}/auth/refresh-token`);
  });

  it('keeps logout idempotent when revocation itself returns 401, without an expiry popup', () => {
    const complete = vi.fn();
    auth.logout().subscribe({ complete });
    expect(auth.hasSession()).toBe(false);
    expect(localStorage.getItem(storageKey)).toBeNull();
    const logout = backend.expectOne(`${api}/auth/logout`);
    expect(logout.request.headers.get('Authorization')).toBe('Bearer test-access');
    logout.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(popup).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/student/schedule?week=current' },
    });
    backend.expectNone(`${api}/auth/refresh-token`);
  });

  it('leaves anonymous public API calls unchanged and does not redirect their 401s', () => {
    auth.invalidateSession(false);
    http.get(`${api}/curricula`).subscribe({ error: () => {} });
    const request = backend.expectOne(`${api}/curricula`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone(`${api}/auth/refresh-token`);
    expect(popup).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('leaves non-401 API failures to their caller without signing the student out', () => {
    http.get(protectedUrl).subscribe({ error: () => {} });
    backend.expectOne(protectedUrl).flush({}, { status: 503, statusText: 'Service Unavailable' });
    expect(auth.hasSession()).toBe(true);
    expect(popup).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    backend.expectNone(`${api}/auth/refresh-token`);
  });
});
