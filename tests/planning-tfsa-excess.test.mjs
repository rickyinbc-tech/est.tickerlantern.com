import test from 'node:test';
import assert from 'node:assert/strict';
import { tfsaExcessPlan, tfsaExcessRules, TFSA_STATS } from '../src/planning-tfsa-excess-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('section 207.01 dollar limits and the 1% monthly rate',()=>{
 assert.equal(tfsaExcessRules.rate,.01);
 assert.equal(tfsaExcessRules.limits.reduce((s,[,v])=>s+v,0),tfsaExcessRules.cumulative2026);
 assert.equal(tfsaExcessRules.limits.find(([y])=>y===2026)[1],tfsaExcessRules.limit2026);
});

test('worked cases match an independent 40-digit Decimal check',()=>{
 const d=defaults('tfsaExcess'),p=tfsaExcessPlan(d);
 assert.deepEqual(p.rows.map(r=>r.high),[0,0,0,0,0,0,5000,5000,5000,5000,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
 near(p.tax26,200);near(p.tax27,0);assert.equal(p.months,4);near(p.room27,12000);near(p.balance,2000);
 near(tfsaExcessPlan(d,{tfxFix:7}).tax,50);near(tfsaExcessPlan(d,{tfxFix:0}).tax,300);
 // Misread room: CAD 17,000 deposited against CAD 7,000; 1 January 2027 absorbs only CAD 7,000.
 const mis=tfsaExcessPlan(d,{tfxFirst:17000,tfxOut:0,tfxBack:0,tfxFix:0});near(mis.tax26,1200);near(mis.tax27,360);near(mis.left,3000);near(mis.room27raw,-3000);
 near(tfsaExcessPlan(d,{tfxFirst:17000,tfxOut:0,tfxBack:0,tfxFix:3}).tax,300);
 // CRA RC4466 Gilles pattern: a withdrawal larger than the excess does not shelter a later deposit in the same year.
 const g=tfsaExcessPlan(d,{tfxFirst:9000,tfxOut:3700,tfxOutM:5,tfxBack:1000,tfxBackM:7,tfxFix:0});
 assert.deepEqual(g.rows.slice(0,8).map(r=>r.high),[2000,2000,2000,2000,2000,0,1000,1000]);near(g.tax26,160);near(g.room27,7700);
 // A withdrawal and re-deposit in the same month: the month is taxed on the peak.
 near(tfsaExcessPlan(d,{tfxOutM:7,tfxBackM:7,tfxFix:7}).tax,50);
});

test('removing the excess loses no room, input rules and random boundary cases',()=>{
 const d=defaults('tfsaExcess');
 assert.ok(validInputs('tfsaExcess',d));
 assert.equal(validInputs('tfsaExcess',{...d,tfxFix:5}),false);
 assert.equal(validInputs('tfsaExcess',{...d,tfxOut:8000}),false);
 assert.equal(validInputs('tfsaExcess',{...d,tfxBackM:2}),false);
 assert.ok(validInputs('tfsaExcess',{...d,tfxFix:0}));
 assert.equal(validInputs('tfsaExcess',{...d,tfxFix:10.5}),false);
 for(let k=0;k<400;k++){
  const room=500*(k%30),first=500*((k*7)%40),out=Math.min(first,500*((k*3)%20)),outM=1+k%12,backM=outM+(k%(13-outM)),fix=k%5?backM+(k%(25-backM)):0;
  const q=tfsaExcessPlan(d,{tfxRoom:room,tfxFirst:first,tfxOut:out,tfxOutM:outM,tfxBack:500*(k%15),tfxBackM:backM,tfxFix:fix,tfxNext:500*(k%17)});
  for(const r of q.rows){assert.ok(r.high>=0&&r.end>=0&&r.end<=r.high+1e-9);near(r.tax,r.high*.01);}
  if(fix)assert.equal(q.rows[fix-1].end,0);
  assert.ok(q.rows[12].high<=Math.max(0,-q.room27raw)+1e-9);
  // Net deposits plus 1 January 2027 room are the same whether the excess is removed or left, when that room is not negative.
  const left=tfsaExcessPlan(d,{tfxRoom:room,tfxFirst:first,tfxOut:out,tfxOutM:outM,tfxBack:500*(k%15),tfxBackM:backM,tfxFix:0,tfxNext:500*(k%17)});
  if(left.room27raw>=0&&fix&&fix<=12)near(q.balance+q.room27raw,left.balance+left.room27raw);
  for(const v of [q.tax,q.tax26,q.tax27,q.highest,q.room27])assert.ok(Number.isFinite(v)&&v>=-1e-9);
 }
});

test('official CRA statistics reconcile',()=>{
 const sum=i=>TFSA_STATS.ages.reduce((s,r)=>s+r[i],0);
 // CRA rounds each cell, so age groups may differ from the published total by a few tens.
 for(const [i,t] of [[1,TFSA_STATS.holders],[2,TFSA_STATS.withdrew],[3,TFSA_STATS.maximized]])assert.ok(Math.abs(sum(i)-t)<=70,`${sum(i)} vs ${t}`);
 assert.deepEqual(['25 to 29','40 to 44','60 to 64','80 and over'].map(a=>{const r=TFSA_STATS.ages.find(x=>x[0]===a);return Math.round(100*r[2]/r[1]);}),[34,32,28,21]);
});

test('guide is registered with four finite charts and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),g=planningGuides.find(x=>x.slug==='tfsa-over-contribution-1-percent-monthly-tax-highest-excess-withdrawal');
 assert.ok(g);assert.equal(g.planning,'tfsaExcess');for(const r of g.related)assert.ok(slugs.has(r),r);
 assert.equal(planningGuides.filter(x=>x.planning==='tfsaExcess').length,1);
 for(const input of [defaults('tfsaExcess'),{...defaults('tfsaExcess'),tfxFirst:17000,tfxOut:0,tfxBack:0,tfxFix:0},{...defaults('tfsaExcess'),tfxRoom:20000},{...defaults('tfsaExcess'),tfxFix:24}]){
  const res=planningResult('tfsaExcess',input);assert.equal(res.charts.length,4);
  for(const c of res.charts){const vals=c.rows?c.rows.flatMap(r=>r.values??[r.value]):c.series.flatMap(s=>s.rows.map(r=>r.value));assert.ok(vals.length&&vals.every(Number.isFinite),c.id);}
  for(const [,v] of res.metrics)assert.ok(Number.isFinite(v));
 }
});
