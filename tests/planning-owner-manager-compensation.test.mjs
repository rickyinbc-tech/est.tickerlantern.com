import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
const kind='ownerManagerCompensation';
test('default owner-manager ledger reconciles and dated RRSP illustration is bounded',()=>{
 const i=defaults(kind),r=planningResult(kind,i);
 assert.equal(r.metrics[0][1],60000);assert.equal(r.metrics[1][1],9000);assert.equal(r.metrics[2][1],51000);assert.equal(r.metrics[3][1],111000);assert.equal(r.metrics[4][1],10800);
 assert.equal(r.charts[0].rows[0].values.reduce((a,b)=>a+b,0),120000);
 assert.deepEqual(r.charts[2].rows.map(x=>x.value),[10800,0]);
 for(const row of r.charts[3].rows)assert.equal(row.values.reduce((a,b)=>a+b,0),60000);
});
test('zero, all-salary, all-dividend and RRSP-cap boundaries stay finite',()=>{
 const d=defaults(kind);
 for(const input of [
  {...d,ownerProfit:0,ownerSalary:0,ownerCorpRate:0},
  {...d,ownerSalary:120000,ownerCorpRate:40},
  {...d,ownerSalary:0,ownerCorpRate:15},
  {...d,ownerProfit:300000,ownerSalary:250000,ownerCorpRate:15}
 ]){
  assert.ok(validInputs(kind,input));const r=planningResult(kind,input),html=renderResult(r,360);
  assert.equal(r.charts.length,4);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
  assert.equal(r.charts[0].rows[0].values.reduce((a,b)=>a+b,0),input.ownerProfit);
  assert.ok(r.metrics[4][1]<=35390);
 }
 assert.equal(validInputs(kind,{...d,ownerSalary:d.ownerProfit+5000}),false);
});
test('guide is English, source-backed and points to existing articles',()=>{
 const g=planningGuides.find(x=>x.slug==='owner-manager-salary-dividend-cpp-rrsp-room');assert.ok(g);
 assert.equal(g.planning,kind);assert.equal(g.related.length,3);assert.ok(g.sections.length>=5);assert.ok(g.sources.length>=6);
 assert.ok(g.related.every(s=>planningGuides.some(x=>x.slug===s)));
 assert.ok(g.sources.some(s=>s.url.includes('corporation-tax-rates')));
 assert.ok(g.sources.some(s=>s.url.includes('pensionable-and-employment')) || g.sources.some(s=>s.url.includes('employment-insurance-explained-10')));
 assert.match(g.sections[0].html,/CAD 120,000/);assert.match(g.sections[2].html,/35,390/);
});
