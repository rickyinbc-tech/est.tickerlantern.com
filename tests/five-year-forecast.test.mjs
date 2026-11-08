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
// Independent freshness rule: a forecast older than its declared observation window at the paired valuation date
// is a dated reference only and must not seed the default scenario.
const expired=r=>{const max=r.metricDefinitions?.growthForecast?.freshnessPolicy?.observationMaxAgeDays;return Number.isFinite(max)&&(Date.parse(r.asOf+'T00:00:00Z')-Date.parse(r.growthForecast.asOf+'T00:00:00Z'))/86400000>max;};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const expected=Object.fromEntries(feed.indices.map(r=>{
 const lt=longTermGrowth(r.id).growth;
 if(r.growthForecast.periodBasis==='forecast-horizon'||expired(r))return [r.id,Array(10).fill(lt)];
 // Independent endpoint construction: NTM earnings at every valuation date
 // are the two adjacent calendar EPS levels weighted by the remaining year.
 const y=+r.asOf.slice(0,4),elapsed=(Date.parse(r.asOf)-Date.UTC(y,0,1))/(Date.UTC(y+1,0,1)-Date.UTC(y,0,1));
 const earnings=[100];
 for(let year=y+1;year<=y+11;year++)earnings.push(earnings.at(-1)*(1+(r.growthForecast.estimates.find(p=>p.year===year)?.growth??lt)/100));
 const forward=earnings.slice(0,11).map((e,i)=>e*(1-elapsed)+earnings[i+1]*elapsed);
 return [r.id,forward.slice(1).map((e,i)=>(e/forward[i]-1)*100)];
}));
const closeRates=(a,b)=>{assert.equal(a.length,b.length);a.forEach((v,i)=>close(v,b[i]));};
function parseCSV(text){return text.split('\n').map(line=>{const cells=[];let v='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){v+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){cells.push(v);v='';}else v+=c;}return [...cells,v];});}

test('all 21 indices use period-aware forward transitions or sourced long-term scenarios',()=>{
 assert.equal(feed.indices.length,21);assert.equal(Object.keys(GROWTH_ANCHORS).length,21);
 for(const r of feed.indices){
  const before=structuredClone(r.growthForecast),p=fiveYearGrowthPath(r,now),a=baselineAssessment(r,now);
  closeRates(p.rates,expected[r.id]);assert.equal(p.sourceLinked,true);assert.equal(p.bridge,r.growthForecast.periodBasis!=='forecast-horizon'&&!expired(r));assert.equal(p.forecastExpired,expired(r));
  assert.equal(p.scenarioDate,r.asOf);assert.equal(p.startYear,+r.asOf.slice(0,4)+1);assert.deepEqual(p.missingYears,[]);
  assert.equal(p.points.length,10);assert.ok(p.points.every(x=>x.policyVersion===GROWTH_POLICY.version));
  assert.deepEqual(r.growthForecast,before);
  if(r.id==='stoxx600'){assert.equal(a.model,null);assert.match(a.reason,/cash-dividend anchor/);continue;}
  const m=a.model,factor=expected[r.id].reduce((n,g)=>n*(1+g/100),1);
  assert.equal(m.input.years,10);assert.equal(m.points.length,11);
  close(m.last.price,100*factor*m.input.exitPE/m.input.entryPE);close(m.epsCAGR,factor**.1-1);
  close(m.cashflows.reduce((npv,cash,i)=>npv+cash/(1+m.cashIRR)**i,0),0);
 }
});

test('regional projection building blocks tie to the verified source table, including dilution',()=>{
 // Invesco 2026 CMA Q3 update, Figure 4a p. 7, estimates as of 30 Jun 2026 (10-year USD).
 const sourceRows={'us-large':[3.93,2.26,1.79,7.98],'us-small':[2.6,2.26,1.05,5.91],canada:[2.08,2.02,.8,4.9],global:[3.76,2.17,1.13,7.06],'global-ex-us':[3.56,2.07,.41,6.04],europe:[4.06,1.84,.56,6.46],uk:[5.19,2.14,.82,8.15],japan:[4.3,2.01,.91,7.22],em:[3.44,2.16,-.02,5.58],china:[1.37,1.82,-.6,2.59]};
 for(const [id,[real,inflation,buyback,growth]] of Object.entries(sourceRows)){
  const p=LONG_TERM_REGIONS[id];assert.deepEqual(p.components,{realEarningsGrowth:real,inflation,buybackYield:buyback});close(p.growth,growth);close(real+inflation+buyback,growth);
 }
 for(const r of feed.indices){const p=longTermGrowth(r.id);assert.equal(p.publisher,'Invesco Solutions');assert.equal(p.asOf,'2026-06-30');assert.equal(p.horizonYears,10);assert.deepEqual(p.pdfPages,[7,11]);assert.ok(p.rationale);assert.equal(p.targetId,r.id);}
 assert.match(longTermGrowth('india').rationale,/emerging-market proxy/);assert.match(longTermGrowth('australia').rationale,/Global ex-US equity proxy/);
 assert.match(longTermGrowth('china').formula,/- 0.60% dilution/);assert.equal(longTermGrowth('unknown'),null);
});

test('raw forecast rates remain intact while bridge plans disclose source periods and assumptions',()=>{
 for(const r of feed.indices){
  const p=fiveYearGrowthPath(r,now);
  if(!p.bridge){assert.ok(p.points.every(x=>x.basis==='long-term EPS projection'));continue;}
  assert.equal(p.calendarInputs.length,11);assert.ok(p.bridgeAssumptions.some(x=>x.includes('Uniform')));
  for(const published of r.growthForecast.estimates.filter(x=>x.year>=p.startYear && x.year<p.startYear+11)){
   const original=p.calendarInputs.find(x=>x.year===published.year);
   assert.equal(original.growth,published.growth);assert.equal(original.periodLabel,published.periodLabel || `Calendar year ${published.year} long-term extension`);assert.equal(original.source.periodBasis,r.growthForecast.periodBasis);
  }
  assert.ok(p.points.every(x=>x.sourceEvidence.publishedForYear===false));
  if(r.growthForecast.periodBasis==='publisher-year')assert.ok(p.bridgeAssumptions.some(x=>x.includes('calendar/fiscal')));
  if(r.metricDefinitions.forwardPE.economic.horizon==='forward-unspecified')assert.ok(p.bridgeAssumptions.some(x=>x.includes('rolling NTM')));
 }
 const nasdaq2027=row('nasdaq100').growthForecast.estimates.find(p=>p.year===2027).growth;
 assert.equal(fiveYearGrowthPath(row('nasdaq100')).calendarInputs[0].growth,nasdaq2027);
 assert.ok(fiveYearGrowthPath(row('nasdaq100')).rates[0]>longTermGrowth('nasdaq100').growth);
 assert.equal(fiveYearGrowthPath(row('sp500')).bridgeQuality,'explicit-calendar-ntm');
});

test('bridge retains uncapped rates and named-year gaps; invalid annual levels block affected returns',()=>{
 // A fixed valuation date keeps the expected bridge independent of daily refreshes.
 const r={...row('sp500'),asOf:'2026-10-23'},changed={...r,growthForecast:{...r.growthForecast,estimates:[{year:2027,growth:85},{year:2029,growth:24}]}};
 const p=fiveYearGrowthPath(changed,now);
 assert.deepEqual(p.calendarInputs.map(x=>x.growth),[85,7.98,24,...Array(8).fill(7.98)]);
 {const w=(Date.parse('2026-10-23')-Date.UTC(2026,0,1))/(Date.UTC(2027,0,1)-Date.UTC(2026,0,1)),cy=[1,1.85,1.85*1.0798,1.85*1.0798*1.24],f=i=>(1-w)*cy[i]+w*cy[i+1];
  close(p.rates[0],(f(1)/f(0)-1)*100);close(p.rates[1],(f(2)/f(1)-1)*100);}
 for(const growth of [-100,Infinity]){const broken={...r,growthForecast:{...r.growthForecast,estimates:[{year:2027,growth}]}};assert.ok(fiveYearGrowthPath(broken,now).bridgeError);assert.equal(baselineForecast(broken,now),null);}
 const high={...r,growthForecast:{...r.growthForecast,estimates:[{year:2027,growth:1001}]}};assert.equal(fiveYearGrowthPath(high).calendarInputs[0].growth,1001);
});

test('missing or unsupported annual source periods use the long-term projection without inventing source forecasts',()=>{
 for(const r of feed.indices){
  for(const forecast of [undefined,{...r.growthForecast,periodBasis:'quarterly'},{...r.growthForecast,estimates:[]}]){
   const p=fiveYearGrowthPath({...r,growthForecast:forecast},now);assert.deepEqual(p.rates,Array(10).fill(longTermGrowth(r.id).growth));assert.equal(p.coveredYears,0);assert.ok(p.points.every(x=>x.basis==='long-term EPS projection'));
  }
 }
 assert.deepEqual(fiveYearGrowthPath({id:'unknown',asOf:'2026-10-23'},now).rates,Array(10).fill(''));
});

test('user overrides and custom modes remain protected while all earlier source defaults migrate',()=>{
 for(const r of feed.indices)for(const version of ['tickerlantern-five-year-fade-v1','tickerlantern-forward-timing-v2','tickerlantern-forward-timing-v3','tickerlantern-forward-timing-v4','tickerlantern-forward-bridge-long-term-v6']){
  const old={...DEFAULTS,growthMode:'source',annualGrowth:[28,28,28,28,28],growthOverrides:{2029:12},growthPolicyVersion:version};
  const next=scenarioInputs(r,old,{},false,now),rates=[...expected[r.id]];rates[2]=12;
  closeRates(next.annualGrowth,rates);assert.equal(next.growthPolicyVersion,GROWTH_POLICY.version);
 }
 for(const r of feed.indices){const custom={...DEFAULTS,growthMode:'annual',annualGrowth:[9,8,7,6,5,4,3,2,1,0]};assert.deepEqual(scenarioInputs(r,custom,{growthMode:true,annualGrowth:true},true,now).annualGrowth,custom.annualGrowth);}
});

test('calendar rollover never shifts a retained valuation or its named-year forecast schedule',()=>{
 for(const r of feed.indices){const later=fiveYearGrowthPath(r,new Date('2030-01-10'));assert.equal(later.scenarioDate,r.asOf);assert.equal(later.startYear,2027);closeRates(later.rates,expected[r.id]);}
});

test('all-index CSV preserves all 231 records and the correct source for every forecast and projection',()=>{
 const records=parseCSV(fiveYearCSV(feed,now)),h=records[0],at=name=>h.indexOf(name);
 assert.equal(records.length,232);
 for(const r of feed.indices){const rows=records.slice(1).filter(x=>x[at('Benchmark ID')]===r.id);assert.equal(rows.length,11);closeRates(rows.slice(1).map(x=>+x[at('EPS growth percent')]),expected[r.id]);
  for(const [i,record] of rows.slice(1).entries()){
   const plan=JSON.parse(record[at('Growth source provenance')]),published=r.growthForecast.estimates.find(x=>x.year===2027+i);
   assert.equal(plan.policyVersion,GROWTH_POLICY.version);assert.equal(plan.sourceEvidence.publishedForYear,false);
   assert.equal(record[at('Growth basis')],plan.basis);
   if(plan.basis==='calendar-to-forward model'){assert.equal(plan.sourceEvidence.calendarInputs.length,11);assert.ok(plan.sourceEvidence.bridgeAssumptions.length);}
   else assert.equal(plan.sourceEvidence.publisher,'Invesco Solutions');
  }
  if(r.id==='stoxx600')assert.ok(rows.every(x=>x[at('Model status')]==='unavailable'));
  else{assert.ok(rows.every(x=>x[at('Model status')]==='calculated'));close(+rows.at(-1)[3],baselineForecast(r,now).last.price);}
 }
});

test('an equal numeric rate remains long-term projection when no forecast covers that year',()=>{
 const r=row('india'),changed={...r,growthForecast:{...r.growthForecast,estimates:[{year:2027,growth:5.58}]}};
 const records=parseCSV(annualCSV(baselineForecast(changed,now),changed.growthForecast));
 assert.equal(records[2][9],'calendar-to-forward model');assert.equal(records[3][9],'long-term EPS projection');assert.equal(JSON.parse(records[3].at(-2)).sourceEvidence.publisher,'Invesco Solutions');
});

test('ten-year worked example independently reconciles annual cash-flow timing',()=>{
 const m=project({...DEFAULTS,entryPE:20,exitPE:20});close(m.last.price*2,200*1.06**10);close(m.last.cumulativeDividend*2,3*(1.06**10-1)/.06);close(m.cashIRR,.075);
 assert.equal((m.last.price*2).toFixed(2),'358.17');assert.equal((m.last.cumulativeDividend*2).toFixed(2),'39.54');
});

test('calendar bridge utility spans ten forward transitions',()=>{
 const calendar=[10,20,-5,7,4,3,6,8,-2,5,4];assert.equal(calendarToForwardRates(calendar,.4).rates.length,10);assert.deepEqual(calendarToForwardRates(calendar,0).rates.map(x=>+x.toFixed(10)),calendar.slice(0,10));
 for(const invalid of [[],Array(6).fill(6),Array(10).fill(6),[...Array(10).fill(6),-100]])assert.throws(()=>calendarToForwardRates(invalid,.4));
});

test('an expired published forecast stays a dated reference and falls back to the long-term scenario',()=>{
 const base=row('csi300'),lt=longTermGrowth('csi300').growth;
 const fresh=structuredClone(base);fresh.growthForecast.asOf='2026-10-01';
 const freshPath=fiveYearGrowthPath(fresh,now);assert.equal(freshPath.forecastExpired,false);assert.equal(freshPath.bridge,true);
 const stale=structuredClone(base);stale.growthForecast.asOf='2026-05-14';
 const before=structuredClone(stale.growthForecast),p=fiveYearGrowthPath(stale,now);
 assert.equal(p.forecastExpired,true);assert.equal(p.bridge,false);
 assert.deepEqual(p.rates,Array(10).fill(lt));assert.ok(p.points.every(x=>x.basis==='long-term EPS projection'));
 assert.ok(p.mappingReason.includes(`2026-05-14 estimates were older than their source cadence allows at the ${base.asOf} valuation date`),p.mappingReason);
 assert.equal(fiveYearGrowthPath(stale,new Date('2030-01-10')).forecastExpired,true);
 assert.deepEqual(stale.growthForecast,before);
 // Reader overrides remain protected even when the source forecast has expired.
 assert.equal(fiveYearGrowthPath(stale,now,{2027:9}).points[0].growth,9);
});

test('forecast disqualification explains supersession and definition review accurately',()=>{
 const superseded=structuredClone(row('csi300'));
 superseded.growthForecast.asOf='2026-10-01';
 superseded.growthForecast.sync={status:'superseded'};
 const supersededPath=fiveYearGrowthPath(superseded,now);
 assert.equal(supersededPath.bridge,false);
 assert.match(supersededPath.mappingReason,/marked superseded/);
 assert.doesNotMatch(supersededPath.mappingReason,/older than their source cadence/);
 const review=structuredClone(row('csi300'));
 review.growthForecast.asOf='2026-10-01';
 review.metricDefinitions.growthForecast.evidenceStatus='definition-review-required';
 const reviewPath=fiveYearGrowthPath(review,now);
 assert.equal(reviewPath.bridge,false);
 assert.match(reviewPath.mappingReason,/require definition review/);
 assert.doesNotMatch(reviewPath.mappingReason,/older than their source cadence/);
});
