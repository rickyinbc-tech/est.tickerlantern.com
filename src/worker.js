import { validateFeed } from './index-data.js';
const SNAPSHOT = 'https://raw.githubusercontent.com/rickyinbc-tech/est.tickerlantern.com/main/data/indices.json';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/indices') return env.ASSETS.fetch(request);
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    let data, transport;
    try {
      const response = await fetch(SNAPSHOT, { cf: { cacheTtl: 300, cacheEverything: true }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Snapshot unavailable');
      data = await response.json();
      validateFeed(data);
      transport = 'github';
    } catch {
      const local = await env.ASSETS.fetch(new Request(new URL('/data/indices.json', url), request));
      if (!local.ok) return Response.json({ error: 'No verified index snapshot is available.' }, { status: 503 });
      data = await local.json();
      transport = 'bundled-fallback';
    }
    // A just-published build may be newer than the cached GitHub response.
    // Never replace its verified observations with an older upstream snapshot.
    if (transport === 'github' && env.ASSETS) {
      const local = await env.ASSETS.fetch(new Request(new URL('/data/indices.json', url), request));
      if (local.ok) {
        const bundled = await local.json();
        if (Date.parse(bundled.publishedAt) > Date.parse(data.publishedAt)) {
          validateFeed(bundled);
          data = bundled;
          transport = 'bundled-newer';
        }
      }
    }
    const body = JSON.stringify({ ...data, transport });
    return new Response(request.method === 'HEAD' ? null : body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60, s-maxage=300', 'X-Content-Type-Options': 'nosniff' } });
  }
};
