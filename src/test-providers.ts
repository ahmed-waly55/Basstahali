import { LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { loadingInterceptor } from './app/core/interceptors/loading-interceptor';
import { authInterceptor } from './app/core/auth/auth.interceptor';

export default [
  { provide: LOCALE_ID, useValue: 'ar' },
  provideZonelessChangeDetection(),
  provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor])),
  provideRouter([]),
];
