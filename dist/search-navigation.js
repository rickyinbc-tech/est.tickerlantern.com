export const searchLink='<a class="tl-search-link" href="/search" aria-label="Search articles, charts and tools"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span>Search</span></a>';
// Chinese study pages (/zh/notes, /zh/gics, …) get the Chinese search entry.
export const zhSearchLink=searchLink.replace('href="/search"','href="/zh/search"').replace('Search articles, charts and tools','搜索文章、图表和工具').replace('<span>Search</span>','<span>搜索</span>');
export const searchAssets='<link rel="stylesheet" href="/search.css"><script type="module" src="/search-shortcut.js"></script>';
export function addSearchNavigation(html) {
  if(html.includes('class="tl-search-link"'))return html;
  // Insert beside the logo: the search entry remains visible outside the mobile menu.
  return html.replace('</head>',searchAssets+'</head>').replace(/(<header class="tl-header">[\s\S]*?<a[^>]*class="tl-brand"[\s\S]*?<\/a>)/, '$1'+searchLink);
}
export function enrichSearchNavigation(response, pathname = '') {
  const link=/^\/zh(?:\/|$)/.test(pathname)?zhSearchLink:searchLink;
  if(response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
  const headers=new Headers(response.headers);headers.delete('Content-Length');headers.delete('ETag');
  return new HTMLRewriter().on('head',{element(e){e.append(searchAssets,{html:true});}})
    .on('.tl-header__inner > .tl-brand',{element(e){e.after(link,{html:true});}})
    .transform(new Response(response.body,{status:response.status,headers}));
}
