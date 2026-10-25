import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {aiTimeSource} from '../src/planning-ai-time-data.js';
import {aiTimeCashScenario} from '../src/planning-ai-time-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('the bounded source contains seven categorical observations with separate units and survey dates',()=>{
 const s=aiTimeSource;assert.equal(s.releaseDate,'2026-10-19');assert.equal(s.retrieved,'2026-10-25');assert.equal(s.referenceQuarter,'2026 Q3');
 assert.deepEqual(s.onlineCollection,['2026-08-05','2026-08-27']);assert.deepEqual(s.followUpInterviews,['2026-08-24','2026-09-04']);assert.match(s.reportSha256,/^[a-f0-9]{64}$/);
 assert.equal(s.groups.length,2);assert.deepEqual(s.groups.map(g=>g.rows.length),[2,5]);
 for(const g of s.groups){assert.deepEqual(g.dimension,{key:'k',name:'Category'});assert.match(g.sha256,/^[a-f0-9]{64}$/);assert.equal(new Set(g.rows.map(r=>r.label)).size,g.rows.length);assert.ok(g.rows.every(r=>Number.isFinite(r.value)));}
 assert.match(s.groups[0].questionAndStatistic,/interpolated median/);assert.match(s.groups[0].notes,/midpoint/);assert.match(s.groups[0].notes,/7.5/);assert.match(s.groups[1].questionAndStatistic,/check all that apply/);
});
test('hours remain in hours while overlapping response shares convert published percentages only once',()=>{
 const r=planningResult('aiTime');assert.deepEqual(r.charts[0].rows.map(x=>x.value),[2.8,4.7]);assert.equal(r.charts[0].unit,'decimal');
 const published=[54.64,53,36.62,35.23,29.71];r.charts[1].rows.forEach((row,j)=>near(row.value,published[j]/100));
 near(r.charts[1].rows.reduce((s,r)=>s+r.value,0),2.092);assert.equal(r.charts[1].type,'bar');
 assert.ok(r.charts.slice(0,2).every(c=>c.source===aiTimeSource.reportUrl&&c.sourceLabel.startsWith('Bank of Canada')));assert.ok(r.charts.slice(2).every(c=>!c.source));
});
test('official source panels and the survey metric remain fixed when all scenario inputs change',()=>{
 const d=defaults('aiTime'),a=planningResult('aiTime',d),b=planningResult('aiTime',{aiHours:10,aiWeeks:52,aiPaidShare:100,aiReceiptRate:200,aiToolCost:2400});
 assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));assert.deepEqual(a.metrics[0],b.metrics[0]);assert.notEqual(a.metrics[1][1],b.metrics[1][1]);
 assert.ok(d.aiHours!==aiTimeSource.groups[0].rows[1].value);assert.ok(d.aiPaidShare!==aiTimeSource.groups[1].rows[1].value);
});
test('independent paid-work receipts reconcile capacity, conversion and one annual out-of-pocket cost',()=>{
 const d=defaults('aiTime'),p=aiTimeCashScenario(d);near(p.released,138);near(p.paid,69);near(p.gross,3450);near(p.cost,240);near(p.change,3210);near(p.noExtraPayChange,-240);
 let weeklyGross=0;for(let week=0;week<d.aiWeeks;week++)weeklyGross+=d.aiHours*d.aiPaidShare/100*d.aiReceiptRate;near(p.gross,weeklyGross);
 const r=planningResult('aiTime',d);near(r.charts[2].rows.reduce((s,r)=>s+r.value,0),p.change);
 near(r.charts[3].rows[0].value,p.change);near(r.charts[3].rows[1].value,p.noExtraPayChange);
});
test('zero paid conversion, hours or receipt rate creates no extra receipts while cost remains payable',()=>{
 const d=defaults('aiTime');for(const key of ['aiHours','aiPaidShare','aiReceiptRate']){const p=aiTimeCashScenario({...d,[key]:0});near(p.gross,0);near(p.change,-d.aiToolCost);}
 const free=aiTimeCashScenario({...d,aiToolCost:0});near(free.change,free.gross);near(free.noExtraPayChange,0);
 const doubled=aiTimeCashScenario({...d,aiHours:2*d.aiHours});near(doubled.gross,2*aiTimeCashScenario(d).gross);
});
test('matrix replaces only the conversion and cost assumptions while retaining independent work inputs',()=>{
 const d=defaults('aiTime'),r=planningResult('aiTime',d);
 [0,25,50,75,100].forEach((share,j)=>[0,120,240,480].forEach((cost,k)=>near(r.charts[4].rows[j].values[k],d.aiHours*d.aiWeeks*share/100*d.aiReceiptRate-cost)));
 assert.deepEqual(r.charts[4],planningResult('aiTime',{...d,aiPaidShare:100,aiToolCost:2400}).charts[4]);
 assert.notDeepEqual(r.charts[4],planningResult('aiTime',{...d,aiHours:0}).charts[4]);
});
test('supported bounds and whole weeks render five finite accessible figures/tables',()=>{
 const d=defaults('aiTime'),fields=definitions.aiTime.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('aiTime',i));const r=planningResult('aiTime',i);finite(r);assert.equal(r.charts.length,5);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,5);assert.equal((h.match(/<caption>/g)||[]).length,5);}
 }
 assert.equal(validInputs('aiTime',{...d,aiWeeks:1.5}),false);
});
