import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_AUTH } from './auth.models';
import { AuthService } from './auth.service';

function apiPath(value: string): string | null {
  try {
    // Relative URLs belong to the frontend origin, not implicitly to the configured API host.
    const url = new URL(value);
    if (
      url.origin !== new URL(environment.baseUrl).origin ||
      url.username ||
      url.password ||
      !/^\/api\/v1(?:\/|$)/.test(url.pathname)
    ) {
      return null;
    }
    return url.pathname;
  } catch {
    return null;
  }
}

function bearer(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
    transferCache: false,
    cache: 'no-store',
  });
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const path = apiPath(request.url);
  if (
    !isPlatformBrowser(inject(PLATFORM_ID)) ||
    !path ||
    request.context.get(SKIP_AUTH) ||
    request.headers.has('Authorization') ||
    /^\/api\/v1\/auth\/(?:login|google|refresh-token|logout)\/?$/.test(path)
  ) {
    return next(request);
  }
  const auth = inject(AuthService);
  if (!auth.hasSession()) return next(request);
  return auth.getValidAccessToken().pipe(
    switchMap((token) => {
      const generation = auth.sessionGeneration();
      return next(bearer(request, token)).pipe(
        catchError((error: unknown) => {
          if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
            return throwError(() => error);
          }
          // A 401 expires this session. Neither reads nor writes are automatically replayed.
          return from(auth.expireSession(generation)).pipe(
            switchMap(() => throwError(() => error)),
          );
        }),
      );
    }),
  );
};
