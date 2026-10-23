import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sourceInputs, validateFeed, premium, isStale, isDatedMean, historyCoverage, browserCheckOverdue } from '../src/index-data.js';
import { project, DEFAULTS, validate } from '../src/model.js';
const row = { id:'sp500', name:'S&P 500', forwardPE:18, mean10YearForwardPE:16, dividendYield:2, asOf:'2026-09-30', meanAsOf:'2026-09-30', meanMethod:'Publisher-reported 10-year mean', source:{ publisher:'MSCI', url:'https://www.msci.com/example' }, sync:{ status:'ok' }, historicalCompatibility:{outcome:'compatible',allowComparison:true,allowExitDefault:true,reasons:[]} };
const base = JSON.parse(await readFile(new URL('../data/indices.json',import.meta.url),'utf8'));
const snapshot = value => ({...structuredClone(base), indices:base.indices.map(item=>item.id===row.id?structuredClone(value):structuredClone(item))});
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-10, `${a} != ${b}`);

test('a missed browser source check becomes overdue without a new server snapshot', () => {
  const source = {transport:'scheduled-browser',checkedAt:'2026-10-22T12:00:00Z'};
  assert.equal(browserCheckOverdue(source,new Date('2026-10-24T11:59:59Z')),false);
  assert.equal(browserCheckOverdue(source,new Date('2026-10-24T12:00:01Z')),true);
  assert.equal(isStale({...row,source,asOf:'2026-10-22'},new Date('2026-10-24T12:00:01Z')),true);
  assert.equal(browserCheckOverdue({transport:'scheduled-browser'}),true);
});

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
  assert.equal(validateFeed(snapshot(missing)).indices[0].mean10YearForwardPE,null);
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
  for(const patch of [{asOf:null},{meanAsOf:null},{meanMethod:null},{forwardPE:Infinity},{source:null}]) assert.throws(()=>validateFeed(snapshot({...row,...patch})));
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
  for (const item of feed.indices) if (item.mean10YearForwardPE != null) assert.ok((item.meanSource || item.source)?.url);
  assert.notEqual(feed.indices.find(r=>r.id==='msci-canada').forwardPE,null);
});


test('historical means keep a separate date and source from the current multiple', () => {
  const historic = { ...row, meanAsOf:'2025-12-31', meanSource:{publisher:'History publisher',url:'https://example.com/history',syncMode:'dated-reference'} };
  assert.equal(isDatedMean(historic, new Date('2026-10-22')),true);
  assert.equal(isDatedMean(row, new Date('2026-10-22')),false);
  assert.match(historyCoverage({indices:[historic,row]}), /1 older dated references/);
  assert.equal(sourceInputs(historic).exitPE,16);
  assert.equal(validateFeed(snapshot(historic)).indices[0].asOf,'2026-09-30');
});


test('feed rejects invalid real dates, future observations, identities and incomplete catalogues',()=>{
  for (const patch of [{asOf:'2026-02-30'},{asOf:'2099-01-01'},{name:'MSCI World'},{id:'spy-etf'}]) assert.throws(()=>validateFeed(snapshot({...row,...patch})));
  assert.throws(()=>validateFeed({...snapshot(row),indices:[row]}));
  const duplicate=snapshot(row); duplicate.indices[1]=row; assert.throws(()=>validateFeed(duplicate));
  for (const patch of [{publishedAt:'2026-02-30T00:00:00Z'},{publishedAt:'2099-01-01T00:00:00Z'},{schemaVersion:2},{snapshotVersion:1,snapshotId:'wrong'}]) assert.throws(()=>validateFeed({...snapshot(row),...patch}));
});
test('source observations outside calculator bounds and zero retain their meaning',()=>{
  for(const forwardPE of [0,-2,200]) assert.equal(validateFeed(snapshot({...row,forwardPE})).indices[0].forwardPE,forwardPE);
  assert.equal(validateFeed(snapshot({...row,dividendYield:0})).indices[0].dividendYield,0);
  assert.throws(()=>validateFeed(snapshot({...row,source:{...row.source,sha256:'invalid'}})));
});
test('unassessed or qualified historical references cannot imply a premium or default',()=>{
  for(const historicalCompatibility of [undefined,{outcome:'qualified',allowComparison:false,allowExitDefault:false}]) {
    const item={...row,historicalCompatibility};
    assert.equal(premium(item),null);
    assert.equal(sourceInputs(item,{...DEFAULTS,entryPE:20},{entryPE:true}).exitPE,20);
  }
});
