import { enrichStudyHTML, studyPages } from './seo.js';
import { validateFeed } from './index-data.js';
import { isNotesResearchPath, handleNotesResearch } from './notes-research.js';
import { enrichSearchNavigation } from './search-navigation.js';
const SNAPSHOT = 'https://raw.githubusercontent.com/rickyinbc-tech/est.tickerlantern.com/main/data/indices.json';
const MAX_BYTES = 2_000_000;
async function verified(response, { githubRaw = false } = {}) {
  // The fixed raw.githubusercontent.com JSON URL is served as text/plain.
  // That transport still passes JSON parsing and the complete feed contract.
  const contentType = response.headers.get('Content-Type') || '';
  const validType = /^application\/json(?:;|$)/i.test(contentType) || githubRaw && /^text\/plain(?:;|$)/i.test(contentType);
  if (!response.ok || !validType) throw new Error('Snapshot unavailable or wrong content type.');
  const text = await response.text();
  if (!text || text.length > MAX_BYTES) throw new Error('Invalid snapshot size.');
  return validateFeed(JSON.parse(text));
}
function isNewer(candidate, accepted) {
  if (candidate.snapshotVersion != null && accepted.snapshotVersion != null) {
    if (candidate.snapshotVersion !== accepted.snapshotVersion) return candidate.snapshotVersion > accepted.snapshotVersion;
    if (candidate.snapshotId !== accepted.snapshotId) return false; // conflicting same-version payload
  }
  return Date.parse(candidate.publishedAt) > Date.parse(accepted.publishedAt);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (['est.tickerlantern.com', 'www.tickerlantern.com'].includes(url.hostname) || url.hostname === 'tickerlantern.com' && url.protocol !== 'https:') {
      url.hostname = 'tickerlantern.com';
      url.protocol = 'https:';
      return Response.redirect(url.href, 308);
    }
    if (url.pathname === '/research' || url.pathname === '/research/index.html' || url.pathname === '/index.html' || /^\/research\/[a-z0-9-]+(?:\.html|\/)$/.test(url.pathname) || /^\/(?:about|editorial-policy)(?:\.html|\/)$/.test(url.pathname)) {
      url.pathname = url.pathname === '/index.html' ? '/' : url.pathname === '/research' || url.pathname === '/research/index.html' ? '/research/' : url.pathname.replace(/(?:\.html|\/)$/, '');
      return Response.redirect(url.href, 308);
    }
    if (url.pathname.endsWith('/') && studyPages[url.pathname.slice(0, -1)]) {
      url.pathname = url.pathname.slice(0, -1);
      return Response.redirect(url.href, 308);
    }
    if (url.pathname === '/search/' || url.pathname === '/search.html') {
      url.pathname = '/search';
      return Response.redirect(url.href, 308);
    }
    if (isNotesResearchPath(url.pathname)) {
      const response = await handleNotesResearch(request, env);
      return enrichSearchNavigation(enrichStudyHTML(response, url.pathname));
    }
    if (url.pathname !== '/api/indices') return env.ASSETS.fetch(request);
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    let remote, bundled;
    try {
      // Workers supports manual redirect handling; a 3xx is rejected by verified().
      const response = await fetch(SNAPSHOT, { redirect: 'manual', cf: { cacheTtl: 300, cacheEverything: true }, signal: AbortSignal.timeout(8000) });
      remote = await verified(response, { githubRaw: true });
    } catch (error) {
      console.warn('Published index snapshot unavailable:', error instanceof Error ? error.message : 'Unknown snapshot failure');
      // The independent bundle below must pass the identical contract.
    }
    if (env.ASSETS) {
      try {
        const local = await env.ASSETS.fetch(new Request(new URL('/data/indices.json', url)));
        bundled = await verified(local);
      } catch { /* Invalid fallback cannot displace valid remote observations. */ }
    }
    if (!remote && !bundled) return Response.json({ error: 'No verified index snapshot is available.' }, { status: 503, headers: {'Cache-Control':'no-store'} });
    const useBundled = bundled && (!remote || isNewer(bundled,remote));
    const data = useBundled ? bundled : remote;
    const transport = useBundled ? remote ? 'bundled-newer' : 'bundled-fallback' : 'github';
    const body = JSON.stringify({ ...data, transport });
    return new Response(request.method === 'HEAD' ? null : body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60, s-maxage=300', 'X-Content-Type-Options': 'nosniff', ...(data.snapshotId ? {'X-TickerLantern-Snapshot':data.snapshotId} : {}) } });
  }
};
