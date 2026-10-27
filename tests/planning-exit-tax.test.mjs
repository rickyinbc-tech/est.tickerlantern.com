import test from 'node:test';
import assert from 'node:assert/strict';
import { tbillYearSums, cashRows, exitCase } from '../src/planning-exit-tax-models.js';
import { defaults, planningResult } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);
const slug='sell-taxable-fund-before-feared-crash-capital-gains-tax-break-even-fall';

test('treasury bill and CPI rows match the series retrieved 27 October 2026',()=>{
 assert.equal(Object.keys(tbillYearSums).length,20);
 const rows=cashRows(.4);assert.equal(rows.length,20);
 near(rows.find(r=>r.x===2025).yield,.025525,1e-12);near(rows.find(r=>r.x===2021).yield,.0012166666666666667,1e-12);
 assert.equal(rows.filter(r=>r.realAfterTax<0).length,17);
 near(rows.find(r=>r.x===2022).realAfterTax,-.05075,2e-3);
});

test('default sale matches an independent Decimal check',()=>{
 const d=defaults('exitTaxCrash'),x=exitCase(d);
 assert.equal(x.tax,8000);near(x.atBuy,93324.8,1e-12);near(x.sameUnits,.066752,1e-12);
 near(x.fallNeeded,.013048341972062868,1e-10);near(x.diff,23201.87056981642,1e-10);
 near(exitCase(d,{tfsa:true}).fallNeeded,-.024,1e-12);
 // at the break-even buy-back level the two positions are equal
 near(exitCase(d,{back:(x.even-1)*100}).diff,0,1e-9);
 near(exitCase(d,{back:0}).diff,-1619.38,1e-5);near(exitCase(d,{back:10}).diff,-14030.01,1e-6);
});

test('edge cases: no gain, loss position, short horizon, high rate',()=>{
 const d=defaults('exitTaxCrash');
 assert.equal(exitCase({...d,etxCost:100000}).tax,0);
 const loss=exitCase({...d,etxCost:150000});assert.equal(loss.tax,0);assert.ok(Number.isFinite(loss.even));
 const short=exitCase({...d,etxYears:1,etxWait:24});assert.equal(short.H,2);
 const hi=exitCase({...d,etxMarg:50,etxCost:20000});assert.equal(hi.tax,20000);near(hi.sameUnits,.1904,1e-12);
});

test('guide renders four charts with the default text figures',()=>{
 const g=planningGuides.find(x=>x.slug===slug);assert.ok(g);
 const r=planningResult('exitTaxCrash',defaults('exitTaxCrash'));
 assert.equal(r.charts.length,4);assert.equal(r.metrics.length,6);
 const last=r.charts[3].rows[4].values;near(last.at(-1),.147904,1e-4);near(last[2],.0428,2e-3);
 for(const s of ['CAD 8,000','CAD 93,325','6.7%','1.3%','CAD 23,202','CAD 1,619','CAD 14,030','14.8%','19.0%','17 of those 20'])assert.ok(JSON.stringify(g).includes(s),s);
});
