import test from 'node:test';
import assert from 'node:assert/strict';
import { ccbAnnual, ccdLimits, ccdValue, ccbRules } from '../src/planning-ccd-models.js';
import { defaults, planningResult } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);
const base=defaults('ccdDeduction');

test('worked cases match an independent 40-digit Decimal check',()=>{
 const d=ccdValue(base);near(d.deduction,12000);near(d.taxSaved,2346);near(d.ccbBefore,8040.279);near(d.ccbGain,684);near(d.total,3030);assert.equal(d.binding,'expenses paid');
 const low=ccdValue(base,{ccdLowIncome:15000});near(low.deduction,10000);near(low.taxSaved,0);near(low.ccbGain,1181.716);assert.equal(low.binding,'two-thirds of earned income');
 near(ccdValue(base,{ccdHighIncome:20000}).ccbGain,1588.005);
 const two=ccdValue(base,{ccdYoung:2,ccdSchool:0,ccdUnder6:2,ccdPaid:20000,ccdLowIncome:45000,ccdHighIncome:60000});near(two.deduction,16000);near(two.ccbBefore,9029.279);near(two.ccbGain,912);near(two.total,4040);assert.equal(two.binding,'per-child limits');
 const school=ccdValue(base,{ccdYoung:0,ccdSchool:2,ccdUnder6:0,ccdPaid:14000,ccdLowIncome:60000,ccdHighIncome:90000});near(school.deduction,10000);near(school.ccbGain,570);near(school.taxSaved,1955);
});

test('CCB published reduction bases equal the first-band rate times the band width',()=>{
 for(let n=1;n<=4;n++)assert.ok(Math.abs(ccbRules.base[n]-ccbRules.r1[n]*(ccbRules.t2-ccbRules.t1))<1);
 near(ccbAnnual(38237,1,0),8157);near(ccbAnnual(0,0,2),13766);assert.equal(ccbAnnual(1e6,1,1),0);assert.equal(ccbAnnual(50000,0,0),0);
});

test('deduction never exceeds any limit and value never falls as the deduction grows',()=>{
 for(const young of [0,1,2])for(const school of [0,1,2])for(let e=0;e<=60000;e+=2500)for(let p=0;p<=30000;p+=1500){
  const l=ccdLimits(young,school,p,e);assert.ok(l.deduction<=p&&l.deduction<=l.childLimit&&l.deduction<=l.earnedLimit+1e-9&&l.deduction>=0);
 }
 for(const high of [0,40000,80000,120000,200000]){let prev=-1;for(let p=0;p<=30000;p+=250){const r=ccdValue(base,{ccdPaid:p,ccdHighIncome:high});assert.ok(r.ccbGain>=-1e-9&&r.total>=prev-1e-9);prev=r.total;}}
 near(ccdValue(base,{ccdUnder6:5}).u6,1);
});

test('result renders five finite charts and the guide is registered',()=>{
 const r=planningResult('ccdDeduction',base);
 assert.equal(r.charts.length,5);assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));near(r.metrics[7][1],.2525);
 for(const c of r.charts){for(const s of c.series??[])for(const row of s.rows)assert.ok(Number.isFinite(row.value));for(const row of c.rows??[])for(const v of row.values??[row.value])assert.ok(Number.isFinite(v));}
 assert.ok(planningGuides.some(g=>g.slug==='child-care-expense-deduction-line-21400-lower-income-spouse-ccb-increase'));
});
