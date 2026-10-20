import { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { createAppConfig } from './app/app.config';
import { App } from './app/app';

export function bootstrapLocale(locale: 'ar' | 'en', hydrate: boolean): Promise<ApplicationRef> {
  return bootstrapApplication(App, createAppConfig(locale, hydrate));
}
