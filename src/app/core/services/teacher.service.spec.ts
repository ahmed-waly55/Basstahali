import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { TeacherService } from './teacher.service';

describe('TeacherService curricula requests', () => {
  const url = `${environment.baseUrl}/api/v1/curricula`;
  let service: TeacherService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withFetch()), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeacherService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('bypasses prerender transfer data and browser caches without adding custom headers', () => {
    service.getCurricula().subscribe();

    const request = backend.expectOne(url);
    expect(request.request.method).toBe('GET');
    expect(request.request.transferCache).toBe(false);
    expect(request.request.cache).toBe('no-store');
    expect(request.request.headers.keys()).toEqual([]);
    expect(request.request.params.keys()).toEqual([]);
    request.flush({ success: true, data: [] });
  });

  it('makes a fresh request on each load and preserves every curriculum in the API envelope', () => {
    let response: unknown;
    service.getCurricula().subscribe((value) => (response = value));
    backend.expectOne(url).flush({ success: true, data: [{ id: 'first' }] });

    const current = {
      success: true,
      data: [{ id: 'first' }, { id: 'second' }, { id: 'third' }],
    };
    service.getCurricula().subscribe((value) => (response = value));
    backend.expectOne(url).flush(current);

    expect(response).toEqual(current);
  });
});
