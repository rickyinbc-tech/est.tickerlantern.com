import test from 'node:test';
import assert from 'node:assert/strict';
import { fhsaExcessPlan, fhsaExcessRules, fhsaExcessBefore, FHSA_STATS } from '../src/planning-fhsa-excess-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('section 207.021 rate and CRA FHSA limits',()=>{
 assert.equal(fhsaExcessRules.rate,.01);assert.equal(fhsaExcessRules.annual,8000);
 assert.equal(fhsaExcessRules.carryMax,8000);assert.equal(fhsaExcessRules.lifetime,40000);
});

test('CRA worked examples are reproduced',()=>{
 const z={hxRoom:8000,hxUsed:0,hxPay:0,hxLump:0,hxLumpM:1,hxOut:0,hxOutM:0,hxKind:1,hxPay27:0,hxRate:30};
 const carolyn=fhsaExcessPlan({...z,hxLump:10000,hxLumpM:11});near(carolyn.tax26,40);near(carolyn.roomAfter27,6000);
 near(fhsaExcessPlan({...z,hxLump:13000,hxLumpM:5}).roomAfter27,3000);
 near(fhsaExcessPlan({...z,hxLump:10000,hxLumpM:5,hxOut:5000,hxOutM:6,hxKind:0}).roomAfter27,11000);
 const tony=fhsaExcessPlan({...z,hxLump:14000,hxLumpM:5,hxOut:7500,hxOutM:6,hxKind:0});near(tony.roomAfter27,9500);near(tony.reParticipation,1500);
 // Ridwan: excess in April removed in May; both months taxed.
 near(fhsaExcessPlan({...z,hxLump:9500,hxLumpM:4,hxOut:1500,hxOutM:5}).tax26,30);
 // Cole: CAD 3,000 excess in December.
 near(fhsaExcessPlan({...z,hxLump:11000,hxLumpM:12}).tax26,30);
});

test('worked cases match an independent 40-digit Decimal check',()=>{
 const d=defaults('fhsaExcess'),p=fhsaExcessPlan(d);
 assert.deepEqual(p.rows.map(r=>r.highest),[0,0,0,0,0,0,500,1000,1500,2000,500,1000,0,0,0,0,0,0,0,0,0,0,0,0]);
 near(p.tax26,65);near(p.tax27,0);assert.equal(p.months,6);near(p.room27,8000);near(p.roomAfter27,7000);near(p.lifetimeLeft27,23000);
 const none=fhsaExcessPlan(d,{hxOut:0,hxOutM:0});near(none.tax26,105);near(none.tax27,15);near(none.roomAfter27,5000);
 assert.deepEqual([7,8,9,10,11,12].map(m=>fhsaExcessPlan(d,{hxOut:none.rows[m-1].highest,hxOutM:m}).tax),[85,65,60,65,80,105]);
 const tx=fhsaExcessPlan(d,{hxKind:0,hxOut:5000});near(tx.tax,65);near(tx.incomeTax,1500);near(tx.reParticipation,3000);near(tx.roomAfter27,10000);near(tx.lifetimeLeft27,21000);
 // The withdrawal month is still taxed on its high point (unlike the RRSP month-end rule).
 near(fhsaExcessPlan(d,{hxOut:500,hxOutM:7,hxPay:0,hxLump:13500,hxLumpM:7}).tax26,5);
});

test('input rules and random boundary cases',()=>{
 const d=defaults('fhsaExcess');
 assert.ok(validInputs('fhsaExcess',d));
 assert.equal(validInputs('fhsaExcess',{...d,hxOutM:0}),false);
 assert.equal(validInputs('fhsaExcess',{...d,hxOut:2500}),false);
 assert.ok(validInputs('fhsaExcess',{...d,hxOut:2500,hxKind:0}));
 assert.ok(validInputs('fhsaExcess',{...d,hxOut:0,hxOutM:0}));
 assert.equal(validInputs('fhsaExcess',{...d,hxKind:.5}),false);
 for(let k=0;k<500;k++){
  const base={...d,hxRoom:500*(k%33),hxUsed:500*(k%9),hxPay:50*(k%30),hxLump:500*((k*3)%31),hxLumpM:1+k%12,hxPay27:50*((k*7)%25),hxRate:k%56,hxOut:0,hxOutM:0,hxKind:k%2};
  const n=fhsaExcessPlan(base),m=1+(k*5)%24,cap=base.hxKind?fhsaExcessBefore(base,m):base.hxUsed+500*(k%20);
  const out=Math.min(cap,500*(k%13)),q={...base,hxOut:out,hxOutM:out?m:0},p=fhsaExcessPlan(q);
  for(const r of p.rows){assert.ok(r.highest>=0);near(r.tax,r.highest*.01);assert.ok(r.highest>=Math.max(0,r.over)-1e-9);}
  // A withdrawal never raises the excess tax, and never changes months before it.
  assert.ok(p.tax<=n.tax+1e-9);p.rows.slice(0,(out?m:24)-1).forEach((r,j)=>near(r.highest,n.rows[j].highest));
  for(const v of [p.tax,p.tax26,p.tax27,p.highest,p.room27,p.incomeTax])assert.ok(Number.isFinite(v)&&v>=0);
  assert.ok(p.room27<=fhsaExcessRules.annual+fhsaExcessRules.carryMax+p.reParticipation+1e-9);
 }
});

test('official CRA 2024 FHSA statistics',()=>{
 const T=FHSA_STATS.total,B=FHSA_STATS.brackets;assert.equal(B.length,5);
 assert.deepEqual(T.slice(1),[1455280,1680490,1038540,6470717000]);
 assert.equal(T[2]-T[1],225210);assert.equal(Math.round(T[4]/T[3]),6231);
 assert.deepEqual(B.map(r=>Math.round(r[4]/r[3])),[5636,6671,7555,8102,8537]);
 assert.equal(B.reduce((s,r)=>s+r[1],0),T[1]);
});

test('guide is registered with four finite charts and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),g=planningGuides.find(x=>x.slug==='fhsa-over-contribution-1-percent-highest-monthly-excess-designated-withdrawal');
 assert.ok(g);assert.equal(g.planning,'fhsaExcess');for(const r of g.related)assert.ok(slugs.has(r),r);
 assert.equal(planningGuides.filter(x=>x.planning==='fhsaExcess').length,1);
 const d=defaults('fhsaExcess');
 for(const input of [d,{...d,hxOut:0,hxOutM:0},{...d,hxRoom:40000,hxOut:0,hxOutM:0},{...d,hxRoom:40000,hxKind:0},{...d,hxKind:0,hxOut:5000,hxOutM:24},{...d,hxPay:0,hxLump:0,hxOut:0,hxOutM:0},{...d,hxUsed:40000,hxOut:0,hxOutM:0}]){
  const res=planningResult('fhsaExcess',input);assert.equal(res.charts.length,4);
  for(const c of res.charts){const vals=c.rows?c.rows.flatMap(r=>r.values??[r.value]):c.series.flatMap(s=>s.rows.map(r=>r.value));assert.ok(vals.length&&vals.every(Number.isFinite),c.id);}
  for(const [,v] of res.metrics)assert.ok(Number.isFinite(v));
 }
});
