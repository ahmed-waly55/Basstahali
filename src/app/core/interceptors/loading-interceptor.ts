import { isPlatformBrowser } from '@angular/common';
import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { catchError, defer, finalize, throwError, timeout, TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';
import { PreferencesService } from '../services/preferences.service';

/** Opt out for background requests or components that already present their own errors. */
export const SKIP_LOADING = new HttpContextToken(() => false);
export const SKIP_ERROR_NOTIFICATION = new HttpContextToken(() => false);

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  const loading = inject(LoadingService);
  const toast = inject(ToastService);
  const preferences = inject(PreferencesService);
  const browser = isPlatformBrowser(inject(PLATFORM_ID));
  const apiUrl = new URL(environment.baseUrl);
  const url = new URL(request.url, apiUrl);
  // Static assets and other origins retain their own behaviour.
  if (url.origin !== apiUrl.origin || !url.pathname.startsWith('/api/')) return next(request);
  const track = !request.context.get(SKIP_LOADING);
  return defer(() => {
    if (track) loading.show();
    return next(request).pipe(
      timeout(20000),
      catchError((error) => {
        // Read screens have inline retry states. Mutation errors can be suppressed by the caller.
        if (browser && request.method !== 'GET' && !request.context.get(SKIP_ERROR_NOTIFICATION)) {
          const status = error instanceof HttpErrorResponse ? error.status : 0;
          const message =
            error instanceof TimeoutError
              ? 'الخدمة استغرقت وقتًا أطول من المتوقع. حاول مرة أخرى.'
              : status === 429
                ? 'طلبات كثيرة، انتظر قليلًا ثم حاول مرة أخرى.'
                : status === 401 || status === 403
                  ? 'تعذر إتمام الطلب. تأكد من صلاحية حسابك.'
                  : status >= 400 && status < 500
                    ? 'راجع البيانات المدخلة وحاول مرة أخرى.'
                    : 'تعذر الاتصال بالخدمة. حاول مرة أخرى بعد قليل.';
          toast.show(
            preferences.translate(message),
            'error',
            preferences.translate('تعذر إتمام الطلب'),
          );
        }
        // Preserve the original error; never log bodies, attach unrequested credentials, or replay writes.
        return throwError(() => error);
      }),
      finalize(() => {
        if (track) loading.hide();
      }),
    );
  });
};
