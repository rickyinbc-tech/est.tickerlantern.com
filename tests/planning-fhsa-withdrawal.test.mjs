import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {periodEndYear} from '../src/planning-fhsa-withdrawal-models.js';
const kind='fhsaWithdrawalWindow';
test('default calendar margins and remainder reconcile with hand-checked dates',()=>{
 const r=planningResult(kind,defaults(kind));
 assert.equal(r.metrics[1][3],'All modelled timing checks met');
 assert.match(r.metrics[2][3],/31 Dec 2028 \(year after first qualifying withdrawal\)/);
 assert.equal(r.metrics[3][1],657);assert.equal(r.metrics[4][1],3500);assert.equal(r.metrics[5][1],1050);
 assert.deepEqual(r.charts[0].rows.map(x=>x.value),[75,520,336,657]);
 for(const row of r.charts[1].rows)assert.equal(row.values.reduce((a,b)=>a+b,0),33500);
 assert.deepEqual(r.charts[2].rows.map(x=>x.values.reduce((a,b)=>a+b,0)),[3500,3500,3500,30000]);
 assert.equal(r.charts[3].rows.at(-1).value,15);
});
test('participation period uses the earliest CRA trigger',()=>{
 assert.equal(periodEndYear(2025,30,null),2040);
 assert.equal(periodEndYear(2025,60,null),2036);
 assert.equal(periodEndYear(2025,30,2034),2035);
 assert.equal(periodEndYear(2025,30,2040),2040);
});
test('boundary dates pass on the last permitted day and fail one day later',()=>{
 const d=defaults(kind);
 let r=planningResult(kind,{...d,fhsaAcqLag:-30});assert.equal(r.charts[0].rows[0].value,0);assert.equal(r.metrics[1][3],'All modelled timing checks met');
 r=planningResult(kind,{...d,fhsaAcqLag:-31});assert.match(r.metrics[1][3],/^Fails: acquisition not more than 30 days/);
 // 15 Dec 2027 + 290 days = 30 Sep 2028 (last day); 291 days = 1 Oct 2028.
 r=planningResult(kind,{...d,fhsaWithdrawMonth:12,fhsaWithdrawDay:15,fhsaAcqLag:290});assert.equal(r.charts[0].rows[1].value,0);
 r=planningResult(kind,{...d,fhsaWithdrawMonth:12,fhsaWithdrawDay:15,fhsaAcqLag:291});assert.equal(r.charts[0].rows[1].value,-1);
 r=planningResult(kind,{...d,fhsaOccupyMonths:12});assert.equal(r.charts[0].rows[2].value,0);
 r=planningResult(kind,{...d,fhsaOccupyMonths:13});assert.ok(r.charts[0].rows[2].value<0);
 r=planningResult(kind,{...d,fhsaLastOwnedYear:2022});assert.equal(r.metrics[1][3],'All modelled timing checks met');
 r=planningResult(kind,{...d,fhsaLastOwnedYear:2023});assert.match(r.metrics[1][3],/look-back/);
});
test('extreme inputs render four finite charts and invalid combinations are rejected',()=>{
 const d=defaults(kind);
 for(const input of [
  {...d,fhsaBalance:0,fhsaQualifying:0,fhsaTaxRate:0},
  {...d,fhsaQualifying:33500,fhsaTaxRate:60},
  {...d,fhsaOpenYear:2023,fhsaOpenAge:71,fhsaWithdrawYear:2023,fhsaAcqLag:700,fhsaOccupyMonths:24},
  {...d,fhsaOpenYear:2045,fhsaOpenAge:18,fhsaWithdrawYear:2060,fhsaWithdrawMonth:1,fhsaWithdrawDay:1,fhsaAcqLag:-60}
 ]){
  assert.ok(validInputs(kind,input));const r=planningResult(kind,input),html=renderResult(r,360);
  assert.equal(r.charts.length,4);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
 assert.equal(validInputs(kind,{...d,fhsaQualifying:d.fhsaBalance+500}),false);
 assert.equal(validInputs(kind,{...d,fhsaWithdrawYear:2023}),false);
 assert.equal(validInputs(kind,{...d,fhsaWithdrawYear:2040}),false);
 assert.equal(validInputs(kind,{...d,fhsaLastOwnedYear:1500}),false);
 assert.equal(validInputs(kind,{...d,fhsaLastOwnedYear:2030}),false);
 assert.equal(validInputs(kind,{...d,fhsaAcqLag:4.5}),false);
});
test('guide is English, dated, source-backed and links to existing articles',()=>{
 const g=planningGuides.find(x=>x.slug==='fhsa-first-time-homebuyer-qualifying-withdrawal-deadline-closeout');assert.ok(g);
 assert.equal(g.planning,kind);assert.equal(g.related.length,3);assert.ok(g.sections.length>=5);assert.ok(g.sources.length>=5);
 assert.ok(g.related.every(s=>planningGuides.some(x=>x.slug===s)));
 assert.ok(g.sources.some(s=>s.url.endsWith('withdrawals-transfers-out-your-fhsas.html')));
 assert.ok(g.sources.some(s=>s.url.endsWith('closing-your-fhsa.html')));
 assert.match(g.sections[1].html,/520/);assert.match(g.sections[2].html,/657 days/);assert.match(g.sections[3].html,/CAD 1,050/);
});
