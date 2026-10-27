import test from 'node:test';
import assert from 'node:assert/strict';
import { saverPath, lumpValue, phasedValue, tsxMonthlyStats, startMonths } from '../src/planning-tsx-monthly-models.js';
import { monthLabel } from '../src/planning-record-high-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('defaults match an independent 40-digit Decimal check',()=>{
 const d=defaults('tsxMonthly'),s=tsxMonthlyStats(d);
 assert.equal(s.starts.length,693);near(s.medMultiple,1.4770209231,1e-9);
 assert.equal(monthLabel(s.worst.s),'1964-12');near(s.worst.multiple,0.9627436239,1e-9);
 near(s.belowEnd,3/693);near(s.belowReal,78/693);assert.equal(s.longest.longest,35);
 assert.equal(s.lumpBelow,0);near(s.lumpWins,435/693);near(s.medGap,0.0299002714,1e-8);
 const five=tsxMonthlyStats({...d,tmYears:5});assert.equal(five.starts.length,753);
 near(five.belowEnd,52/753);near(five.belowReal,153/753);near(five.lumpBelow,36/753);assert.equal(monthLabel(five.worst.s),'2004-02');near(five.worst.multiple,0.7762295825,1e-9);
 const late=tsxMonthlyStats({...d,tmFrom:1991});assert.equal(late.starts.length,273);near(late.medMultiple,1.3878661469,1e-9);near(late.lumpWins,184/273);
});

test('paths are internally consistent',()=>{
 const d=defaults('tsxMonthly'),p=saverPath(d,0);
 assert.equal(p.rows.length,121);near(p.paid,60000);near(p.rows[0].value,500);
 near(phasedValue({...d,tmCash:0},0,1),lumpValue(d,0));
 const flat={...d,tmYield:0,tmFee:0};near(lumpValue(flat,0,1),60000*568.14/525.63,1e-12);
 assert.ok(startMonths({...d,tmYears:30,tmFrom:2000}).length===0);
});

test('result renders four charts, rejects a phase-in longer than the holding period and handles empty settings',()=>{
 const r=planningResult('tsxMonthly',defaults('tsxMonthly'));
 assert.equal(r.charts.length,4);assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));
 assert.equal(r.charts[2].rows.length,6);assert.equal(r.charts[3].rows.length,4);
 assert.ok(planningGuides.some(g=>g.slug==='monthly-saving-every-sp-tsx-start-month-1956-2023-below-contributions-lump-sum-phase-in'));
 assert.equal(validInputs('tsxMonthly',{...defaults('tsxMonthly'),tmYears:1,tmPhase:13}),false);
 const empty=planningResult('tsxMonthly',{...defaults('tsxMonthly'),tmFrom:2022,tmYears:5});
 assert.equal(empty.charts.length,0);
});
