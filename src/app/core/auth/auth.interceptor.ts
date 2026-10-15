import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
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
  const generation = auth.sessionGeneration();

  return auth.getValidAccessToken().pipe(
    switchMap((token) =>
      next(bearer(request, token)).pipe(
        catchError((error: unknown) => {
          if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
            return throwError(() => error);
          }
          if (auth.sessionGeneration() !== generation) return throwError(() => error);
          // Writes are never replayed: the caller must explicitly submit them again after signing in.
          if (request.method !== 'GET') {
            auth.invalidateSession();
            return throwError(() => error);
          }
          return auth.refreshAccessToken(token).pipe(
            switchMap((freshToken) => next(bearer(request, freshToken))),
            catchError((retryError: unknown) => {
              if (
                retryError instanceof HttpErrorResponse &&
                retryError.status === 401 &&
                auth.sessionGeneration() === generation
              ) {
                auth.invalidateSession();
              }
              return throwError(() => retryError);
            }),
          );
        }),
      ),
    ),
  );
};
