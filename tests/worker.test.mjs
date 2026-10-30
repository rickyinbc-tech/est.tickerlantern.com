import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../src/worker.js';
const base=JSON.parse(await readFile(new URL('../data/indices.json',import.meta.url),'utf8'));
const snapshot=(date='2026-10-22T00:00:00Z',patch={})=>({...structuredClone(base),publishedAt:date,...patch});
const request=()=>new Request('https://tickerlantern.com/api/indices');

test('legacy and www domains permanently redirect pages, assets and API requests to HTTPS apex',async()=>{
  for(const host of ['est.tickerlantern.com','www.tickerlantern.com']) {
    for(const path of ['/','/app.js','/api/indices?source=check']) {
      const response=await worker.fetch(new Request('https://'+host+path),{});
      assert.equal(response.status,308);
      assert.equal(response.headers.get('Location'),'https://tickerlantern.com'+path);
    }
  }
  const response=await worker.fetch(new Request('http://tickerlantern.com/?index=sp500'),{});
  assert.equal(response.status,308);
  assert.equal(response.headers.get('Location'),'https://tickerlantern.com/?index=sp500');
});

test('API uses the current published GitHub snapshot without application redeployment',async t=>{
  t.mock.method(globalThis,'fetch',async(url, options)=>{
    assert.equal(url,'https://raw.githubusercontent.com/rickyinbc-tech/est.tickerlantern.com/main/data/indices.json');
    assert.equal(options.redirect,'manual'); // Cloudflare rejects the otherwise standard "error" mode.
    return new Response(JSON.stringify(snapshot()),{headers:{'Content-Type':'text/plain; charset=utf-8'}});
  });
  const response=await worker.fetch(request(),{});
  assert.equal(response.status,200);assert.equal((await response.json()).transport,'github');
});
test('API accepts a valid refreshed snapshot larger than two million characters but rejects oversized responses',async t=>{
  const current=snapshot();
  current.testPadding='x'.repeat(Math.max(0,2_200_000-JSON.stringify(current).length));
  let body=JSON.stringify(current);
  assert.ok(body.length>2_000_000 && body.length<4_000_000);
  t.mock.method(globalThis,'fetch',async()=>new Response(body,{headers:{'Content-Type':'text/plain'}}));
  let response=await worker.fetch(request(),{});
  assert.equal(response.status,200);
  assert.equal((await response.json()).transport,'github');
  body=' '.repeat(4_000_001);
  response=await worker.fetch(request(),{});
  assert.equal(response.status,503);
});
test('upstream failure retains a validated bundled snapshot and identifies fallback',async t=>{
  t.mock.method(globalThis,'fetch',async()=>{throw new Error('Unavailable');});
  const env={ASSETS:{fetch:async()=>Response.json(snapshot('2026-10-01T00:00:00Z'))}};
  const response=await worker.fetch(request(),env); const body=await response.json();
  assert.equal(body.transport,'bundled-fallback');assert.equal(body.publishedAt,'2026-10-01T00:00:00Z');
});
test('invalid remote and invalid bundled payload are both rejected',async t=>{
  t.mock.method(globalThis,'fetch',async()=>Response.json({schemaVersion:1,indices:[{id:'sp500'}]}));
  const env={ASSETS:{fetch:async()=>Response.json({schemaVersion:1,indices:[{id:'sp500'}]})}};
  const response=await worker.fetch(request(),env);assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'no-store');
});
test('invalid newer bundle cannot discard a valid remote snapshot',async t=>{
  t.mock.method(globalThis,'fetch',async()=>Response.json(snapshot()));
  const env={ASSETS:{fetch:async()=>Response.json({...snapshot('2026-10-23T00:00:00Z'),indices:[]})}};
  const body=await(await worker.fetch(request(),env)).json();assert.equal(body.transport,'github');
});
test('a stale GitHub cache cannot regress a newer verified bundled publication',async t=>{
  t.mock.method(globalThis,'fetch',async()=>Response.json(snapshot('2026-10-01T00:00:00Z')));
  const env={ASSETS:{fetch:async()=>Response.json(snapshot())}};
  const body=await(await worker.fetch(request(),env)).json();assert.equal(body.transport,'bundled-newer');
});
test('semantic version outranks timestamps and conflicting same versions cannot replace remote',async t=>{
  const remote=snapshot('2026-10-01T00:00:00Z',{snapshotVersion:4,snapshotId:'a'.repeat(64)});
  t.mock.method(globalThis,'fetch',async()=>Response.json(remote));
  for(const patch of [{snapshotVersion:3,snapshotId:'b'.repeat(64)},{snapshotVersion:4,snapshotId:'b'.repeat(64)}]) {
    const env={ASSETS:{fetch:async()=>Response.json(snapshot('2026-10-22T00:00:00Z',patch))}};
    const body=await(await worker.fetch(request(),env)).json();assert.equal(body.snapshotId,remote.snapshotId);
  }
});
test('API rejects wrong content types even if the body resembles JSON',async t=>{
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify(snapshot()),{headers:{'Content-Type':'text/html'}}));
  const response=await worker.fetch(request(),{});assert.equal(response.status,503);
});
test('API rejects writes and leaves static routing to asset handling',async()=>{
  assert.equal((await worker.fetch(new Request(request(),{method:'POST'}),{})).status,405);
  const page=await worker.fetch(new Request('https://tickerlantern.com/'),{ASSETS:{fetch:async()=>new Response('Static page')}});assert.equal(await page.text(),'Static page');
});
