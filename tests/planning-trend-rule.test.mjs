import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, trendRuleStats, roundTrips, rollingShare, firstStart } from '../src/planning-trend-rule-models.js';
import { monthLabel } from '../src/planning-record-high-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('defaults match an independent 40-digit Decimal check',()=>{
 const d=defaults('trendRule'),s=trendRuleStats(d);
 assert.equal(monthLabel(s.s),'1958-01');assert.equal(s.e-s.s,788);
 near(s.hold.value,1608632.819508,1e-9);near(s.rule.value,2242662.058978,1e-9);
 near(s.hold.maxDD,-0.43904068,1e-6);near(s.rule.maxDD,-0.24670740,1e-6);
 assert.equal(s.trips.length,58);assert.equal(s.trips.filter(x=>x.whipsaw).length,40);
 near(s.rollWins,485/669);
 const tax=trendRuleStats({...d,maMarg:45,maDivTax:25});near(tax.hold.value,907033.819944,1e-9);near(tax.rule.value,508149.195647,1e-9);near(tax.rollWins,360/669);
 const y4=trendRuleStats({...d,maYield:4});near(y4.hold.value,4281831.741193,1e-9);near(y4.rule.value,4294682.076382,1e-9);
 const late=trendRuleStats({...d,maFrom:2009});near(late.hold.value,30093.819453,1e-9);near(late.rule.value,16507.083209,1e-9);assert.equal(late.rollWins,0);
 const band=trendRuleStats({...d,maBand:2});assert.equal(band.trips.length,31);assert.equal(band.trips.filter(x=>x.whipsaw).length,18);
 const k24=trendRuleStats({...d,maWindow:24});near(k24.rule.value,266687.297483,1e-9);near(rollingShare(d,24,10).share,69/669);
});

test('the rule with no switches equals staying invested, and costs only lower it',()=>{
 const d=defaults('trendRule'),s=firstStart(d);
 const hold=simulate(d,s,s+120,{rule:false}).value,noBand=simulate({...d,maCost:0},s,s+120).value,costly=simulate({...d,maCost:1},s,s+120).value;
 assert.ok(costly<noBand);const stuck=simulate({...d,maBand:10000},s+6,s+126);assert.equal(stuck.trades.length,0);assert.equal(stuck.inMonths,120);near(stuck.value,simulate(d,s+6,s+126,{rule:false}).value);
 assert.equal(roundTrips([{t:1,inv:false,level:10},{t:2,inv:true,level:11}])[0].whipsaw,true);
});

test('result renders four charts and handles every input range',()=>{
 const r=planningResult('trendRule',defaults('trendRule'));
 assert.equal(r.charts.length,4);assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));
 assert.equal(r.charts[3].rows.length,6);assert.ok(r.charts[0].series[0].rows.length<=170);
 assert.ok(planningGuides.some(g=>g.slug==='moving-average-exit-rule-sp-tsx-1958-2023-treasury-bills-whipsaws-tax'));
 const late=planningResult('trendRule',{...defaults('trendRule'),maFrom:2022,maYears:30});
 assert.equal(late.charts.length,4);assert.equal(late.charts[3].rows[0].values.every(v=>v===null),true);
 assert.equal(validInputs('trendRule',{...defaults('trendRule'),maWindow:25}),false);
});
