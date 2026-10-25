import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSearch,queryGroups} from '../src/search-engine.js';
import {addSearchNavigation} from '../src/search-navigation.js';
import {planningGuides} from '../src/planning-guides.js';
import {planningResult} from '../src/planning-models.js';
import worker from '../src/worker.js';

const index=JSON.parse(await readFile('dist/search-index.json','utf8'));
const search=createSearch(index.documents);

test('Chinese, Cantonese, English, partial recollections and spelling variants find the intended research',()=>{
  for(const [query,slug] of [
    ['供樓','mortgage-renewal-payment-shock'],
    ['通脹','inflation-purchasing-power'],
    ['通胀','inflation-purchasing-power'],
    ['信用卡最低還款','credit-card-minimum-payment-long-tail'],
    ['卡数最低还款','credit-card-minimum-payment-long-tail'],
    ['RRSP or TFSA','rrsp-tfsa-tax-timing'],
    ['mortgage renewal','mortgage-renewal-payment-shock'],
    ['mortg','mortgage-renewal-payment-shock'],
    ['retirment','retirement-longevity-planning'],
    ['retirment income bridge','retirement-income-bridge'],
    ['複利','savings-compounding'],
    ['How do I save for a house?','home-purchase-down-payment-cash'],
    ['加拿大銀行估值','banks'],
    ['股票掛鈎定存','/gics'],
    ['樓','home-purchase-down-payment-cash'],
  ]){
    const found=search(query,{limit:8});
    assert.ok(found.results.some(d=>d.url.includes(slug)),query+' → '+found.results.map(d=>d.url).join(', '));
  }
  assert.equal(search('供樓').results[0].url,'/research/mortgage-renewal-payment-shock');
  assert.equal(search('retirment').results[0].url,'/research/retirement-longevity-planning');
  assert.equal(search('信用卡最低還款').results[0].url,'/research/credit-card-minimum-payment-long-tail');
  assert.deepEqual(search('xyzqzzzz').results,[]);
  assert.deepEqual(search('雪糕月球飛船').results,[]);
  assert.deepEqual(search('the and please').results,[]);
  assert.deepEqual(queryGroups('   '),[]);
});

test('type and topic filters, counts, pagination and exact chart deep links are coherent',()=>{
  const all=search('mortgage');
  assert.equal(all.counts.all,all.counts.article+all.counts.chart+all.counts.tool);
  const charts=search('供樓',{type:'chart',limit:5});
  assert.equal(charts.results.length,5);
  assert.equal(charts.total,all.counts.chart);
  assert.ok(charts.results.every(d=>d.type==='chart'&&d.url.includes('#')&&d.thumbnail));
  const stocks=search('bank',{topic:'stocks'});
  assert.ok(stocks.results.length>=5);
  assert.ok(stocks.results.every(d=>d.topic==='stocks'));
  assert.equal(search('mortgage',{limit:2}).results.length,2);
  assert.ok(search('mortgage',{limit:48}).results.length>24);
});

test('every guide and every individual chart is indexed with working anchors and real previews',async()=>{
  const urls=new Set(index.documents.map(d=>d.url));
  assert.equal(urls.size,index.documents.length);
  for(const guide of planningGuides){
    const path='/research/'+guide.slug;
    assert.ok(urls.has(path));
    const html=await readFile('dist'+path+'.html','utf8');
    for(const spec of planningResult(guide.planning).charts){
      const doc=index.documents.find(d=>d.url===path+'#'+spec.id);
      assert.ok(doc,path+'#'+spec.id);
      assert.ok(html.includes('id="'+spec.id+'"'));
      assert.match(await readFile('dist'+doc.thumbnail,'utf8'),/^<svg xmlns=/);
    }
  }
  for(const type of ['article','chart','tool'])assert.equal(index.counts[type],index.documents.filter(d=>d.type===type).length);
  assert.ok(!JSON.stringify(index).includes('/Users/'));
});

test('search is visible on mobile navigation, homepage and generated pages; query pages stay out of sitemap',async()=>{
  const home=await readFile('dist/index.html','utf8');
  assert.ok(home.includes('form action="/search" role="search"'));
  assert.equal((home.match(/class="tl-search-link"/g)||[]).length,1);
  assert.ok(home.indexOf('class="tl-search-link"')<home.indexOf('tl-nav--desktop'));
  assert.equal(addSearchNavigation(home),home);
  const html=await readFile('dist/search.html','utf8');
  assert.match(html,/noindex,follow/);
  assert.ok(!String(await readFile('dist/sitemap.xml')).includes('/search'));
  for(const variant of ['/search/','/search.html']){
    const response=await worker.fetch(new Request('https://tickerlantern.com'+variant+'?q=retirement'),{});
    assert.equal(response.status,308);
    assert.equal(response.headers.get('Location'),'https://tickerlantern.com/search?q=retirement');
  }
});
