// The one place that turns every page's legacy "Indices → /" nav link into the
// current pair: the planner toolkit at / and index valuations at /valuations.
// The build applies it to every static page (English and Chinese); the worker
// applies the same change to pages streamed from the notes service.
const LABELS = { en: { home: 'Planner toolkit', valuations: 'Valuations' }, zh: { home: '理财沟通工具（英文版）', valuations: '指数估值' } };
const LEGACY = /<a(?: aria-current="page")? href="(\/|\/zh\/)"(?: aria-current="page")?>(?:Indices|指数)<\/a>/g;

export const isZhPath = path => /^\/zh(?:\/|$)/.test(path);
const pageOf = path => { const p = path.replace(/^\/zh(?=\/|$)/, '') || '/'; return p === '/' ? 'home' : p === '/valuations' ? 'valuations' : ''; };

export function navLinks(path) {
  const zh = isZhPath(path), root = zh ? '/zh/' : '/', l = LABELS[zh ? 'zh' : 'en'], page = pageOf(path);
  const cur = key => (page === key ? ' aria-current="page"' : '');
  return `<a href="${root}"${cur('home')}>${l.home}</a><a href="${root}valuations"${cur('valuations')}>${l.valuations}</a>`;
}

/** Rewrite the legacy link in static HTML. Idempotent. */
export function applySiteNavigation(html, path) {
  return html.replace(LEGACY, () => navLinks(path));
}

/** Streaming equivalent for worker responses (HTMLRewriter). */
export function enrichSiteNavigation(response, path) {
  if (response.status !== 200 || !(response.headers.get('Content-Type') || '').includes('text/html')) return response;
  const replace = { element(e) { e.replace(navLinks(path), { html: true }); } };
  return new HTMLRewriter().on('.tl-nav a[href="/"]', replace).on('.tl-nav a[href="/zh/"]', replace).transform(response);
}
