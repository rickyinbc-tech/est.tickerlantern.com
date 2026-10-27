import test from 'node:test';
import assert from 'node:assert/strict';
import { septemberCpi, returnPath, withdrawPlan, cpiIndexedRows } from '../src/planning-withdraw-sequence-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);
const slug='balanced-fund-withdrawals-crash-first-reverse-dollar-cost-averaging-cash-reserve';

test('September CPI values match the Statistics Canada series retrieved 27 October 2026',()=>{
 assert.equal(Object.keys(septemberCpi).length,21);
 assert.equal(septemberCpi[2006],109.2);assert.equal(septemberCpi[2020],136.9);assert.equal(septemberCpi[2022],152.7);assert.equal(septemberCpi[2025],164.9);assert.equal(septemberCpi[2026],170.0);
 const last=cpiIndexedRows(1875).at(-1);near(last.indexed,2918.956043956044,1e-12);near(last.fixedReal,1204.411764705882,1e-12);
});

test('default withdrawal paths match an independent 40-digit Decimal check',()=>{
 const d=defaults('withdrawSequence'),z={wsqReserve:0};
 near(withdrawPlan(d,z,0).end.total,227419.5349504481,1e-11);
 near(withdrawPlan(d,z,1).end.total,192051.5358523698,1e-11);
 near(withdrawPlan(d,z,29).end.total,211711.7507477310,1e-11);
 near(withdrawPlan(d,{},1).end.total,210899.7598335930,1e-11);
 near(withdrawPlan(d,z,1).unitsSoldFirst2-withdrawPlan(d,z,0).unitsSoldFirst2,818.3357395376036,1e-10);
});

test('same returns in any order give the same value without withdrawals',()=>{
 const d=defaults('withdrawSequence');
 for(const drop of [10,25,50]){
  const p=returnPath({...d,wsqDrop:drop},1);near((1+p[0])*(1+p[1]),1.05**2,1e-12);
  const vals=[0,1,5,29].map(c=>withdrawPlan(d,{wsqRate:0,wsqReserve:0,wsqDrop:drop},c).end.total);
  for(const v of vals)near(v,vals[0],1e-12);
 }
 // with withdrawals an early crash always ends lower than none
 for(const rate of [3,4,5])assert.ok(withdrawPlan(d,{wsqRate:rate,wsqReserve:0},1).end.total<withdrawPlan(d,{wsqRate:rate,wsqReserve:0},0).end.total);
});

test('reserve is unused without a fall, and depletion is recorded',()=>{
 const d=defaults('withdrawSequence'),p=withdrawPlan(d,{wsqReserve:1},0);
 near(p.end.cash,22500*1.03**30,1e-12);
 const q=withdrawPlan(d,{wsqReserve:0,wsqRate:5,wsqDrop:40},1);assert.equal(q.runOut,345);assert.equal(q.end.total,0);
 assert.equal(validInputs('withdrawSequence',{...d,wsqYears:3}),false);
});

test('guide is registered with four charts, finite metrics and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),g=planningGuides.find(x=>x.slug===slug);
 assert.ok(g);assert.equal(g.planning,'withdrawSequence');
 for(const r of g.related)assert.ok(slugs.has(r),r);
 for(const m of g.sections.flatMap(s=>[...s.html.matchAll(/href="\/research\/([^"]+)"/g)].map(x=>x[1])))assert.ok(slugs.has(m),m);
 const res=planningResult('withdrawSequence');assert.equal(res.charts.length,4);
 for(const [,v] of res.metrics)assert.ok(Number.isFinite(v));
});
