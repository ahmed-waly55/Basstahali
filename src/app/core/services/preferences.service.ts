import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { afterNextRender, inject, Injectable, LOCALE_ID, PLATFORM_ID, signal } from '@angular/core';
import { switchApplicationLanguage, switchingLanguage } from '../i18n/locale-runtime';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly toast = inject(ToastService);
  readonly language = signal<'ar' | 'en'>(
    inject(LOCALE_ID).startsWith('en') ? 'en' : 'ar',
  ).asReadonly();
  readonly dark = signal(false);
  readonly switchingLanguage = switchingLanguage;

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
    void switchApplicationLanguage(this.language() === 'ar' ? 'en' : 'ar').catch(() => {
      this.toast.show($localize`:@@m_e0465a89fde9:تعذر تحميل البيانات`, 'error');
    });
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
