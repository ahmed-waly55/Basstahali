import { visitorCountry, COUNTRY_CACHE_CONTROL } from './visitor-country';

describe('Hosting visitor country', () => {
  it('reads only the hosting country header and validates the country code', () => {
    expect(visitorCountry({ 'x-vercel-ip-country': 'EG' })).toBe('EG');
    expect(visitorCountry({ 'x-vercel-ip-country': 'eg' })).toBe('EG');
    expect(visitorCountry({ 'x-vercel-ip-country': 'AE' })).toBe('AE');
    expect(visitorCountry({ 'accept-language': 'ar-EG' })).toBeNull();
    expect(visitorCountry({ 'x-country': 'EG' })).toBeNull();
    expect(visitorCountry({ 'x-vercel-ip-country': ['EG', 'AE'] })).toBeNull();
    expect(visitorCountry({ 'x-vercel-ip-country': '<script>' })).toBeNull();
    expect(visitorCountry({})).toBeNull();
    expect(COUNTRY_CACHE_CONTROL).toContain('no-store');
  });
});
