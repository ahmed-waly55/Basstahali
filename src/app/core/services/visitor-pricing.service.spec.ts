import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { VisitorPricingService } from './visitor-pricing.service';

describe('Device time zone pricing', () => {
  const options = Intl.DateTimeFormat().resolvedOptions();
  function deviceZone(timeZone: string | undefined) {
    return vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      ...options,
      timeZone,
    } as Intl.ResolvedDateTimeFormatOptions);
  }
  afterEach(() => vi.restoreAllMocks());

  for (const timeZone of ['Africa/Cairo', 'Egypt']) {
    it(`uses Egyptian prices for the device zone ${timeZone}`, () => {
      deviceZone(timeZone);
      const service = TestBed.inject(VisitorPricingService);
      service.detectDeviceTimeZone();
      expect(service.isEgypt()).toBe(true);
      expect(service.amount(800)).toBe(12000);
      expect(service.amount(1000)).toBe(15000);
      expect(service.currencyLabel()).toBe('جنيه مصري');
    });
  }

  for (const timeZone of [
    'Asia/Dubai',
    'Asia/Riyadh',
    'Europe/Athens',
    'Africa/Johannesburg',
    'UTC',
    undefined,
    '',
  ]) {
    it(`keeps AED for non-Egyptian or unavailable device zones: ${timeZone}`, () => {
      deviceZone(timeZone);
      const service = TestBed.inject(VisitorPricingService);
      service.detectDeviceTimeZone();
      expect(service.isEgypt()).toBe(false);
      expect(service.amount(960)).toBe(960);
      expect(service.currencyLabel()).toBe('درهم إماراتي');
    });
  }

  it('falls back to AED if the browser cannot expose its time zone', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Unavailable');
    });
    const service = TestBed.inject(VisitorPricingService);
    expect(() => service.detectDeviceTimeZone()).not.toThrow();
    expect(service.amount(800)).toBe(800);
  });

  it('never uses the server time zone to identify a visitor', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const read = deviceZone('Africa/Cairo');
    const service = TestBed.inject(VisitorPricingService);
    service.detectDeviceTimeZone();
    expect(read).not.toHaveBeenCalled();
    expect(service.timeZone()).toBeNull();
    expect(service.amount(800)).toBe(800);
  });

  it('refreshes pricing if the device time zone changes between page visits', () => {
    const read = deviceZone('Africa/Cairo');
    const service = TestBed.inject(VisitorPricingService);
    service.detectDeviceTimeZone();
    expect(service.amount(800)).toBe(12000);
    read.mockReturnValue({ ...options, timeZone: 'Asia/Dubai' });
    service.detectDeviceTimeZone();
    expect(service.amount(800)).toBe(800);
  });
});
