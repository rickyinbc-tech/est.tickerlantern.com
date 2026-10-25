import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {adviceSource} from '../src/planning-advice-data.js';
import {adviceFeeSchedule} from '../src/planning-advice-cost-models.js';
import {adviceCostGuides} from '../src/planning-advice-cost-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('FCAC extract retains the age/source grain, consistent overlapping observation and separate dates',()=>{
  assert.equal(adviceSource.collection,'February and March 2024');assert.equal(adviceSource.published,'2025-11-17');assert.equal(adviceSource.modified,'2025-11-21');assert.equal(adviceSource.retrieved,'2026-10-25');
  assert.deepEqual(adviceSource.professionalByAge.map(r=>r.percent),[20,26,27]);assert.deepEqual(adviceSource.youngSources.map(r=>r.percent),[57,20,18]);
  assert.equal(adviceSource.professionalByAge[0].percent,adviceSource.youngSources[1].percent);assert.match(adviceSource.sha256,/^[a-f0-9]{64}$/);
});
test('project reviews occur after complete intervals and inside the selected service window',()=>{
  const d=defaults('adviceCost'),p=adviceFeeSchedule(d);
  assert.deepEqual(p.annual.filter(r=>r.project>0).map(r=>r.x),[1,4,7,10]);near(p.annual[0].project,1500);near(p.annual[3].project,500*1.02**3);
  near(adviceFeeSchedule({...d,adviceYears:3}).projectTotal,1500);near(adviceFeeSchedule({...d,adviceYears:4}).projectTotal,1500+500*1.02**3);
  near(p.projectTotal,3191.2314939431553);near(p.retainerTotal,19709.49779952814);
});
test('nominal and present fee totals agree with independent geometric-series calculations',()=>{
  const d=defaults('adviceCost'),p=adviceFeeSchedule(d),n=d.adviceYears,g=1+d.adviceFeeGrowth/100,q=g/(1+d.adviceDiscount/100);
  near(p.retainerTotal,d.adviceRetainer*(g**n-1)/(g-1));near(p.retainerPV,d.adviceRetainer*(q**n-1)/(q-1));
  let reviewNominal=0,reviewPV=0;
  for(let review=1;review<=Math.floor((n-1)/d.adviceReviewEvery);review++){reviewNominal+=d.adviceReview*g**(review*d.adviceReviewEvery);reviewPV+=d.adviceReview*q**(review*d.adviceReviewEvery);}
  near(p.projectTotal,d.adviceProject+reviewNominal);near(p.projectPV,d.adviceProject+reviewPV);
  near(p.retainerPV-p.projectPV,14318.491434884192);
  const equal=adviceFeeSchedule({...d,adviceDiscount:d.adviceFeeGrowth});near(equal.retainerPV,d.adviceRetainer*n);
});
test('zero fee growth, zero discount and empty quotes preserve the correct cash identities',()=>{
  const d={...defaults('adviceCost'),adviceFeeGrowth:0,adviceDiscount:0},p=adviceFeeSchedule(d);
  near(p.projectTotal,d.adviceProject+Math.floor((d.adviceYears-1)/d.adviceReviewEvery)*d.adviceReview);near(p.retainerTotal,d.adviceYears*d.adviceRetainer);
  near(p.projectPV,p.projectTotal);near(p.retainerPV,p.retainerTotal);
  const zero=adviceFeeSchedule({...d,adviceProject:0,adviceReview:0,adviceRetainer:0});near(zero.projectTotal,0);near(zero.retainerTotal,0);
  const retainerFree=planningResult('adviceCost',{...d,adviceRetainer:0});assert.ok(retainerFree.metrics[2][1]<0);
});
test('survey figures stay fixed when fee assumptions change and identify FCAC explicitly',()=>{
  const d=defaults('adviceCost'),a=planningResult('adviceCost',d),b=planningResult('adviceCost',{...d,adviceProject:10000,adviceRetainer:0});
  assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));assert.ok(a.charts.slice(0,2).every(c=>c.source===adviceSource.url&&c.sourceLabel.startsWith('FCAC')));
  assert.ok(a.charts.slice(2).every(c=>!c.source));assert.equal(adviceCostGuides.length,1);
});
test('fee inputs reject fractional service periods and all supported boundaries render four finite charts/tables',()=>{
  const d=defaults('adviceCost'),fields=definitions.adviceCost.fields;
  assert.equal(validInputs('adviceCost',{...d,adviceYears:2.5}),false);assert.equal(validInputs('adviceCost',{...d,adviceReviewEvery:1.5}),false);
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
  for(const input of cases){assert.ok(validInputs('adviceCost',input));const result=planningResult('adviceCost',input);finite(result);assert.equal(result.charts.length,4);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
