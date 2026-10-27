import test from 'node:test';
import assert from 'node:assert/strict';
import { spouseLoanPlan, breakEvenRate, prescribedQuarters, holding } from '../src/planning-spouse-loan-models.js';
import { defaults, planningResult } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('CRA prescribed rates and the rounding rule',()=>{
 assert.equal(prescribedQuarters.length,21);assert.equal(prescribedQuarters.at(-1)[1],3);
 assert.equal(Math.max(...prescribedQuarters.map(q=>q[1])),6);
 // Rate is the treasury bill yield rounded up, except where the auction average differs from the month-end reading.
 const off=prescribedQuarters.filter(q=>Math.ceil(q[2]-1e-9)!==q[1]).map(q=>q[0]);
 assert.deepEqual(off,['2024 Q2','2025 Q2']);
});

test('defaults match an independent 40-digit Decimal check',()=>{
 const p=spouseLoanPlan(defaults('spouseLoan'));
 near(p.interest,3000);near(p.own.after,183882.73845755515,1e-12);near(p.loan.after,192056.05133080039,1e-12);
 near(p.mix,206335.98172455096,1e-12);near(p.diff,8173.3128732452357,1e-10);
 near(breakEvenRate(defaults('spouseLoan')),0.04405745,1e-6);
});

test('no tax and no interest leave a plain compounding balance',()=>{
 const h=holding({start:1000,m:0,r:.05,d:.02,years:10});near(h.after,1000*1.05**10);
 const zero=spouseLoanPlan({...defaults('spouseLoan'),splHigh:30,splLow:30,splRate:0});near(zero.diff,0,1e-9);
});

test('result renders four charts',()=>{
 const r=planningResult('spouseLoan',defaults('spouseLoan'));assert.equal(r.charts.length,4);
 assert.equal(r.charts[3].rows.length,7);
 assert.ok(planningGuides.some(g=>g.slug==='prescribed-rate-spousal-loan-or-tfsa-gift-fund-income-attribution'));
});
