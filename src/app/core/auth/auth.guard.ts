import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { safeReturnUrl } from './auth.models';
import { AuthService } from './auth.service';

export const studentGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureStudent().pipe(
    map((valid) =>
      valid
        ? true
        : router.createUrlTree(['/login'], {
            queryParams: { returnUrl: safeReturnUrl(state.url) },
          }),
    ),
  );
};
