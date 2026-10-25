import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {expectationsSource} from '../src/planning-expectations-data.js';
import {expectationPriceScenario} from '../src/planning-expectations-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('the bounded CSCE extract has eight complete unique quarters and the published statistic/units',()=>{
 const s=expectationsSource;assert.equal(s.statistic,'Interpolated median');assert.equal(s.sourceUnits,'Percent, not fractions');assert.equal(s.referenceQuarter,'2026 Q3');assert.equal(s.releaseDate,'2026-10-19');assert.equal(s.retrieved,'2026-10-25');
 assert.deepEqual(s.onlineCollection,['2026-08-05','2026-08-27']);assert.deepEqual(s.followUpInterviews,['2026-08-24','2026-09-04']);
 assert.match(s.htmlSha256,/^[a-f0-9]{64}$/);assert.match(s.jsonSha256,/^[a-f0-9]{64}$/);assert.equal(s.rows.length,8);assert.equal(new Set(s.rows.map(r=>r.dateKey)).size,8);
 assert.deepEqual(s.rows.map(r=>r.quarter),['2024 Q4','2025 Q1','2025 Q2','2025 Q3','2025 Q4','2026 Q1','2026 Q2','2026 Q3']);
 let count=0;for(const row of s.rows)for(const key of Object.keys(s.series)){assert.ok(Number.isFinite(row[key]));count++;}assert.equal(count,32);
});
test('latest source medians convert percent units once and changes retain percentage-point meaning',()=>{
 const r=planningResult('expectations'),rows=r.charts[0].rows;assert.deepEqual(rows.map(x=>x.value),[.039,.0403,.0388,.0391]);
 const changes=r.charts[2];assert.equal(changes.unit,'pp');[-.05,-.09,.52].forEach((v,j)=>near(changes.rows[j].value*100,v));
 assert.ok(r.charts[1].series.every(s=>s.rows.length===8));assert.equal(r.charts[1].series[0].rows.at(-1).label,'2026 Q3');
 assert.ok(r.charts.slice(0,3).every(c=>c.source===expectationsSource.reportUrl&&c.sourceLabel.startsWith('Bank of Canada')));
});
test('household scenario controls cannot alter any of the three official-data panels',()=>{
 const d=defaults('expectations'),a=planningResult('expectations',d),b=planningResult('expectations',{...d,expectCost:30000,expectInflation:8,expectYears:30});
 assert.deepEqual(a.charts.slice(0,3),b.charts.slice(0,3));assert.deepEqual(a.metrics.slice(0,2),b.metrics.slice(0,2));assert.notEqual(a.metrics[2][1],b.metrics[2][1]);
 assert.ok(a.charts.slice(3).every(c=>!c.source));
});
test('the independent annual-cost scenario matches an iterative price recurrence rather than a survey rate',()=>{
 const d=defaults('expectations'),rows=expectationPriceScenario(d);let expected=d.expectCost;
 for(const row of rows){near(row.future,expected);near(row.current,d.expectCost);expected*=1+d.expectInflation/100;}
 near(rows.at(-1).future,16126.996552129467);assert.equal(rows.length,d.expectYears+1);near(rows[0].future,d.expectCost);
 assert.ok(d.expectInflation!==expectationsSource.rows.at(-1).CES_C1_SHORT_TERM);
 const flat=expectationPriceScenario({...d,expectInflation:0});assert.ok(flat.every(r=>r.future===d.expectCost));
});
test('endpoint matrix amounts are annual costs at stated horizons, preserving zero and scale identities',()=>{
 const d=defaults('expectations'),r=planningResult('expectations',d),m=r.charts[4];
 for(let row=0;row<4;row++)for(let col=0;col<4;col++)near(m.rows[row].values[col],d.expectCost*(1+[0,2,4,6][row]/100)**[5,10,15,20][col]);
 const zero=planningResult('expectations',{...d,expectCost:0});assert.ok(zero.charts[4].rows.every(r=>r.values.every(v=>v===0)));
 const twice=planningResult('expectations',{...d,expectCost:2*d.expectCost});near(twice.metrics[2][1],2*r.metrics[2][1]);
});
test('whole horizons and all supported scenario boundaries render five finite figures/tables',()=>{
 const d=defaults('expectations'),fields=definitions.expectations.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('expectations',i));const r=planningResult('expectations',i);finite(r);assert.equal(r.charts.length,5);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,5);assert.equal((h.match(/<caption>/g)||[]).length,5);}
 }
 assert.equal(validInputs('expectations',{...d,expectYears:1.5}),false);
});
