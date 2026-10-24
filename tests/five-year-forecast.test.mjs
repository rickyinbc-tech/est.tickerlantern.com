import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fiveYearGrowthPath,calendarToForwardRates,GROWTH_ANCHORS,GROWTH_POLICY,LONG_TERM_REGIONS,longTermGrowth} from '../src/five-year-growth.js';
import {baselineAssessment,baselineForecast,fiveYearCSV} from '../src/five-year-report.js';
import {scenarioInputs} from '../src/scenario-state.js';
import {DEFAULTS,project,annualCSV} from '../src/model.js';
const now=new Date('2026-10-23T12:00:00Z');
const feed=JSON.parse(readFileSync(new URL('../data/indices.json',import.meta.url)));
const row=id=>feed.indices.find(r=>r.id===id);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const expected={
 sp500:[16,8.04,8.04,8.04,8.04],nasdaq100:[28,8.04,8.04,8.04,8.04],russell2000:[44,5.61,5.61,5.61,5.61],
 tsx:[11.6,5.67,5.67,5.67,5.67],'msci-canada':[8.2,8.7,5.67,5.67,5.67],
 acwi:[15.1,12.9,7.07,7.07,7.07],world:[13.2,13.5,7.07,7.07,7.07],eafe:[9.9,5.92,5.92,5.92,5.92],
 em:[24,10,5.66,5.66,5.66],europe:[9.9,10.5,6.57,6.57,6.57],uk:[5,8,9.12,9.12,9.12],ftse100:[7,9.12,9.12,9.12,9.12],
 stoxx600:[14,6.57,6.57,6.57,6.57],japan:[15,7.19,7.19,7.19,7.19],nikkei225:[22,7.19,7.19,7.19,7.19],
 china:[13.7,2.6,2.6,2.6,2.6],hangseng:[3,2.6,2.6,2.6,2.6],csi300:[12,6,2.6,2.6,2.6],
 india:[16.6,5.66,5.66,5.66,5.66],'asia-ex-japan':[26.8,5.66,5.66,5.66,5.66],australia:[4.9,5.92,5.92,5.92,5.92]
};
function parseCSV(text){return text.split('\n').map(line=>{const cells=[];let v='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){v+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){cells.push(v);v='';}else v+=c;}return [...cells,v];});}

test('all 21 indices use named-year forecasts followed by their sourced market or region projection',()=>{
 assert.equal(feed.indices.length,21);assert.equal(Object.keys(GROWTH_ANCHORS).length,21);
 for(const r of feed.indices){
  const before=structuredClone(r.growthForecast),p=fiveYearGrowthPath(r,now),a=baselineAssessment(r,now);
  assert.deepEqual(p.rates,expected[r.id],r.id);assert.equal(p.sourceLinked,true);assert.equal(p.bridge,false);
  assert.equal(p.scenarioDate,r.asOf);assert.equal(p.startYear,+r.asOf.slice(0,4)+1);assert.deepEqual(p.missingYears,[]);
  assert.equal(p.points.length,5);assert.ok(p.points.every(x=>x.policyVersion===GROWTH_POLICY.version));
  assert.deepEqual(r.growthForecast,before);
  if(r.id==='stoxx600'){assert.equal(a.model,null);assert.match(a.reason,/cash-dividend anchor/);continue;}
  const m=a.model,factor=expected[r.id].reduce((n,g)=>n*(1+g/100),1);
  assert.equal(m.input.years,5);assert.equal(m.points.length,6);
  close(m.last.price,100*factor*m.input.exitPE/m.input.entryPE);close(m.epsCAGR,factor**.2-1);
  close(m.cashflows.reduce((npv,cash,i)=>npv+cash/(1+m.cashIRR)**i,0),0);
 }
});

test('regional projection building blocks tie to the verified source table, including dilution',()=>{
 const sourceRows={'us-large':[4.01,2.19,1.84,8.04],'us-small':[2.43,2.19,.99,5.61],canada:[2.99,1.95,.73,5.67],global:[3.92,2.14,1.01,7.07],'global-ex-us':[3.82,1.97,.13,5.92],europe:[4.24,1.79,.54,6.57],uk:[6.06,2.24,.82,9.12],japan:[4.3,2,.89,7.19],em:[3.73,2.24,-.31,5.66],china:[1.4,1.75,-.55,2.6]};
 for(const [id,[real,inflation,buyback,growth]] of Object.entries(sourceRows)){
  const p=LONG_TERM_REGIONS[id];assert.deepEqual(p.components,{realEarningsGrowth:real,inflation,buybackYield:buyback});close(p.growth,growth);close(real+inflation+buyback,growth);
 }
 for(const r of feed.indices){const p=longTermGrowth(r.id);assert.equal(p.publisher,'Invesco Solutions');assert.equal(p.asOf,'2025-12-31');assert.deepEqual(p.pdfPages,[7,11]);assert.ok(p.rationale);assert.equal(p.targetId,r.id);}
 assert.match(longTermGrowth('india').rationale,/emerging-market proxy/);assert.match(longTermGrowth('australia').rationale,/Global ex-US equity proxy/);
 assert.match(longTermGrowth('china').formula,/- 0.55% dilution/);assert.equal(longTermGrowth('unknown'),null);
});

test('house scenarios and original publisher periods retain their identity in model plans and exports',()=>{
 for(const r of feed.indices){
  const p=fiveYearGrowthPath(r,now);
  for(const point of p.points){const published=r.growthForecast.estimates.find(x=>x.year===point.year);
   if(published){assert.equal(point.growth,published.growth);assert.equal(point.periodLabel,published.periodLabel);assert.equal(point.sourceEvidence.periodBasis,r.growthForecast.periodBasis);assert.equal(point.sourceEvidence.forecastType,r.growthForecast.forecastType);assert.equal(point.sourceEvidence.publishedForYear,true);assert.equal(point.basis,r.growthForecast.forecastType==='house'?'published-house scenario':'published-growth scenario');}
   else{assert.equal(point.basis,'long-term EPS projection');assert.equal(point.sourceEvidence.derived,true);assert.equal(point.sourceEvidence.publishedForYear,false);}
  }
 }
 const ftse=fiveYearGrowthPath(row('ftse100'),now).points[0];assert.equal(ftse.periodLabel,'Sep-2027 EPS growth scenario');assert.equal(ftse.sourceEvidence.forecastType,'house');
});

test('a forecast is never capped, faded or carried across gaps and invalid rates block affected returns',()=>{
 for(const r of feed.indices){
  const changed={...r,growthForecast:{...r.growthForecast,estimates:[{year:2027,growth:85},{year:2029,growth:24}]}};
  const p=fiveYearGrowthPath(changed,now),lt=longTermGrowth(r.id).growth;
  assert.deepEqual(p.rates,[85,lt,24,lt,lt],r.id);
  for(const growth of [-100,1001]){const broken={...r,growthForecast:{...r.growthForecast,estimates:[{year:2027,growth}]}};assert.equal(fiveYearGrowthPath(broken,now).rates[0],growth);assert.equal(baselineForecast(broken,now),null);}
 }
});

test('missing or unsupported annual source periods use the long-term projection without inventing source forecasts',()=>{
 for(const r of feed.indices){
  for(const forecast of [undefined,{...r.growthForecast,periodBasis:'quarterly'},{...r.growthForecast,estimates:[]}]){
   const p=fiveYearGrowthPath({...r,growthForecast:forecast},now);assert.deepEqual(p.rates,Array(5).fill(longTermGrowth(r.id).growth));assert.equal(p.coveredYears,0);assert.ok(p.points.every(x=>x.basis==='long-term EPS projection'));
  }
 }
 assert.deepEqual(fiveYearGrowthPath({id:'unknown',asOf:'2026-10-23'},now).rates,['','','','','']);
});

test('user overrides and custom modes remain protected while all earlier source defaults migrate',()=>{
 for(const r of feed.indices)for(const version of ['tickerlantern-five-year-fade-v1','tickerlantern-forward-timing-v2','tickerlantern-forward-timing-v3','tickerlantern-forward-timing-v4']){
  const old={...DEFAULTS,growthMode:'source',annualGrowth:[28,28,28,28,28],growthOverrides:{2029:12},growthPolicyVersion:version};
  const next=scenarioInputs(r,old,{},false,now),rates=[...expected[r.id]];rates[2]=12;
  assert.deepEqual(next.annualGrowth,rates);assert.equal(next.growthPolicyVersion,GROWTH_POLICY.version);
 }
 for(const r of feed.indices){const custom={...DEFAULTS,growthMode:'annual',annualGrowth:[9,8,7,6,5]};assert.deepEqual(scenarioInputs(r,custom,{growthMode:true,annualGrowth:true},true,now).annualGrowth,custom.annualGrowth);}
});

test('calendar rollover never shifts a retained valuation or its named-year forecast schedule',()=>{
 for(const r of feed.indices){const later=fiveYearGrowthPath(r,new Date('2030-01-10'));assert.equal(later.scenarioDate,r.asOf);assert.equal(later.startYear,2027);assert.deepEqual(later.rates,expected[r.id]);}
});

test('all-index CSV preserves all 126 records and the correct source for every forecast and projection',()=>{
 const records=parseCSV(fiveYearCSV(feed,now)),h=records[0],at=name=>h.indexOf(name);
 assert.equal(records.length,127);
 for(const r of feed.indices){const rows=records.slice(1).filter(x=>x[at('Benchmark ID')]===r.id);assert.equal(rows.length,6);assert.deepEqual(rows.slice(1).map(x=>+x[at('EPS growth percent')]),expected[r.id]);
  for(const [i,record] of rows.slice(1).entries()){
   const plan=JSON.parse(record[at('Growth source provenance')]),published=r.growthForecast.estimates.find(x=>x.year===2027+i);
   assert.equal(plan.policyVersion,GROWTH_POLICY.version);assert.equal(plan.sourceEvidence.publisher,published?r.growthForecast.source.publisher:'Invesco Solutions');
   assert.equal(record[at('Growth basis')],published?r.growthForecast.forecastType==='house'?'published-house scenario':'published-growth scenario':'long-term EPS projection');
  }
  if(r.id==='stoxx600')assert.ok(rows.every(x=>x[at('Model status')]==='unavailable'));
  else{assert.ok(rows.every(x=>x[at('Model status')]==='calculated'));close(+rows.at(-1)[3],baselineForecast(r,now).last.price);}
 }
});

test('an equal numeric rate remains long-term projection when no forecast covers that year',()=>{
 const r=row('india'),changed={...r,growthForecast:{...r.growthForecast,estimates:[{year:2027,growth:5.66}]}};
 const records=parseCSV(annualCSV(baselineForecast(changed,now),changed.growthForecast));
 assert.equal(records[2][9],'published-growth scenario');assert.equal(records[3][9],'long-term EPS projection');assert.equal(JSON.parse(records[3].at(-2)).sourceEvidence.publisher,'Invesco Solutions');
});

test('five-year worked example independently reconciles annual cash-flow timing',()=>{
 const m=project({...DEFAULTS,entryPE:20,exitPE:20});close(m.last.price*2,267.64511552);close(m.last.cumulativeDividend*2,16.91127888);close(m.cashIRR,.075);
});

test('legacy calendar bridge research utility still spans five forward transitions',()=>{
 const calendar=[10,20,-5,7,4,3];assert.equal(calendarToForwardRates(calendar,.4).rates.length,5);assert.deepEqual(calendarToForwardRates(calendar,0).rates.map(x=>+x.toFixed(10)),calendar.slice(0,5));
 for(const invalid of [[],Array(5).fill(6),[6,6,6,6,6,-100]])assert.throws(()=>calendarToForwardRates(invalid,.4));
});
