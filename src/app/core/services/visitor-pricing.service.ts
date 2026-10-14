import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VisitorPricingService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly deviceTimeZone = signal<string | null>(null);
  readonly timeZone = this.deviceTimeZone.asReadonly();
  readonly isEgypt = computed(() => {
    const zone = this.timeZone()?.toLowerCase();
    return zone === 'africa/cairo' || zone === 'egypt';
  });
  readonly currencyLabel = computed(() =>
    this.isEgypt()
      ? $localize`:@@m_c5dd280359ea:جنيه مصري`
      : $localize`:@@m_3e3938408415:درهم إماراتي`,
  );

  detectDeviceTimeZone(): void {
    // Read the device after hydration; the server's zone says nothing about the visitor.
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      this.deviceTimeZone.set(typeof zone === 'string' && zone.trim() ? zone.trim() : null);
    } catch {
      this.deviceTimeZone.set(null);
    }
  }

  amount(aed: number): number {
    return aed * (this.isEgypt() ? 15 : 1);
  }
}
