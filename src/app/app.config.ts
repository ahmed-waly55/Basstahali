import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { TitleStrategy } from '@angular/router';
import { SeoTitleStrategy } from './core/services/seo-title.strategy';

import { createRoutes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // <-- بدون withFetch
import { loadingInterceptor } from './core/interceptors/loading-interceptor';

export function createAppConfig(locale: 'ar' | 'en' = 'ar', hydrate = true): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      { provide: LOCALE_ID, useValue: locale },
      { provide: TitleStrategy, useClass: SeoTitleStrategy },
      provideRouter(createRoutes(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
      ...(hydrate ? [provideClientHydration(withEventReplay())] : []),
      provideHttpClient(withInterceptors([loadingInterceptor])),
    ],
  };
}
