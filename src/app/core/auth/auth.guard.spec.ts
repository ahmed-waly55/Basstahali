import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { vi } from 'vitest';
import { studentGuard } from './auth.guard';
import { safeReturnUrl } from './auth.models';
import { AuthService } from './auth.service';

describe('Student route guard', () => {
  let ensureStudent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ensureStudent = vi.fn(() => of(false));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { ensureStudent } }],
    });
  });

  function check(url: string): Promise<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(() =>
      studentGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
    return firstValueFrom(result as Observable<boolean | UrlTree>);
  }

  it('allows only a verified Student session', async () => {
    ensureStudent.mockReturnValue(of(true));
    expect(await check('/student')).toBe(true);
    expect(ensureStudent).toHaveBeenCalledOnce();
  });

  it('redirects to login with the requested safe student path, query and fragment', async () => {
    const result = (await check('/student/schedule?week=current#today')) as UrlTree;
    expect(result.queryParams['returnUrl']).toBe('/student/schedule?week=current#today');
    expect(TestBed.inject(Router).serializeUrl(result).startsWith('/login?')).toBe(true);
  });

  it.each([
    '//external.test/student',
    '/\\external.test/student',
    'https://external.test/student',
    '/%2fexternal.test/student',
    '/student%2f..%2flogin',
    '/student/%2e%2e/login',
    '/student/%252e%252e/login',
    '/student\n/schedule',
    '/login?returnUrl=/student',
    '/courses',
    '/student-other',
    '/%malformed',
  ])('rejects unsafe or non-student return URLs: %s', async (value) => {
    expect(safeReturnUrl(value)).toBe('/student');
    const result = (await check(value)) as UrlTree;
    expect(result.queryParams['returnUrl']).toBe('/student');
  });
});
