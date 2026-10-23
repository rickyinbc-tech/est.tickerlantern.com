import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fiveYearGrowthPath, GROWTH_ANCHORS } from '../src/five-year-growth.js';
import { baselineForecast, fiveYearCSV } from '../src/five-year-report.js';
import { scenarioInputs, switchScenario, loadScenarios, STORAGE_KEY } from '../src/scenario-state.js';
import { DEFAULTS, project, annualCSV } from '../src/model.js';

const now = new Date('2026-10-23T12:00:00Z');
const feed = JSON.parse(readFileSync(new URL('../data/indices.json',import.meta.url)));
const row = id => feed.indices.find(r=>r.id===id);
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function parseCSV(text) {
  return text.split('\n').map(line => {
    const cells=[]; let value='', quoted=false;
    for(let i=0;i<line.length;i++) {
      if(line[i]==='"') { if(quoted && line[i+1]==='"'){value+='"';i++;}else quoted=!quoted; }
      else if(line[i]===',' && !quoted){cells.push(value);value='';}else value+=line[i];
    }
    cells.push(value); return cells;
  });
}

test('all 21 actual benchmarks have five complete years and finite matching returns',()=>{
  assert.equal(feed.indices.length,21); assert.equal(Object.keys(GROWTH_ANCHORS).length,21);
  for(const r of feed.indices) {
    const path=fiveYearGrowthPath(r,now), m=baselineForecast(r,now);
    assert.equal(path.rates.length,5); assert.deepEqual(path.missingYears,[]);
    assert.equal(path.rates.at(-1),GROWTH_ANCHORS[r.id].growth);
    assert.equal(m.input.years,5); assert.equal(m.points.length,6);
    const earningsFactor=path.rates.reduce((x,g)=>x*(1+g/100),1);
    close(m.last.price,100*earningsFactor*m.input.exitPE/m.input.entryPE);
    close(m.epsCAGR,earningsFactor**.2-1);
    close(m.cashflows.reduce((npv,c,i)=>npv+c/(1+m.cashIRR)**i,0),0);
    assert.ok(Number.isFinite(m.reinvestedCAGR));
  }
});

test('specific five-year paths fade growth instead of repeating a cyclical rebound',()=>{
  assert.deepEqual(fiveYearGrowthPath(row('sp500'),now).rates,[16,13.5,11,8.5,6]);
  assert.deepEqual(fiveYearGrowthPath(row('nasdaq100'),now).rates,[28,15.5,13,10.5,8]);
  assert.deepEqual(fiveYearGrowthPath(row('russell2000'),now).rates,[44,13.5,11,8.5,6]);
  assert.deepEqual(fiveYearGrowthPath(row('em'),now).rates,[24,10,9,8,7]);
  assert.deepEqual(fiveYearGrowthPath(row('hangseng'),now).rates,[3,3.5,4,4.5,5]);
  // The 2026 32.8% rate is historical context, never a full future holding year.
  assert.equal(baselineForecast(row('sp500'),now).input.annualGrowth.includes(32.8),false);
});

test('new source coverage replaces only modeled years; custom years remain protected',()=>{
  const r=row('sp500'), changed={...r,growthForecast:{...r.growthForecast,estimates:[...r.growthForecast.estimates,{year:2028,growth:9}]}};
  const path=fiveYearGrowthPath(changed,now,{2029:2});
  assert.deepEqual(path.rates,[16,9,2,7,6]);
  assert.equal(path.points[1].basis,'consensus');
  assert.equal(path.points[2].basis,'custom assumption');
  assert.equal(path.points[3].basis,'model extension');
});

test('old browser horizons migrate to five even when paused or explicitly locked',()=>{
  const old={...DEFAULTS,growthMode:'annual',years:2,annualGrowth:[7,8],growth:4,entryPE:17};
  const data={version:1,scenarios:[['sp500',old]],overrides:[['sp500',{growthMode:true,annualGrowth:true,years:true,entryPE:true}]],following:false};
  const loaded=loadScenarios({getItem:key=>key===STORAGE_KEY?JSON.stringify(data):null});
  const input=switchScenario(row('sp500'),loaded.scenarios.get('sp500'),loaded.overrides.get('sp500'),loaded.following,now);
  assert.equal(input.years,5);assert.deepEqual(input.annualGrowth,[7,8,4,4,4]);assert.equal(input.entryPE,17);
  const source=scenarioInputs(row('sp500'),{...DEFAULTS,growthMode:'source',growthStartYear:2027,years:1,annualGrowth:[12]}, {},false,now);
  assert.deepEqual(source.annualGrowth,[12,13.5,11,8.5,6]);assert.equal(source.years,5);
});

test('year rollover keeps five years and labels an all-model path when sources expire',()=>{
  const path=fiveYearGrowthPath(row('india'),new Date('2029-10-23T12:00:00Z'));
  assert.equal(path.startYear,2030);assert.deepEqual(path.rates,[9,9,9,9,9]);
  assert.ok(path.points.every(p=>p.basis==='model extension'));
  assert.deepEqual(fiveYearGrowthPath({id:'unknown'},now).rates,['','','','','']);
});

test('annual and universe exports reproduce the five-year model with honest provenance',()=>{
  const m=baselineForecast(row('sp500'),now), csv=parseCSV(annualCSV(m,row('sp500').growthForecast));
  assert.equal(csv.length,7); assert.equal(csv[2][9],'consensus');
  for(const p of csv.slice(3)) {
    assert.equal(p[9],'model extension'); assert.equal(p[10],'');assert.equal(p[11],'');
    const evidence=JSON.parse(p.at(-2));assert.equal(evidence.terminalGrowth,6);assert.equal(evidence.policyVersion,'tickerlantern-five-year-fade-v1');
  }
  close(+csv.at(-1)[3],m.last.price);
  const all=parseCSV(fiveYearCSV(feed,now));assert.equal(all.length,127);
  const header=all[0], id=header.indexOf('Benchmark ID'), years=header.indexOf('Holding years');
  for(const r of feed.indices) {
    const records=all.slice(1).filter(p=>p[id]===r.id);assert.equal(records.length,6);
    assert.ok(records.every(p=>p[years]==='5'));
    close(+records.at(-1)[6],baselineForecast(r,now).last.cashWealth);
  }
});

test('five-year worked example independently reconciles annual cash-flow timing',()=>{
  const m=project({...DEFAULTS,entryPE:20,exitPE:20});
  close(m.last.price*2,267.64511552);close(m.last.cumulativeDividend*2,16.91127888);
  close((m.last.cashWealth/100-1)*100,42.2781972);close(m.cashIRR,.075);
});
