import type { IncomingMessage, ServerResponse } from 'node:http';
import handler from '../../api/visitor-country';

describe('Vercel country endpoint', () => {
  function invoke(method: string, country?: string) {
    const headers = new Map<string, string>();
    let body = '';
    const response = {
      statusCode: 200,
      setHeader(name: string, value: string) {
        headers.set(name, value);
      },
      end(value: string) {
        body = value;
      },
    };
    handler(
      { method, headers: { 'x-vercel-ip-country': country } } as unknown as IncomingMessage,
      response as unknown as ServerResponse,
    );
    return { status: response.statusCode, headers, body: JSON.parse(body) };
  }

  it('returns the hosting country without caching it for another visitor', () => {
    const egypt = invoke('GET', 'EG');
    expect(egypt.status).toBe(200);
    expect(egypt.body).toEqual({ country: 'EG' });
    expect(egypt.headers.get('Cache-Control')).toContain('no-store');
    expect(invoke('GET', 'AE').body).toEqual({ country: 'AE' });
    expect(invoke('GET').body).toEqual({ country: null });
  });

  it('rejects methods other than GET', () => {
    expect(invoke('POST', 'EG').status).toBe(405);
    expect(invoke('POST', 'EG').headers.get('Allow')).toBe('GET');
  });
});
