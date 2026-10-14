import type { IncomingMessage, ServerResponse } from 'node:http';
import { COUNTRY_CACHE_CONTROL, visitorCountry } from '../src/server/visitor-country';

export default function handler(request: IncomingMessage, response: ServerResponse): void {
  response.setHeader('Cache-Control', COUNTRY_CACHE_CONTROL);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Vary', 'x-vercel-ip-country');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.statusCode = 405;
    response.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  response.end(JSON.stringify({ country: visitorCountry(request.headers) }));
}
