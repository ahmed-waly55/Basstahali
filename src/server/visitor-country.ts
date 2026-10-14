export function visitorCountry(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const value = headers['x-vercel-ip-country'];
  return typeof value === 'string' && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : null;
}

export const COUNTRY_CACHE_CONTROL = 'private, no-store, max-age=0';
