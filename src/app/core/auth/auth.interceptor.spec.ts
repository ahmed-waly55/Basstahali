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
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthSession, SKIP_AUTH } from './auth.models';
import { AuthService } from './auth.service';

describe('API bearer authentication interceptor', () => {
  const api = `${environment.baseUrl}/api/v1`;
  const protectedUrl = `${api}/profile/student`;
  let auth: AuthService;
  let http: HttpClient;
  let backend: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

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

  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('basstahali-auth-session', JSON.stringify(session()));
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { url: '/student', navigate } },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    auth.invalidateSession(false);
    backend.verify();
    sessionStorage.clear();
  });

  it.each([
    'https://example.test/api/v1/profile/student',
    'https://api.basstahali.com.example.test/api/v1/profile/student',
    `${environment.baseUrl}/images/logo.svg`,
    `${environment.baseUrl}/api/v10/profile/student`,
    '/api/v1/profile/student',
    '//api.basstahali.com/api/v1/profile/student',
    '/i118/en.json',
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
    expect(auth.hasSession()).toBe(true);
  });

  it('honours SKIP_AUTH and never intercepts bad credentials on the login endpoint', () => {
    http.get(protectedUrl, { context: new HttpContext().set(SKIP_AUTH, true) }).subscribe();
    const skipped = backend.expectOne(protectedUrl);
    expect(skipped.request.headers.has('Authorization')).toBe(false);
    skipped.flush({});
    http.post(`${api}/auth/login`, {}).subscribe({ error: () => {} });
    const login = backend.expectOne(`${api}/auth/login`);
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shares a single refresh for concurrent GET 401s and retries each GET once', () => {
    const results: unknown[] = [];
    http.get(protectedUrl).subscribe((value) => results.push(value));
    http.get(`${api}/schedules`).subscribe((value) => results.push(value));
    backend.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${api}/schedules`).flush({}, { status: 401, statusText: 'Unauthorized' });
    const refresh = backend.expectOne(`${api}/auth/refresh-token`);
    expect(refresh.request.body.refreshToken).toBe('test-refresh');
    refresh.flush({ success: true, data: session('new-access', 'new-refresh') });
    for (const url of [protectedUrl, `${api}/schedules`]) {
      const retry = backend.expectOne(url);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
      retry.flush({ current: true });
    }
    expect(results).toEqual([{ current: true }, { current: true }]);
    expect(JSON.parse(sessionStorage.getItem('basstahali-auth-session')!).refreshToken).toBe(
      'new-refresh',
    );
    backend.expectNone(`${api}/auth/refresh-token`);
  });

  it('reuses the rotated access token for a late old-token 401 instead of refreshing again', () => {
    http.get(protectedUrl).subscribe();
    http.get(`${api}/schedules`).subscribe();
    const late = backend.expectOne(`${api}/schedules`);
    backend.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    backend
      .expectOne(`${api}/auth/refresh-token`)
      .flush({ success: true, data: session('new-access', 'new-refresh') });
    backend.expectOne(protectedUrl).flush({});
    late.flush({}, { status: 401, statusText: 'Unauthorized' });
    const retry = backend.expectOne(`${api}/schedules`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({});
    backend.expectNone(`${api}/auth/refresh-token`);
  });

  it('clears the session if the single retry still returns 401 without a refresh loop', () => {
    http.get(protectedUrl).subscribe({ error: () => {} });
    backend.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    backend
      .expectOne(`${api}/auth/refresh-token`)
      .flush({ success: true, data: session('new-access', 'new-refresh') });
    backend.expectOne(protectedUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.hasSession()).toBe(false);
    expect(navigate).toHaveBeenCalled();
    backend.expectNone(`${api}/auth/refresh-token`);
  });

  it('never automatically replays writes after 401', () => {
    http.post(`${api}/attendance/requests`, { sessionId: 'test-session' }).subscribe({
      error: () => {},
    });
    backend
      .expectOne(`${api}/attendance/requests`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone(`${api}/attendance/requests`);
    backend.expectNone(`${api}/auth/refresh-token`);
    expect(auth.hasSession()).toBe(false);
    expect(navigate).toHaveBeenCalled();
  });

  it.each([false, true])(
    'does not let a late 401 clear a newer login (already retried: %s)',
    (retried) => {
      http.get(protectedUrl).subscribe({ error: () => {} });
      let previous = backend.expectOne(protectedUrl);
      if (retried) {
        previous.flush({}, { status: 401, statusText: 'Unauthorized' });
        backend.expectOne(`${api}/auth/refresh-token`).flush({
          success: true,
          data: session('intermediate-access', 'intermediate-refresh'),
        });
        previous = backend.expectOne(protectedUrl);
      }
      auth.logout().subscribe();
      backend.expectOne(`${api}/auth/logout`).flush({});
      auth.login('student', 'test-password').subscribe();
      backend.expectOne(`${api}/auth/login`).flush({
        success: true,
        data: session('new-login-access', 'new-login-refresh'),
      });
      previous.flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(auth.isAuthenticated()).toBe(true);
      expect(JSON.parse(sessionStorage.getItem('basstahali-auth-session')!).accessToken).toBe(
        'new-login-access',
      );
      expect(navigate).not.toHaveBeenCalled();
      backend.expectNone(`${api}/auth/refresh-token`);
    },
  );

  it('does not let a late write 401 clear a newer login', () => {
    http.post(`${api}/attendance/requests`, {}).subscribe({ error: () => {} });
    const previous = backend.expectOne(`${api}/attendance/requests`);
    auth.logout().subscribe();
    backend.expectOne(`${api}/auth/logout`).flush({});
    auth.login('student', 'test-password').subscribe();
    backend.expectOne(`${api}/auth/login`).flush({
      success: true,
      data: session('new-login-access', 'new-login-refresh'),
    });
    previous.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isAuthenticated()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
    backend.expectNone(`${api}/auth/refresh-token`);
  });

  it('leaves anonymous public API calls unchanged and does not redirect their 401s', () => {
    auth.invalidateSession(false);
    http.get(`${api}/curricula`).subscribe({ error: () => {} });
    const request = backend.expectOne(`${api}/curricula`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone(`${api}/auth/refresh-token`);
    expect(navigate).not.toHaveBeenCalled();
  });
});
