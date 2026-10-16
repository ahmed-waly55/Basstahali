import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthSession, AuthUser } from './auth.models';
import { AuthService } from './auth.service';

describe('Persistent student authentication across reloads and tabs', () => {
  const authUrl = `${environment.baseUrl}/api/v1/auth`;
  const sessionKey = 'basstahali-auth-session';
  const deviceKey = 'basstahali-auth-device';
  const originalDevice = '12345678-1234-4234-8234-123456789abc';
  const user: AuthUser = {
    id: 'persisted-student',
    userName: 'student',
    fullName: 'Test Student',
    email: 'student@example.test',
    roles: ['Student'],
  };
  let auth: AuthService | undefined;
  let backend: HttpTestingController | undefined;
  let navigate: ReturnType<typeof vi.fn>;
  let originalLocks: PropertyDescriptor | undefined;

  function session(overrides: Partial<AuthSession> = {}): AuthSession {
    return {
      accessToken: 'persisted-access',
      accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      refreshToken: 'persisted-refresh',
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
        { provide: Router, useValue: { url: '/student', navigate } },
      ],
    });
    auth = TestBed.inject(AuthService);
    backend = TestBed.inject(HttpTestingController);
    return auth;
  }

  function signIn(value = session()) {
    auth!.login('student', 'a-password-never-persisted').subscribe();
    const request = backend!.expectOne(`${authUrl}/login`);
    request.flush({ success: true, data: value });
    return request.request.body.device as string;
  }

  function storeFromAnotherTab(value: unknown) {
    const previous = localStorage.getItem(sessionKey);
    const next = value === null ? null : JSON.stringify(value);
    if (next === null) localStorage.removeItem(sessionKey);
    else localStorage.setItem(sessionKey, next);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: sessionKey,
        oldValue: previous,
        newValue: next,
        storageArea: localStorage,
        url: 'https://basstahali.example/student',
      }),
    );
  }

  function reloadApplication() {
    backend!.verify();
    TestBed.resetTestingModule();
    return configure();
  }

  function installQueuedLock() {
    let release: (() => Promise<void>) | undefined;
    let signal: AbortSignal | undefined;
    const request = vi.fn(
      (
        name: string,
        options: { mode: string; signal: AbortSignal },
        callback: (lock: { name: string; mode: string }) => Promise<unknown>,
      ) => {
        signal = options.signal;
        return new Promise((resolve, reject) => {
          release = async () => {
            try {
              resolve(await callback({ name, mode: options.mode }));
            } catch (error) {
              reject(error);
            }
          };
          options.signal.addEventListener(
            'abort',
            () => reject(new DOMException('Lock request cancelled', 'AbortError')),
            { once: true },
          );
        });
      },
    );
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: { request },
    });
    return {
      request,
      signal: () => signal,
      release: async () => {
        expect(release).toBeDefined();
        await release!();
      },
    };
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    auth = undefined;
    backend = undefined;
    originalLocks = Object.getOwnPropertyDescriptor(navigator, 'locks');
    // Tests that do not exercise serialization use the documented no-Web-Locks fallback.
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    vi.spyOn(Swal, 'fire').mockResolvedValue({
      isConfirmed: false,
      isDenied: false,
      isDismissed: true,
    });
  });

  afterEach(() => {
    // A reload intentionally leaves the browser-only memory fallback intact until this cleanup.
    auth?.invalidateSession(false);
    backend?.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    if (originalLocks) Object.defineProperty(navigator, 'locks', originalLocks);
    else Reflect.deleteProperty(navigator, 'locks');
    localStorage.clear();
    sessionStorage.clear();
  });

  it('migrates a valid legacy session with its original device and removes the legacy copies', () => {
    const legacy = session();
    sessionStorage.setItem(sessionKey, JSON.stringify(legacy));
    sessionStorage.setItem(deviceKey, originalDevice);
    configure();

    expect(auth!.user()).toEqual(user);
    expect(JSON.parse(localStorage.getItem(sessionKey)!)).toEqual(legacy);
    expect(localStorage.getItem(deviceKey)).toBe(originalDevice);
    expect(sessionStorage.getItem(sessionKey)).toBeNull();
    expect(sessionStorage.getItem(deviceKey)).toBeNull();

    auth!.logout().subscribe();
    const logout = backend!.expectOne(`${authUrl}/logout`);
    expect(logout.request.body.device).toBe(originalDevice);
    logout.flush({ success: true });
  });

  it('prefers the persistent session and device when legacy tab storage contains a different user', () => {
    const persistent = session({ accessToken: 'persistent-winner' });
    localStorage.setItem(sessionKey, JSON.stringify(persistent));
    localStorage.setItem(deviceKey, originalDevice);
    sessionStorage.setItem(
      sessionKey,
      JSON.stringify(session({ user: { ...user, id: 'outdated-legacy-student' } })),
    );
    sessionStorage.setItem(deviceKey, '87654321-4321-4321-8321-cba987654321');
    configure();

    expect(auth!.user()?.id).toBe(user.id);
    let token: string | undefined;
    auth!.getValidAccessToken().subscribe((value) => (token = value));
    expect(token).toBe('persistent-winner');
    expect(localStorage.getItem(deviceKey)).toBe(originalDevice);
    expect(sessionStorage.getItem(sessionKey)).toBeNull();
    expect(sessionStorage.getItem(deviceKey)).toBeNull();
  });

  it('restores a new application from persistent storage without remembering login credentials', () => {
    configure();
    const device = signIn();
    const persisted = localStorage.getItem(sessionKey)!;
    expect(JSON.parse(persisted).user).toEqual(user);
    expect(persisted).not.toContain('a-password-never-persisted');
    expect(persisted).not.toContain('password');
    expect(sessionStorage.getItem(sessionKey)).toBeNull();
    expect(localStorage.getItem(deviceKey)).toBe(device);

    reloadApplication();

    expect(auth!.isAuthenticated()).toBe(true);
    expect(auth!.user()).toEqual(user);
    auth!.ensureStudent().subscribe();
    const me = backend!.expectOne(`${authUrl}/me`);
    expect(me.request.headers.get('Authorization')).toBe('Bearer persisted-access');
    me.flush({ success: true, data: user });
    backend!.expectNone(`${authUrl}/login`);
  });

  it('restores a persistent session without rewriting the shared authentication record', () => {
    const stored = JSON.stringify(session());
    localStorage.setItem(sessionKey, stored);
    localStorage.setItem(deviceKey, originalDevice);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    configure();

    expect(auth!.isAuthenticated()).toBe(true);
    const authenticationWrites = setItem.mock.calls.filter(
      ([key], index) => key === sessionKey && setItem.mock.contexts[index] === localStorage,
    );
    expect(authenticationWrites).toEqual([]);
    expect(localStorage.getItem(sessionKey)).toBe(stored);
  });

  it('does not overwrite another tab’s rotated tokens with a pending /me response', () => {
    configure();
    signIn();
    let allowed: boolean | undefined;
    auth!.ensureStudent().subscribe((value) => (allowed = value));
    const me = backend!.expectOne(`${authUrl}/me`);
    const rotated = session({
      accessToken: 'newer-persistent-access',
      refreshToken: 'newer-persistent-refresh',
    });
    const stored = JSON.stringify(rotated);
    // The other tab's write is visible before its asynchronous storage event arrives.
    localStorage.setItem(sessionKey, stored);

    me.flush({ success: true, data: { ...user, fullName: 'Verified Student' } });

    expect(allowed).toBe(true);
    expect(localStorage.getItem(sessionKey)).toBe(stored);
    expect(JSON.parse(localStorage.getItem(sessionKey)!).refreshToken).toBe(
      'newer-persistent-refresh',
    );
  });

  it('removes persistent credentials and legacy keys on logout while retaining the browser device', () => {
    configure();
    const device = signIn();
    sessionStorage.setItem(sessionKey, JSON.stringify(session()));
    sessionStorage.setItem(deviceKey, originalDevice);

    auth!.logout().subscribe();

    expect(auth!.hasSession()).toBe(false);
    expect(localStorage.getItem(sessionKey)).toBeNull();
    expect(localStorage.getItem(deviceKey)).toBe(device);
    expect(sessionStorage.getItem(sessionKey)).toBeNull();
    expect(sessionStorage.getItem(deviceKey)).toBeNull();
    backend!.expectOne(`${authUrl}/logout`).flush({}, { status: 503, statusText: 'Unavailable' });
  });

  it('clears the current private view silently after another tab logs out', () => {
    configure();
    signIn();
    const generation = auth!.sessionGeneration();

    storeFromAnotherTab(null);

    expect(auth!.hasSession()).toBe(false);
    expect(auth!.user()).toBeNull();
    expect(auth!.sessionGeneration()).toBeGreaterThan(generation);
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/student' },
    });
    expect(Swal.fire).not.toHaveBeenCalled();
    backend!.expectNone(`${authUrl}/logout`);
  });

  it('invalidates /me verification when the same student receives rotated tokens in another tab', () => {
    configure();
    signIn();
    auth!.ensureStudent().subscribe();
    backend!.expectOne(`${authUrl}/me`).flush({ success: true, data: user });
    const generation = auth!.sessionGeneration();
    const rotated = session({ accessToken: 'other-tab-access', refreshToken: 'other-tab-refresh' });

    storeFromAnotherTab(rotated);

    expect(auth!.sessionGeneration()).toBeGreaterThan(generation);
    expect(auth!.user()?.id).toBe(user.id);
    let allowed: boolean | undefined;
    auth!.ensureStudent().subscribe((value) => (allowed = value));
    const verification = backend!.expectOne(`${authUrl}/me`);
    expect(verification.request.headers.get('Authorization')).toBe('Bearer other-tab-access');
    verification.flush({ success: true, data: user });
    expect(allowed).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
    backend!.expectNone(`${authUrl}/refresh-token`);
  });

  it('leaves the old private view when a different student signs in in another tab', () => {
    configure();
    signIn();

    storeFromAnotherTab(session({ user: { ...user, id: 'another-student' } }));

    expect(auth!.user()?.id).not.toBe(user.id);
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/student' },
    });
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  it.each(['older rotation', 'older logout'] as const)(
    'ignores a queued storage event for an %s when persistent storage already contains a newer session',
    (obsolete) => {
      configure();
      signIn();
      const latest = session({
        accessToken: 'latest-shared-access',
        refreshToken: 'latest-shared-refresh',
      });
      storeFromAnotherTab(latest);
      const generation = auth!.sessionGeneration();
      const currentStoredValue = localStorage.getItem(sessionKey);
      const obsoleteValue =
        obsolete === 'older logout'
          ? null
          : JSON.stringify(
              session({ accessToken: 'obsolete-access', refreshToken: 'obsolete-refresh' }),
            );

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: sessionKey,
          oldValue: JSON.stringify(session()),
          newValue: obsoleteValue,
          storageArea: localStorage,
          url: 'https://basstahali.example/student',
        }),
      );

      expect(auth!.sessionGeneration()).toBe(generation);
      expect(auth!.isAuthenticated()).toBe(true);
      let token: string | undefined;
      auth!.getValidAccessToken().subscribe((value) => (token = value));
      expect(token).toBe('latest-shared-access');
      expect(localStorage.getItem(sessionKey)).toBe(currentStoredValue);
      expect(navigate).not.toHaveBeenCalled();
      expect(Swal.fire).not.toHaveBeenCalled();
      backend!.expectNone(`${authUrl}/refresh-token`);
    },
  );

  it.each([{ roles: ['Teacher'] }, { roles: ['Student', 42] }, { roles: null }])(
    'fails closed for an incoming stored session with invalid roles %j',
    ({ roles }) => {
      configure();
      signIn();

      storeFromAnotherTab({ ...session(), user: { ...user, roles } });

      expect(auth!.hasSession()).toBe(false);
      expect(auth!.user()).toBeNull();
      expect(navigate).toHaveBeenCalled();
      expect(Swal.fire).not.toHaveBeenCalled();
    },
  );

  it.each(['blocked', 'quota'] as const)(
    'keeps the current browser session usable across rebootstrap when persistent storage is %s',
    (failure) => {
      const getItem = Storage.prototype.getItem;
      const setItem = Storage.prototype.setItem;
      if (failure === 'blocked') {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (
          this: Storage,
          key: string,
        ) {
          if (this === localStorage) throw new DOMException('Storage blocked', 'SecurityError');
          return getItem.call(this, key);
        });
      }
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
        this: Storage,
        key: string,
        value: string,
      ) {
        if (this === localStorage)
          throw new DOMException('Storage unavailable', 'QuotaExceededError');
        return setItem.call(this, key, value);
      });
      configure();
      signIn();
      expect(auth!.isAuthenticated()).toBe(true);
      expect(sessionStorage.getItem(sessionKey)).toBeNull();
      let allowed: boolean | undefined;
      auth!.ensureStudent().subscribe((value) => (allowed = value));
      backend!.expectOne(`${authUrl}/me`).flush({ success: true, data: user });
      expect(allowed).toBe(true);

      reloadApplication();

      expect(auth!.user()).toEqual(user);
      let token: string | undefined;
      auth!.getValidAccessToken().subscribe((value) => (token = value));
      expect(token).toBe('persisted-access');
      backend!.expectNone(`${authUrl}/refresh-token`);
    },
  );

  it('reuses another tab’s completed rotation after acquiring the shared refresh lock', async () => {
    const locks = installQueuedLock();
    localStorage.setItem(
      sessionKey,
      JSON.stringify(session({ accessTokenExpiresAt: new Date(Date.now() - 1_000).toISOString() })),
    );
    localStorage.setItem(deviceKey, originalDevice);
    configure();
    let token: string | undefined;
    auth!.getValidAccessToken().subscribe((value) => (token = value));
    expect(locks.request).toHaveBeenCalledWith(
      'basstahali-auth-refresh',
      { mode: 'exclusive', signal: expect.any(AbortSignal) },
      expect.any(Function),
    );
    backend!.expectNone(`${authUrl}/refresh-token`);

    // Real storage can change while this tab is queued before its storage event is delivered.
    localStorage.setItem(
      sessionKey,
      JSON.stringify(
        session({ accessToken: 'shared-rotated-access', refreshToken: 'shared-rotated-refresh' }),
      ),
    );
    await locks.release();

    await vi.waitFor(() => expect(token).toBe('shared-rotated-access'));
    backend!.expectNone(`${authUrl}/refresh-token`);
    expect(auth!.user()?.id).toBe(user.id);
  });

  it('aborts a queued refresh lock when the old application is destroyed', async () => {
    const locks = installQueuedLock();
    localStorage.setItem(
      sessionKey,
      JSON.stringify(session({ accessTokenExpiresAt: new Date(Date.now() - 1_000).toISOString() })),
    );
    configure();
    auth!.getValidAccessToken().subscribe({ error: () => {} });
    expect(locks.signal()?.aborted).toBe(false);

    TestBed.resetTestingModule();

    expect(locks.signal()?.aborted).toBe(true);
    await Promise.resolve();
    backend!.expectNone(`${authUrl}/refresh-token`);
    // Create a live service for deterministic cleanup of the browser-only memory fallback.
    configure();
  });
});
