import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {disabilityCapPoint,disabilityCapPlan} from '../src/planning-disability-cap-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);

test('the default cap reduces the formula to CAD 4,000 and the later gross ratio declines as eligible earnings rise',()=>{
 const p=disabilityCapPlan(defaults('disabilityCap'));
 assert.equal(p.start.percentageAmount,4800);assert.equal(p.start.reduction,800);assert.equal(p.start.amount,4000);assert.equal(p.start.ratio,.5);
 near(p.end.earnings,11841.954279346755);assert.equal(p.end.amount,4000);near(p.end.ratio,.3377820844128993);
});
test('below the cap the formula ratio equals the entered percentage, while the capped ratio varies inversely with earnings',()=>{
 const below=disabilityCapPoint(5000,60,4000);assert.equal(below.amount,3000);assert.equal(below.reduction,0);assert.equal(below.ratio,.6);
 const at=disabilityCapPoint(4000/.6,60,4000);near(at.amount,4000);near(at.ratio,.6);
 const first=disabilityCapPoint(10000,60,4000),second=disabilityCapPoint(20000,60,4000);assert.equal(first.amount,4000);assert.equal(second.amount,4000);near(first.ratio,2*second.ratio);
});
test('a future review can move from percentage-limited to dollar-limited without changing either contractual assumption',()=>{
 const p=disabilityCapPlan({...defaults('disabilityCap'),monthlyEarnings:5000});
 near(p.rows[7].ratio,.6);assert.ok(p.rows[8].ratio<.6);assert.equal(p.rows[8].amount,4000);
 for(const row of p.rows){near(row.earnings,5000*Math.pow(1.04,row.year));assert.ok(row.amount<=4000&&row.amount<=row.earnings*.6+1e-7);}
});
test('zero earnings growth fixes the ratio and a sufficiently high cap preserves the percentage throughout the review path',()=>{
 const d=defaults('disabilityCap'),flat=disabilityCapPlan({...d,payGrowth:0});assert.ok(flat.rows.every(r=>r.ratio===.5&&r.amount===4000));
 const high=disabilityCapPlan({...d,monthlyEarnings:2000,payGrowth:8,years:20,benefitCap:10000});
 for(const row of high.rows){near(row.ratio,.6);near(row.amount,row.earnings*.6);near(row.reduction,0);}
});
test('the starting waterfall and independent cap-and-earnings matrix reconcile the formula without adding salary to benefits',()=>{
 const d=defaults('disabilityCap'),r=planningResult('disabilityCap');
 near(r.charts[0].rows.reduce((a,b)=>a+b.value,0),4000);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const earnings=[4000,8000,12000,16000][row],cap=[3000,4000,5000,6000][col];near(r.charts[3].rows[row].values[col],Math.min(earnings*.6,cap)/earnings);
 }
 assert.equal(r.charts[3].rows[3].values[0],.1875);
 const changed=planningResult('disabilityCap',{...d,payGrowth:8,years:20});assert.deepEqual(r.charts[3],changed.charts[3]);
});
test('whole review years and all field boundaries produce four finite charts and data tables',()=>{
 const d=defaults('disabilityCap'),fields=definitions.disabilityCap.fields;assert.equal(validInputs('disabilityCap',{...d,years:10.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const r=planningResult('disabilityCap',input);assert.equal(new Set(r.charts.map(c=>c.id)).size,4);
  for(const width of [300,1000]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
