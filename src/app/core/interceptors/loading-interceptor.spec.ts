import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { loadingInterceptor, SKIP_LOADING } from './loading-interceptor';
import { LoadingService } from '../services/loading.service';

describe('Basstahali API interceptor', () => {
  const base = 'https://api.basstahali.com/api/v1/';
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('keeps loading visible until every concurrent request completes', () => {
    const states: boolean[] = [];
    TestBed.inject(LoadingService).isLoading$.subscribe((value) => states.push(value));
    const http = TestBed.inject(HttpClient);
    const backend = TestBed.inject(HttpTestingController);
    http.get(base + 'curricula').subscribe();
    http.get(base + 'grade-levels/test/subjects').subscribe();
    backend.expectOne(base + 'curricula').flush([]);
    expect(states.at(-1)).toBe(true);
    backend.expectOne(base + 'grade-levels/test/subjects').flush([]);
    expect(states.at(-1)).toBe(false);
  });
  it('cleans up cancellations and preserves errors without replaying writes', () => {
    let loading = false;
    TestBed.inject(LoadingService).isLoading$.subscribe((value) => (loading = value));
    const http = TestBed.inject(HttpClient);
    const backend = TestBed.inject(HttpTestingController);
    const read = http.get(base + 'curricula').subscribe();
    backend.expectOne(base + 'curricula');
    read.unsubscribe();
    expect(loading).toBe(false);
    let status: number | undefined;
    http.post(base + 'teacher-forms', {}).subscribe({ error: (error) => (status = error.status) });
    backend.expectOne(base + 'teacher-forms').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(status).toBe(503);
    expect(loading).toBe(false);
    backend.expectNone(base + 'teacher-forms');
  });
  it('cancels stalled requests at the deadline and clears loading', () => {
    vi.useFakeTimers();
    try {
      let loading = false;
      let errorName = '';
      TestBed.inject(LoadingService).isLoading$.subscribe((value) => (loading = value));
      TestBed.inject(HttpClient)
        .get(base + 'curricula')
        .subscribe({ error: (error) => (errorName = error.name) });
      const request = TestBed.inject(HttpTestingController).expectOne(base + 'curricula');
      vi.advanceTimersByTime(20001);
      expect(errorName).toBe('TimeoutError');
      expect(request.cancelled).toBe(true);
      expect(loading).toBe(false);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('can skip background loading and does not intercept other origins', () => {
    let loading = false;
    TestBed.inject(LoadingService).isLoading$.subscribe((value) => (loading = value));
    const http = TestBed.inject(HttpClient);
    const backend = TestBed.inject(HttpTestingController);
    http
      .get(base + 'curricula', { context: new HttpContext().set(SKIP_LOADING, true) })
      .subscribe();
    expect(loading).toBe(false);
    backend.expectOne(base + 'curricula').flush([]);
    http.get('/images/logo.jpg').subscribe();
    expect(loading).toBe(false);
    backend.expectOne('/images/logo.jpg').flush('image');
  });
});
