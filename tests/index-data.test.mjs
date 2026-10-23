import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sourceInputs, validateFeed, premium, isStale } from '../src/index-data.js';
import { project, DEFAULTS, validate } from '../src/model.js';
const row = { id:'sample', name:'Sample', forwardPE:18, mean10YearForwardPE:16, dividendYield:2, asOf:'2026-09-30', meanAsOf:'2026-09-30', meanMethod:'Publisher-reported 10-year mean', source:{ publisher:'MSCI', url:'https://www.msci.com/example' }, sync:{ status:'ok' } };
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-10, `${a} != ${b}`);

test('only source-backed fields sync; growth and horizon remain reader assumptions', () => {
  const values = sourceInputs(row, { ...DEFAULTS, growth:4, years:10 });
  assert.equal(values.entryPE,18); assert.equal(values.exitPE,16);
  assert.equal(values.dividendMode,'yield'); assert.equal(values.dividendYield,2);
  assert.equal(values.growth,4); assert.equal(values.years,10);
});
test('manual valuation and yield overrides survive a changed source', () => {
  const current = { ...DEFAULTS, entryPE:29, exitPE:24, dividendMode:'yield', dividendYield:3.5 };
  const values = sourceInputs({...row,forwardPE:20,mean10YearForwardPE:17,dividendYield:1.5},current,{entryPE:true,exitPE:true,dividendMode:true,dividendYield:true});
  assert.equal(values.entryPE,29); assert.equal(values.exitPE,24); assert.equal(values.dividendYield,3.5);
});
test('missing 10-year history stays missing; flat current exit is only a scenario convention', () => {
  const missing={...row,mean10YearForwardPE:null,meanAsOf:null,meanMethod:null};
  assert.equal(sourceInputs(missing).exitPE,18); assert.equal(premium(missing),null);
  assert.equal(validateFeed({schemaVersion:1,indices:[missing]}).indices[0].mean10YearForwardPE,null);
});
test('unconnected benchmark cannot manufacture a sourced valuation', () => {
  const values=sourceInputs({...row,forwardPE:null},DEFAULTS);
  assert.deepEqual(values,DEFAULTS);
});
test('yield-based cash payment and constant-multiple return reconcile', () => {
  const m=project({...DEFAULTS,entryPE:18,exitPE:18,dividendMode:'yield',dividendYield:2});
  close(m.points[1].dividend,2); close(m.points[2].dividend,2.12); close(m.cashIRR,.08); close(m.reinvestedCAGR,.08);
  assert.equal(m.input.dividendMode,'yield');
});
test('zero yield and invalid yield remain distinct', () => {
  const m=project({...DEFAULTS,dividendMode:'yield',dividendYield:0});close(m.priceCAGR,m.cashIRR);
  for(const dividendYield of ['',null,NaN,-1,16]) assert.ok(validate({...DEFAULTS,dividendMode:'yield',dividendYield}).dividendYield);
});
test('date and history provenance are required for published numbers', () => {
  for(const patch of [{asOf:null},{meanAsOf:null},{meanMethod:null},{forwardPE:Infinity},{forwardPE:0},{source:null}]) assert.throws(()=>validateFeed({schemaVersion:1,indices:[{...row,...patch}]}));
});
test('old and failed observations visibly become retained; missing is not stale zero', () => {
  assert.equal(isStale(row,new Date('2026-10-22')),false);
  assert.equal(isStale(row,new Date('2027-01-01')),true);
  assert.equal(isStale({...row,sync:{status:'retained'}},new Date('2026-10-22')),true);
  assert.equal(isStale({...row,asOf:null}),false);
});
test('published snapshot passes the same client contract', async () => {
  const feed=validateFeed(JSON.parse(await readFile(new URL('../data/indices.json',import.meta.url),'utf8')));
  assert.equal(feed.indices.length,21);
  assert.equal(feed.indices.find(r=>r.id==='sp500').source.publisher,'FactSet');
  assert.equal(feed.indices.find(r=>r.id==='tsx').forwardPE,null);
  assert.notEqual(feed.indices.find(r=>r.id==='msci-canada').forwardPE,null);
});
