import test from 'node:test';
import assert from 'node:assert/strict';
import { ctcPlan, ctcRules, CTC_STATS } from '../src/planning-ctc-claim-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('section 122.91 limits, Schedule 11 split and CRA thresholds',()=>{
 assert.equal(ctcRules.perYear,250);assert.equal(ctcRules.lifetime,5000);assert.equal(ctcRules.maxBy2026,7*250);assert.equal(ctcRules.fedRate,.14);
 assert.deepEqual(ctcRules.thresholds.map(t=>[t.year,t.work,t.net]),[[2025,11821,173205],[2026,12058,177882]]);
 const d=defaults('ctcClaim'),one=ctcPlan(d,{ctcFee:1200,ctcYears:1});
 near(one.ctc,600);near(one.tuitionCredit,84);near(one.federal,684);near(one.limitAfter,1400);
 // Up to twice the limit, the two credits return 57% of fees; above it only 14% of each extra dollar.
 const at=ctcPlan(d,{ctcFee:3500,ctcYears:1}),above=ctcPlan(d,{ctcFee:4500,ctcYears:1});
 near(at.federal/3500,.57);near(above.federal-at.federal,140);
});

test('worked cases match an independent 40-digit Decimal check',()=>{
 const d=defaults('ctcClaim'),p=ctcPlan(d);
 assert.deepEqual(p.study.map(r=>r.claim),[1500,500]);
 near(p.ctc,2000);near(p.tuitionCredit,560);near(p.federal,2560);near(p.without,840);near(p.gain,1720);near(p.net,3440);near(p.limitAfter,250);assert.equal(p.afterYear,2028);
 const w=ctcPlan(d,{ctcDelay:4});near(w.ctc,3000);near(w.tuitionCredit,420);near(w.federal,3420);near(w.federal-p.federal,860);
 const g=ctcPlan(d,{ctcDelay:4,ctcGrowth:3});near(g.fees,6854.3487,1e-8);near(g.ctc,3000);near(g.federal,3539.6088,1e-8);
 assert.deepEqual(Array.from({length:6},(_,k)=>ctcPlan(d,{ctcDelay:k}).ctc),[2000,2250,2500,2750,3000,3000]);
 const old=ctcPlan(d,{ctcAge:65});assert.deepEqual(old.study.map(r=>r.claim),[1500,0]);near(old.federal,2130);assert.equal(old.limitAfter,0);
 const none=ctcPlan(d,{ctcLimit:0,ctcAccrue:0});near(none.ctc,0);near(none.federal,840);
});

test('lifetime cap, input rules and random boundary cases',()=>{
 const d=defaults('ctcClaim');
 // The CAD 5,000 − prior claims cap binds before the CAD 250 does.
 const cap=ctcPlan(d,{ctcLimit:4800,ctcFee:20000,ctcYears:2});assert.deepEqual(cap.study.map(r=>r.claim),[4800,200]);near(cap.used,5000);
 assert.ok(validInputs('ctcClaim',d));
 assert.equal(validInputs('ctcClaim',{...d,ctcUsed:250}),false);
 assert.ok(validInputs('ctcClaim',{...d,ctcLimit:1250,ctcUsed:500}));
 assert.equal(validInputs('ctcClaim',{...d,ctcYears:2.5}),false);
 for(let k=0;k<300;k++){
  const q=ctcPlan(d,{ctcLimit:250*(k%8),ctcUsed:0,ctcAge:26+(k*7)%40,ctcFee:(k*1237)%20001,ctcDelay:k%15,ctcYears:1+k%6,ctcAccrue:k%3?1:0,ctcGrowth:(k%17)/2});
  near(q.ctc+q.tuitionCredit/ctcRules.fedRate,q.fees,1e-9);
  assert.ok(q.used<=ctcRules.lifetime+1e-9);
  for(const r of q.rows){assert.ok(r.claim<=r.limit+1e-9&&r.claim<=r.fee/2+1e-9&&r.limit>=0);if(r.age>=66)assert.equal(r.limit,0);}
  for(const v of [q.ctc,q.tuitionCredit,q.federal,q.net,q.limitAfter])assert.ok(Number.isFinite(v)&&v>=-1e-9);
 }
});

test('official CRA statistics reconcile',()=>{
 const n=CTC_STATS.bands.reduce((a,b)=>a+b[1],0),t=CTC_STATS.bands.reduce((a,b)=>a+b[2],0);
 assert.equal(n,643900);assert.ok(Math.abs(t-249406)<=5);
 assert.deepEqual(CTC_STATS.years.map(y=>Math.round(y.thousands*1000/y.claims)),[340,360,387]);
});

test('guide is registered with four finite charts and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),g=planningGuides.find(x=>x.slug==='canada-training-credit-limit-refundable-tuition-half');
 assert.ok(g);assert.equal(g.planning,'ctcClaim');for(const r of g.related)assert.ok(slugs.has(r),r);
 assert.equal(planningGuides.filter(x=>x.planning==='ctcClaim').length,1);
 for(const input of [defaults('ctcClaim'),{...defaults('ctcClaim'),ctcAge:64,ctcYears:4,ctcGrowth:3},{...defaults('ctcClaim'),ctcFee:0}]){
  const res=planningResult('ctcClaim',input);assert.equal(res.charts.length,4);
  for(const c of res.charts){const vals=c.rows?c.rows.flatMap(r=>r.values??[r.value]):c.series.flatMap(s=>s.rows.map(r=>r.value));assert.ok(vals.length&&vals.every(Number.isFinite),c.id);}
 }
});
