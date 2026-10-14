import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { catchError, of, timeout } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VisitorPricingService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private requested = false;
  readonly country = signal<string | null>(null);
  readonly isEgypt = computed(() => this.country() === 'EG');
  readonly currencyLabel = computed(() =>
    this.isEgypt()
      ? $localize`:@@m_c5dd280359ea:جنيه مصري`
      : $localize`:@@m_3e3938408415:درهم إماراتي`,
  );

  loadCountry(): void {
    if (this.requested || !isPlatformBrowser(this.platformId)) return;
    this.requested = true;
    this.http
      .get<{ country?: unknown }>('/api/visitor-country')
      .pipe(
        timeout(4000),
        catchError(() => of({ country: null })),
      )
      .subscribe((response) => {
        const country = response?.country;
        this.country.set(
          typeof country === 'string' && /^[A-Za-z]{2}$/.test(country)
            ? country.toUpperCase()
            : null,
        );
      });
  }

  amount(aed: number): number {
    return aed * (this.isEgypt() ? 15 : 1);
  }
}
