import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
const validRow={id:'sp500',name:'S&P 500',forwardPE:19,mean10YearForwardPE:19.1,dividendYield:null,asOf:'2026-10-16',meanAsOf:'2026-10-16',meanMethod:'Publisher-reported 10-year mean',source:{publisher:'FactSet',url:'https://insight.factset.com/example'}};

test('API uses the current published GitHub snapshot without application redeployment', async t => {
  t.mock.method(globalThis,'fetch',async ()=>Response.json({schemaVersion:1,indices:[validRow],publishedAt:'2026-10-22T00:00:00Z'}));
  const response=await worker.fetch(new Request('https://est.tickerlantern.com/api/indices'),{});
  assert.equal(response.status,200);
  assert.equal((await response.json()).transport,'github');
});
test('upstream failure retains the bundled snapshot and identifies fallback',async t=>{
  t.mock.method(globalThis,'fetch',async()=>{throw new Error('Unavailable');});
  const env={ASSETS:{fetch:async()=>Response.json({schemaVersion:1,indices:[{id:'sp500'}],publishedAt:'2026-10-01T00:00:00Z'})}};
  const response=await worker.fetch(new Request('https://est.tickerlantern.com/api/indices'),env);
  const body=await response.json();
  assert.equal(body.transport,'bundled-fallback'); assert.equal(body.publishedAt,'2026-10-01T00:00:00Z');
});
test('a stale GitHub cache cannot regress a newer bundled publication',async t=>{
  const snapshot=date=>({schemaVersion:1,indices:[validRow],publishedAt:date});
  t.mock.method(globalThis,'fetch',async()=>Response.json(snapshot('2026-10-01T00:00:00Z')));
  const env={ASSETS:{fetch:async()=>Response.json(snapshot('2026-10-22T00:00:00Z'))}};
  const response=await worker.fetch(new Request('https://est.tickerlantern.com/api/indices'),env);
  const body=await response.json();
  assert.equal(body.transport,'bundled-newer');
  assert.equal(body.publishedAt,'2026-10-22T00:00:00Z');
});
test('API rejects writes and leaves static routing to asset handling',async()=>{
  const write=await worker.fetch(new Request('https://est.tickerlantern.com/api/indices',{method:'POST'}),{});
  assert.equal(write.status,405);
  const page=await worker.fetch(new Request('https://est.tickerlantern.com/'),{ASSETS:{fetch:async()=>new Response('Static page')}});
  assert.equal(await page.text(),'Static page');
});
