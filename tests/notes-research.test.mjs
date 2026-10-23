import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import {isNotesResearchPath,handleNotesResearch} from '../src/notes-research.js';

test('research routing preserves terminal, bank, institutional, API and privacy paths', () => {
  for(const path of ['/notes','/notes/','/notes/research','/notes/RBC16727','/indices/SOLCD265','/gics','/gics/','/probabilities','/scenarios/','/methodology','/sources/','/downloads','/downloads/notes.csv','/notes-app/assets/index-abc.js','/api/notes/health']) assert.equal(isNotesResearchPath(path),true,path);
  for(const path of ['/','/cad-gic','/bank-portfolios','/institutional-portfolios','/api/gic','/api/macro','/api/indices','/data/indices.json','/app.js','/privacy','/assets/index-abc.js','/research/royal-bank-valuation','/notes-other','/downloads-other']) assert.equal(isNotesResearchPath(path),false,path);
});

test('apex worker dispatches research directly to its service, preserving request and response', async () => {
  for(const path of ['/gics?lang=zh','/notes/RBC16727','/downloads/research.json','/notes-app/assets/index-abc.js']) {
    let received;
    const response=await worker.fetch(new Request('https://tickerlantern.com'+path),{NOTES_RESEARCH:{fetch:async request=>{received=request;return new Response('study',{headers:{'X-Study':'retained'}});}}},{});
    assert.equal(received.url,'https://tickerlantern.com'+path);
    assert.equal(response.headers.get('X-Study'),'retained');
    assert.equal(await response.text(),'study');
  }
});

test('research health maps to the service health endpoint; unavailable service fails explicitly', async () => {
  const response=await handleNotesResearch(new Request('https://tickerlantern.com/api/notes/health'),{NOTES_RESEARCH:{fetch:async request=>Response.json({path:new URL(request.url).pathname})}});
  assert.deepEqual(await response.json(),{path:'/api/health'});
  assert.equal((await handleNotesResearch(new Request('https://tickerlantern.com/notes'),{})).status,503);
});

test('www retains a single canonical redirect before dispatching research', async () => {
  const response=await worker.fetch(new Request('https://www.tickerlantern.com/gics?lang=zh'),{},{});
  assert.equal(response.status,308);
  assert.equal(response.headers.get('Location'),'https://tickerlantern.com/gics?lang=zh');
});
