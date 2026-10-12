import { ENGLISH } from './translations';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { afterNextRender, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private document = inject(DOCUMENT);
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  language = signal<'ar' | 'en'>('ar');
  dark = signal(false);
  constructor() {
    afterNextRender(() => {
      try {
        this.language.set(localStorage.getItem('basstahali-language') === 'en' ? 'en' : 'ar');
        const theme = localStorage.getItem('basstahali-theme');
        this.dark.set(theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
      } catch { /* Storage is optional. */ }
      this.apply();
    });
  }
  translate(value: unknown): string {
    const text = String(value ?? '');
    return this.language() === 'en' ? ENGLISH[text.replace(/\s+/g, ' ').trim()] ?? text : text;
  }
  itemName(item: {nameAr?: string; nameEn?: string; name?: string; title?: string}): string {
    return (this.language() === 'en' ? item.nameEn || item.nameAr : item.nameAr || item.nameEn) || item.name || item.title || '';
  }
  toggleLanguage(): void { this.language.update(value => value === 'ar' ? 'en' : 'ar'); this.apply(); }
  toggleTheme(): void { this.dark.update(value => !value); this.apply(); }
  private apply(): void {
    this.document.documentElement.lang = this.language();
    this.document.documentElement.dir = this.language() === 'ar' ? 'rtl' : 'ltr';
    this.document.documentElement.classList.toggle('dark', this.dark());
    if (this.browser) {
      try {
        localStorage.setItem('basstahali-language', this.language());
        localStorage.setItem('basstahali-theme', this.dark() ? 'dark' : 'light');
      } catch { /* Keep preferences in memory if storage is unavailable. */ }
    }
  }
}
