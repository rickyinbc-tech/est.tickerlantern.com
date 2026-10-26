import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {schema,studyPages,enrichStudyHTML} from '../src/seo.js';
import worker from '../src/worker.js';

test('canonical route variants redirect permanently and preserve model queries',async()=>{
 for(const [from,to] of [['/research','/research/'],['/research/index.html','/research/'],['/index.html','/'],['/research/rrsp-tfsa-tax-timing.html','/research/rrsp-tfsa-tax-timing'],['/research/rrsp-tfsa-tax-timing/','/research/rrsp-tfsa-tax-timing'],['/about/','/about'],['/gics/','/gics']]){
  const response=await worker.fetch(new Request('https://tickerlantern.com'+from+'?index=eafe'),{});
  assert.equal(response.status,308);
  assert.equal(response.headers.get('Location'),'https://tickerlantern.com'+to+'?index=eafe');
 }
});

test('structured data survives script-like text and keeps canonical, author and dates coherent',()=>{
 const title='A </script><script>alert(1)</script> title';
 const value=schema({title,description:'Test',path:'/research/example',article:true,published:'2026-10-25',modified:'2026-10-25'});
 assert.ok(!value.includes('</script>'));
 const graph=JSON.parse(value)['@graph'];
 const article=graph.find(row=>row['@type']==='Article');
 assert.equal(article.headline,title);assert.equal(article.mainEntityOfPage,'https://tickerlantern.com/research/example');
 assert.equal(article.author.name,'TickerLantern Research');
 assert.equal(article.dateModified,'2026-10-25');
 assert.deepEqual(graph.find(row=>row['@type']==='BreadcrumbList').itemListElement.map(row=>row.position),[1,2,3]);
});

test('only reviewed study landing routes receive SEO enrichment; unavailable responses stay unchanged',()=>{
 const unknown=new Response('<h1>Unknown contract</h1>',{headers:{'Content-Type':'text/html'}});
 assert.equal(enrichStudyHTML(unknown,'/notes/TLN999999'),unknown);
 const unavailable=new Response('Unavailable',{status:503,headers:{'Content-Type':'text/html'}});
 assert.equal(enrichStudyHTML(unavailable,'/gics'),unavailable);
 const asset=new Response('js',{headers:{'Content-Type':'text/javascript'}});
 assert.equal(enrichStudyHTML(asset,'/gics'),asset);
});

test('built sitemap covers unique indexable pages with matching canonical URLs and valid structured data',async()=>{
 const sitemap=await readFile('dist/sitemap.xml','utf8');
 const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(urls).size,urls.length);
 const titles=new Set();
 for(const url of urls){
  const path=new URL(url).pathname;
  assert.equal(new URL(url).origin,'https://tickerlantern.com');
  if(studyPages[path])continue;
  const file=path==='/'?'dist/index.html':path.endsWith('/')?'dist'+path+'index.html':'dist'+path+'.html';
  const html=await readFile(file,'utf8');
  assert.ok(!/noindex|nofollow/i.test(html.match(/<head>.*?<\/head>/s)[0]),path);
  assert.equal([...html.matchAll(/rel="canonical"/g)].length,1,path);
  assert.ok(html.includes('rel="canonical" href="'+url+'"'),path);
  assert.ok(html.includes('https://tickerlantern.com/social.png'),path);
  const title=html.match(/<title>(.*?)<\/title>/s)[1];assert.ok(!titles.has(title),'Duplicate title: '+title);titles.add(title);
  const json=html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
  const graph=JSON.parse(json)['@graph'];assert.ok(graph.some(row=>row.url===url),path);
  assert.ok(html.includes('href="'+(path.startsWith('/zh/')?'/zh/editorial-policy':'/editorial-policy')+'"'),path);
 }
 assert.ok((await readFile('dist/index.html','utf8')).includes('BmfsXlNCdI7LU_Irzf3c8nNsVAi7N7kLzxYcFAf2bJE'));
 assert.ok((await readFile('dist/404.html','utf8')).includes('noindex,follow'));
});
