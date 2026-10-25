import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, validInputs, planningResult } from '../src/planning-models.js';
import { disabilityPrevalenceData as data } from '../src/planning-disability-prevalence-data.js';
import { disabilityMix } from '../src/planning-disability-prevalence-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('the dated all-gender extract retains six reviewed prevalence estimates and twelve published interval bounds',()=>{
 assert.equal(data.modified,'2024-05-28');assert.equal(data.retrieved,'2026-10-25');
 assert.deepEqual(data.ageGroups.map(r=>[r['2017'].value,r['2017'].lower,r['2017'].upper,r['2022'].value,r['2022'].lower,r['2022'].upper]),[[13.1,12.7,13.6,20.1,19.5,20.7],[20,19.6,20.4,24.1,23.7,24.5],[37.8,37,38.6,40.4,39.6,41.3]]);
 assert.deepEqual([data.national['2017'].value,data.national['2022'].value],[22.3,27]);
 for(const r of data.ageGroups)for(const year of [2017,2022])assert.ok(r[year].lower<=r[year].value&&r[year].value<=r[year].upper);
});
test('chart fractions and percentage-point changes preserve source units without changing the denominator',()=>{
 const r=planningResult('disabilityPrevalence');assert.equal(r.charts[0].rows.length,6);
 assert.deepEqual(r.charts[0].rows.map(s=>[s.value,s.lower,s.upper]),data.ageGroups.flatMap(g=>[2017,2022].map(y=>[g[y].value/100,g[y].lower/100,g[y].upper/100])));
 assert.equal(r.charts[1].unit,'pp');for(const [i,v] of [.07,.041,.026].entries())near(r.charts[1].rows[i].value,v);
 assert.ok(!r.charts[1].rows.some(s=>'lower' in s||'upper' in s));
});
test('invented weights reconcile to independent weighted averages and reproduce the worked arithmetic',()=>{
 for(const olderShare of [0,20,40,50,100]){
  const p=disabilityMix(olderShare);near(p.adult+p.older,1);near(p.total,(24.1*(100-olderShare)+40.4*olderShare)/10000);near(p.total,p.contributions.reduce((a,b)=>a+b,0));
  assert.ok(p.total>=.241&&p.total<=.404);assert.ok(!('lower' in p)&&!('upper' in p));
 }
 near(disabilityMix(20).total,.2736);near(disabilityMix(40).total,.3062);near(disabilityMix(40).total-disabilityMix(20).total,.0326);
});
test('editing invented shares preserves the empirical charts and fixed sensitivity curve',()=>{
 const kind='disabilityPrevalence',d=defaults(kind),a=planningResult(kind,d),b=planningResult(kind,{olderShareA:100,olderShareB:0});
 assert.deepEqual(a.charts[0],b.charts[0]);assert.deepEqual(a.charts[1],b.charts[1]);assert.deepEqual(a.charts[3],b.charts[3]);assert.notDeepEqual(a.charts[2],b.charts[2]);near(b.metrics[2][1],-.163);assert.equal(b.metrics[2][2],'pp');
 const equal=planningResult(kind,{olderShareA:50,olderShareB:50});near(equal.metrics[2][1],0);near(equal.metrics[0][1],.3225);
});
test('the source and scenario labels remain distinct and all field bounds render finite accessible charts',()=>{
 const kind='disabilityPrevalence',d=defaults(kind),variants=[d];
 for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs(kind,input),true);const r=planningResult(kind,input),html=renderResult(r,300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/95% CI lower/);assert.match(html,/Arithmetic illustration/);assert.match(html,/Official survey estimates/);}
 assert.equal(validInputs(kind,{...d,olderShareA:101}),false);
});
