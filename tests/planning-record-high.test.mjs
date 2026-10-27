import test from 'node:test';
import assert from 'node:assert/strict';
import { tsxClose, cpiMonthly, drawdowns, underwaterSpells, recordHighStats, monthLabel } from '../src/planning-record-high-models.js';
import { defaults, planningResult } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('index and CPI series cover January 1956 to September 2023',()=>{
 assert.equal(tsxClose.length,813);assert.equal(cpiMonthly.length,813);
 near(tsxClose[0],525.63);near(tsxClose.at(-1),19541.27);near(Math.max(...tsxClose),21890.16);
 assert.equal(monthLabel(812),'2023-09');near(cpiMonthly[0],14.2);near(cpiMonthly.at(-1),158.5);
});

test('defaults match an independent 40-digit Decimal check',()=>{
 const d=defaults('recordHigh'),s=recordHighStats(d);
 assert.equal(s.recordMonths,144);assert.equal(s.counted,801);assert.equal(s.rec.length,128);assert.equal(s.oth.length,613);
 near(s.medRec,0.1886093580,1e-9);near(s.medOth,0.3063105785,1e-9);near(s.lowerRec,.21875);near(s.lowerOth,0.091354,1e-5);near(s.cashRec,0.742188,1e-5);
 const one=recordHighStats({...d,rhYears:1});near(one.medRec,0.0116527835,1e-8);near(one.lowerRec,.4375);
 const ten=recordHighStats({...d,rhYears:10});assert.equal(ten.rec.length,119);near(ten.lowerRec,1/119);
});

test('drawdowns and spells match the recorded episodes',()=>{
 const dd=drawdowns(),deep=dd.reduce((a,b)=>b.dd<a.dd?b:a);
 assert.equal(monthLabel(deep.i),'2002-09');near(deep.dd,6180.42/11247.92-1,1e-6);
 const sp=underwaterSpells(),big=sp.filter(s=>s.fall<=-.2);
 assert.equal(big.length,9);assert.equal(Math.max(...sp.map(s=>s.months)),73);
});

test('result renders four charts and handles settings with no record months',()=>{
 const r=planningResult('recordHigh',defaults('recordHigh'));
 assert.equal(r.charts.length,4);assert.equal(r.charts[0].series[0].rows.length,271);assert.equal(r.charts[1].series[0].rows.length,813);
 assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));
 assert.ok(planningGuides.some(g=>g.slug==='buying-at-record-high-sp-tsx-record-months-what-followed-1956-2023'));
 const late=planningResult('recordHigh',{...defaults('recordHigh'),rhFrom:2013,rhYears:10});
 assert.equal(late.charts.length,1);
});
