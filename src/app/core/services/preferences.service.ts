import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { afterNextRender, inject, Injectable, LOCALE_ID, PLATFORM_ID, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly language = signal<'ar' | 'en'>(
    inject(LOCALE_ID).startsWith('en') ? 'en' : 'ar',
  ).asReadonly();
  readonly dark = signal(false);

  constructor() {
    this.applyLocale();
    afterNextRender(() => {
      try {
        const theme = localStorage.getItem('basstahali-theme');
        this.dark.set(
          theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches,
        );
      } catch {
        /* Storage is optional. */
      }
      this.applyTheme();
    });
  }

  itemName(item: { nameAr?: string; nameEn?: string; name?: string; title?: string }): string {
    return (
      (this.language() === 'en' ? item.nameEn || item.nameAr : item.nameAr || item.nameEn) ||
      item.name ||
      item.title ||
      ''
    );
  }

  toggleLanguage(): void {
    if (!this.browser) return;
    const location = this.document.location;
    const path = location.pathname.replace(/^\/en(?=\/|$)/, '') || '/';
    const targetPath = this.language() === 'ar' ? `/en${path}` : path;
    location.assign(targetPath + location.search + location.hash);
  }

  toggleTheme(): void {
    this.dark.update((value) => !value);
    this.applyTheme();
  }

  private applyLocale(): void {
    this.document.documentElement.lang = this.language();
    this.document.documentElement.dir = this.language() === 'ar' ? 'rtl' : 'ltr';
  }

  private applyTheme(): void {
    this.document.documentElement.classList.toggle('dark', this.dark());
    if (this.browser) {
      try {
        localStorage.setItem('basstahali-theme', this.dark() ? 'dark' : 'light');
      } catch {
        /* Keep the selected theme in memory if storage is unavailable. */
      }
    }
  }
}
