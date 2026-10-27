import test from 'node:test';
import assert from 'node:assert/strict';
import { llpPlan, llpRequiredSeries, llpRules, llpStartIndex } from '../src/planning-llp-repay-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('CRA limits and repayment-start rule, including the Joseph and Sarah examples',()=>{
 assert.equal(llpRules.annualLimit,10000);assert.equal(llpRules.totalLimit,20000);assert.equal(llpRules.years,10);
 assert.deepEqual([1,2,3,4,5].map(llpStartIndex),[2,3,4,5,5]);
 // Joseph: withdraws 2024, studies 2024-2025, repays from 2027. Sarah: first withdrawal 2022, still studying, repays from 2027.
 assert.equal(2024+llpStartIndex(2),2027);assert.equal(2022+llpStartIndex(5),2027);
});

test('CRA worked examples: Betty, Josée and Alexander',()=>{
 near(llpRequiredSeries(7500,[750])[0].required,750);
 const j=llpRequiredSeries(10000,[1000,700,1000]);near(j[1].required,1000);near(j[1].included,300);near(j[2].required,1000);
 assert.deepEqual(llpRequiredSeries(8500,[850,850,850,4000,325]).map(r=>r.required),[850,850,850,850,325]);
});

test('default and worked cases match an independent 40-digit Decimal check',()=>{
 const d=defaults('llpRepay'),p=llpPlan(d);
 assert.equal(p.total,20000);assert.equal(p.firstRepayYear,2029);assert.equal(p.lastRepayYear,2038);near(p.firstRequired,2000);
 assert.equal(p.rows.length,10);for(const r of p.rows)near(r.required,2000);
 near(p.included,0);near(p.kept,36815.0547,1e-8);near(p.repaid,25155.7851,1e-8);near(p.lostGrowth,11659.2696,1e-8);
 const s=llpPlan(d,{llpPaid:70});near(s.included,6000);near(s.tax,1800);near(s.gap,19206.0051,1e-8);near(s.lostGrowth,13206.0051,1e-8);
 const n=llpPlan(d,{llpPaid:0});near(n.included,20000);near(n.tax,6000);near(n.repaid,0);
 const one=llpPlan(d,{llpW2:0,llpStudy:1});assert.equal(one.firstRepayYear,2028);assert.equal(one.lastRepayYear,2037);near(one.firstRequired,1000);near(one.lostGrowth,5380.6707,1e-8);
 assert.equal(llpPlan(d,{llpStudy:5}).firstRepayYear,2031);
 near(llpPlan(d,{llpReturn:0}).lostGrowth,0);
});

test('input rules and boundary cases',()=>{
 const d=defaults('llpRepay');
 assert.ok(validInputs('llpRepay',d));
 assert.equal(validInputs('llpRepay',{...d,llpStudy:1}),false);
 assert.ok(validInputs('llpRepay',{...d,llpStudy:1,llpW2:0}));
 assert.equal(validInputs('llpRepay',{...d,llpW1:10500}),false);
 for(let k=0;k<300;k++){
  const q=llpPlan(d,{llpW1:500+(k*7919)%9501,llpW2:(k*104729)%10001,llpStudy:2+k%4,llpPaid:(k*13)%101,llpTax:k%56,llpReturn:(k%41)/4,llpFirst:2026+k%10});
  assert.ok(q.total<=20000);assert.equal(q.rows.length,10);
  near(q.paid+q.included,q.total,1e-9);
  for(const v of [q.included,q.tax,q.kept,q.repaid,q.gap])assert.ok(Number.isFinite(v)&&v>=-1e-9);
  assert.ok(q.lostGrowth>=-1e-6);
 }
});

test('guide is registered with four finite charts and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),g=planningGuides.find(x=>x.slug==='rrsp-lifelong-learning-plan-withdrawal-repayment-start-shortfall');
 assert.ok(g);assert.equal(g.planning,'llpRepay');for(const r of g.related)assert.ok(slugs.has(r),r);
 assert.equal(planningGuides.filter(x=>x.planning==='llpRepay').length,1);
 for(const input of [defaults('llpRepay'),{...defaults('llpRepay'),llpPaid:40,llpStudy:4}]){
  const res=planningResult('llpRepay',input);assert.equal(res.charts.length,4);
  for(const c of res.charts){const vals=c.rows?c.rows.map(r=>r.value):c.series.flatMap(s=>s.rows.map(r=>r.value));assert.ok(vals.length&&vals.every(Number.isFinite),c.id);}
 }
 assert.equal(planningResult('llpRepay',defaults('llpRepay')).charts[1].series.length,2);
 assert.equal(planningResult('llpRepay',{...defaults('llpRepay'),llpPaid:50}).charts[1].series.length,3);
});
