import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { VisitorPricingService } from './visitor-pricing.service';

describe('Visitor pricing country lookup', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  for (const country of ['EG', 'eg', 'AE', 'SA', 'US', null, 'invalid']) {
    it(`uses EGP only for Egypt, independently of browser language: ${country}`, () => {
      const service = TestBed.inject(VisitorPricingService);
      service.loadCountry();
      service.loadCountry();
      TestBed.inject(HttpTestingController).expectOne('/api/visitor-country').flush({ country });
      expect(service.amount(800)).toBe(country?.toUpperCase() === 'EG' ? 12000 : 800);
      expect(service.currencyLabel()).toBe(
        country?.toUpperCase() === 'EG' ? 'جنيه مصري' : 'درهم إماراتي',
      );
    });
  }

  it('keeps the original currency when lookup fails', () => {
    const service = TestBed.inject(VisitorPricingService);
    service.loadCountry();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/visitor-country')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(service.amount(960)).toBe(960);
  });

  it('falls back after four seconds instead of blocking prices indefinitely', () => {
    vi.useFakeTimers();
    try {
      const service = TestBed.inject(VisitorPricingService);
      service.loadCountry();
      const request = TestBed.inject(HttpTestingController).expectOne('/api/visitor-country');
      vi.advanceTimersByTime(4001);
      expect(request.cancelled).toBe(true);
      expect(service.amount(800)).toBe(800);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not make a geolocation request during server rendering', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const service = TestBed.inject(VisitorPricingService);
    service.loadCountry();
    TestBed.inject(HttpTestingController).expectNone('/api/visitor-country');
    expect(service.amount(800)).toBe(800);
  });
});
