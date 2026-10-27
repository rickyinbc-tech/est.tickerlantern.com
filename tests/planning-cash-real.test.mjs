import test from 'node:test';
import assert from 'node:assert/strict';
import { cashRealStats, keptShare, growth, cashTbill, cashCpi } from '../src/planning-cash-real-models.js';
import { tbillMonthly } from '../src/planning-trend-rule-models.js';
import { cpiMonthly } from '../src/planning-record-high-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('data extends the earlier arrays without changing them',()=>{
 assert.equal(cashTbill.length,849);assert.equal(cashCpi.length,849);
 assert.deepEqual(cashTbill.slice(0,813),tbillMonthly);assert.deepEqual(cashCpi.slice(0,813),cpiMonthly);
 assert.equal(cashTbill.at(-1),2.387);assert.equal(cashCpi.at(-1),170);
});

test('defaults match an independent 40-digit Decimal check',()=>{
 const d=defaults('cashReal'),s=cashRealStats(d);
 assert.equal(s.months,848);
 near(d.crAmount*s.tfsa.nominal,359834.914638,1e-9);near(d.crAmount*s.tfsa.real,30056.798752,1e-9);
 near(d.crAmount*s.taxed.nominal,86076.093422,1e-9);near(d.crAmount*s.taxed.real,7189.885451,1e-9);
 near(s.keptT.share,537/729);near(s.keptM.share,300/729);
 near(10000*cashRealStats({...d,crMarg:30}).taxed.real,10284.404112,1e-9);
 const sp=cashRealStats({...d,crSpread:1});near(10000*sp.tfsa.real,15512.562988,1e-9);near(10000*sp.taxed.real,4831.551242,1e-9);near(sp.keptT.share,414/729);near(sp.keptM.share,175/729);
 const late=cashRealStats({...d,crFrom:2009});near(10000*late.tfsa.real,8596.165153,1e-9);assert.equal(late.keptT.share,0);assert.equal(late.keptT.count,93);
 near(keptShare(d,40,30).share,209/489);near(keptShare(d,50,30).share,80/489);near(keptShare(d,0,1).share,591/837);
});

test('tax and a lower savings rate only reduce the result',()=>{
 const a=growth(100,400,0,0),b=growth(100,400,.3,0),c=growth(100,400,0,.5);
 assert.ok(b.real<a.real&&c.real<a.real);near(a.nominal/a.real,cashCpi[400]/cashCpi[100]);
 assert.equal(growth(0,848,0,30).nominal,1);
});

test('result renders four charts and handles every input range',()=>{
 const r=planningResult('cashReal',defaults('cashReal'));
 assert.equal(r.charts.length,4);assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));
 assert.equal(r.charts[3].rows.length,5);assert.equal(r.charts[1].rows.length,8);assert.ok(r.charts[0].series[0].rows.length<=170);
 assert.ok(planningGuides.some(g=>g.slug==='cash-treasury-bills-inflation-tax-1956-2026-purchasing-power-tfsa'));
 const late=planningResult('cashReal',{...defaults('cashReal'),crFrom:2025,crYears:30});
 assert.equal(late.charts.length,4);assert.ok(late.charts[3].rows[0].values.slice(1).every(v=>v===null));
 assert.equal(validInputs('cashReal',{...defaults('cashReal'),crFrom:2026}),false);
});
