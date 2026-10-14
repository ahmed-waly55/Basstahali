import { LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { loadingInterceptor } from './app/core/interceptors/loading-interceptor';

export default [
  { provide: LOCALE_ID, useValue: 'ar' },
  provideZonelessChangeDetection(),
  provideHttpClient(withInterceptors([loadingInterceptor])),
  provideRouter([]),
];
