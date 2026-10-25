export const origin = 'https://tickerlantern.com';
export const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const studyPages = {
  '/notes/research': {title:'Canadian Structured Notes Research', description:'Understand Canadian structured notes, conditional coupons, autocall triggers, principal barriers and the assumptions behind probability models.'},
  '/notes': {title:'Structured Note Screener & Contract Comparison', description:'Compare researched structured-note contracts, coupon conditions, call schedules and principal barriers. Study labels are not trading identifiers.'},
  '/gics': {title:'Equity-linked GIC Research & Return Scenarios', description:'Explore equity-linked GIC payoff mechanics, participation rates, maturity returns and valuation scenarios. Educational models with explicit assumptions.'},
  '/indices': {title:'Structured Note Underlying Index Research', description:'Study adjusted-return indices, fixed-point decrements, historical risk and the distinction between provider backtests and live observations.'},
  '/probabilities': {title:'Structured Note Probability Models & Assumptions', description:'Inspect conditional coupon, early-call and principal-loss models, calibration windows, confidence intervals and the limits of historical simulations.'},
  '/scenarios': {title:'Structured Note Cash-flow Scenario Simulator', description:'Change a hypothetical index path at contractual observation dates and study coupon qualification, early calls, principal repayment and dated cash-flow IRR.'},
  '/methodology': {title:'Structured Note Research Methodology', description:'Read how TickerLantern models contractual cash flows, real-world scenarios, historical index samples and the limits of conditional probability estimates.'},
  '/sources': {title:'Structured Note Sources & Research Coverage', description:'Review official-source references, dated research coverage, model limitations and the separation between independent study results and issuer documents.'}
};
export const footer = '<nav class="tl-seo-footer" aria-label="Research information"><a href="/about">About TickerLantern</a><a href="/editorial-policy">Research &amp; corrections policy</a><a href="/research/">Financial planning guides</a><a href="mailto:support@tickerlantern.com">Contact</a></nav>';
export function schema({title, description, path, article = false, published, modified, collection = false}) {
  const url=origin+path;
  const publisher={'@id':origin+'/#organization'};
  const graph=[
    {'@type':'Organization','@id':publisher['@id'],name:'TickerLantern',url:origin+'/',email:'support@tickerlantern.com'},
    {'@type':'WebSite','@id':origin+'/#website',name:'TickerLantern',alternateName:'Ticker Lantern',url:origin+'/',publisher,inLanguage:'en'},
    {'@type':collection?'CollectionPage':article?'Article':'WebPage','@id':url+'#page',url,name:title,headline:title,description,inLanguage:'en',isPartOf:{'@id':origin+'/#website'},publisher,...(article?{author:{'@type':'Organization',name:'TickerLantern Research',url:origin+'/about'},mainEntityOfPage:url,...(published?{datePublished:published}:{}),...(modified?{dateModified:modified}:{})}:{}),image:origin+'/social.png'}
  ];
  if(path!=='/') {
    const parts=[{name:'Home',item:origin+'/'}];
    if(path.startsWith('/research/')&&path!=='/research/')parts.push({name:'Financial planning & investment research',item:origin+'/research/'});
    parts.push({name:title,item:url});
    graph.push({'@type':'BreadcrumbList','@id':url+'#breadcrumb',itemListElement:parts.map((p,i)=>({'@type':'ListItem',position:i+1,...p}))});
  }
  return JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c');
}
export function socialMeta(title,description) {
  return `<meta property="og:site_name" content="TickerLantern"><meta property="og:image" content="${origin}/social.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="TickerLantern: independent research, clearer assumptions"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${origin}/social.png">`;
}
export function enrichStudyHTML(response,path) {
  const page=studyPages[path];
  if(!page || response.status!==200 || !(response.headers.get('Content-Type')||'').includes('text/html'))return response;
  const title=page.title+' | TickerLantern';
  const head=`<link rel="canonical" href="${origin}${path}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${origin}${path}">${socialMeta(title,page.description)}<link rel="stylesheet" href="/seo.css"><script type="application/ld+json">${schema({...page,path})}</script>`;
  const intro=`<main class="tl-seo-intro"><a href="/">TickerLantern</a><h1>${esc(page.title)}</h1><p>${esc(page.description)}</p><p>Independent non-commercial educational research. Models are conditional estimates, not guarantees or personal advice. Source dates, assumptions and limitations appear in the research application.</p><nav aria-label="Study pages">${Object.entries(studyPages).map(([p,m])=>`<a href="${p}">${esc(m.title)}</a>`).join('')}</nav><p>The interactive research application loads here when JavaScript is available.</p></main>`;
  const headers=new Headers(response.headers);
  headers.delete('Content-Length');headers.delete('ETag');
  headers.set('Cache-Control','no-cache');
  return new HTMLRewriter()
    .on('title',{element(e){e.setInnerContent(title);}})
    .on('meta[name="description"]',{element(e){e.setAttribute('content',page.description);}})
    .on('meta[name="robots"]',{element(e){e.setAttribute('content','index,follow,max-image-preview:large');}})
    .on('head',{element(e){e.append(head,{html:true});}})
    .on('#root',{element(e){e.append(intro,{html:true});}})
    .on('body',{element(e){e.append(footer,{html:true});}})
    .transform(new Response(response.body,{status:response.status,headers}));
}
