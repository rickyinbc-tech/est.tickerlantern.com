import test from 'node:test';
import assert from 'node:assert/strict';
import { rrspExcessPlan, rrspExcessRules, rrspExcessPaidIn, RRSP_STATS } from '../src/planning-rrsp-excess-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('section 204.2 cushion, 1% month-end rate and CRA dollar limits',()=>{
 assert.equal(rrspExcessRules.rate,.01);assert.equal(rrspExcessRules.cushion,2000);
 assert.equal(rrspExcessRules.limit2026,33810);assert.equal(rrspExcessRules.limit2027,35390);
});

test('worked cases match an independent 40-digit Decimal check',()=>{
 const d=defaults('rrspExcess'),p=rrspExcessPlan(d);
 assert.deepEqual(p.rows.map(r=>r.excess),[0,0,0,0,0,0,0,1000,2000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
 near(p.tax26,30);near(p.tax27,0);assert.equal(p.months,2);near(p.overEnd,-1000);
 const none=rrspExcessPlan(d,{rxOut:0,rxOutM:0});near(none.tax26,150);near(none.tax27,50);
 assert.deepEqual(none.rows.slice(12).map(r=>r.excess),[0,0,0,0,0,0,0,0,500,1000,1500,2000]);
 // A withdrawal before the end of the month the excess appears: no month-end excess at all.
 near(rrspExcessPlan(d,{rxOutM:8}).tax,0);
 // CRA default months: payroll after February and the lump sum in March, withdrawal in December.
 const cra=rrspExcessPlan(d,{},true);near(cra.tax,450);assert.equal(cra.months,9);
 // No cushion for someone who had not turned 18 before the year.
 near(rrspExcessPlan(d,{rxAdult:0,rxOut:0,rxOutM:0}).tax26,280);
 // Carried-in undeducted contributions count against the limit.
 near(rrspExcessPlan(d,{rxCarry:3000,rxOut:0,rxOutM:0}).tax26,360);
});

test('input rules and random boundary cases',()=>{
 const d=defaults('rrspExcess');
 assert.ok(validInputs('rrspExcess',d));
 assert.equal(validInputs('rrspExcess',{...d,rxOutM:0}),false);
 assert.equal(validInputs('rrspExcess',{...d,rxOut:12000,rxOutM:1}),false);
 assert.ok(validInputs('rrspExcess',{...d,rxOut:0,rxOutM:0}));
 assert.equal(validInputs('rrspExcess',{...d,rxAdult:.5}),false);
 for(let k=0;k<500;k++){
  const base={...d,rxLimit:500*(k%40),rxCarry:500*(k%7),rxPay:100*(k%25),rxLump:500*((k*3)%30),rxLumpM:1+k%12,rxNew:500*(k%19),rxPay27:100*((k*7)%20),rxAdult:k%4?1:0,rxOut:0,rxOutM:0};
  const m=1+(k*5)%24,out=Math.min(rrspExcessPaidIn(base,m),500*(k%16)),q={...base,rxOut:out,rxOutM:out?m:0};
  const p=rrspExcessPlan(q),c=rrspExcessPlan(q,{},true),n=rrspExcessPlan(base);
  for(const r of p.rows){assert.ok(r.excess>=0);near(r.tax,r.excess*.01);near(r.excess,Math.max(0,r.over-p.cushion));}
  // CRA's default placement moves deposits earlier and withdrawals later, so it never lowers a month-end excess.
  p.rows.forEach((r,j)=>assert.ok(c.rows[j].excess>=r.excess-1e-9));
  // A withdrawal never raises the tax.
  assert.ok(p.tax<=n.tax+1e-9);
  for(const v of [p.tax,p.tax26,p.tax27,p.highest,c.tax])assert.ok(Number.isFinite(v)&&v>=0);
 }
});

test('official Statistics Canada series',()=>{
 const S=RRSP_STATS.rows;assert.equal(S.length,24);assert.deepEqual([S[0][0],S.at(-1)[0]],[2000,2023]);
 assert.deepEqual(S.at(-1),[2023,29965100,6350070,4000]);
 assert.deepEqual([2000,2010,2019,2023].map(y=>Math.round(200000/S.find(r=>r[0]===y)[3])),[74,72,61,50]);
 assert.equal(Math.round(100*S.at(-1)[2]/S.at(-1)[1]),21);
});

test('guide is registered with four finite charts and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),g=planningGuides.find(x=>x.slug==='rrsp-over-contribution-2000-cushion-1-percent-month-end-tax-t1-ovp');
 assert.ok(g);assert.equal(g.planning,'rrspExcess');for(const r of g.related)assert.ok(slugs.has(r),r);
 assert.equal(planningGuides.filter(x=>x.planning==='rrspExcess').length,1);
 const d=defaults('rrspExcess');
 for(const input of [d,{...d,rxOut:0,rxOutM:0},{...d,rxLimit:100000},{...d,rxOutM:24},{...d,rxPay:0,rxLump:0,rxOut:0,rxOutM:0}]){
  const res=planningResult('rrspExcess',input);assert.equal(res.charts.length,4);
  for(const c of res.charts){const vals=c.rows?c.rows.flatMap(r=>r.values??[r.value]):c.series.flatMap(s=>s.rows.map(r=>r.value));assert.ok(vals.length&&vals.every(Number.isFinite),c.id);}
  for(const [,v] of res.metrics)assert.ok(Number.isFinite(v));
 }
});
