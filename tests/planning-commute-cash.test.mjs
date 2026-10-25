import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {commuteCashPlan} from '../src/planning-commute-cash-models.js';
import {commuteSnapshot} from '../src/planning-commute-cash-data.js';
import {commuteCashGuides} from '../src/planning-commute-cash-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('six source figures retain the commuter denominator and remain independent of personal attendance',()=>{
 assert.equal(commuteSnapshot.reference,'May 2025');assert.equal(commuteSnapshot.released,'2025-08-26');assert.match(commuteSnapshot.scope,/15–69/);
 assert.deepEqual(commuteSnapshot.rows.map(r=>[r.share,r.minutes]),[[80.9,24.7],[11.9,44.1],[6.2,15]]);
 const a=planningResult('commuteCash'),b=planningResult('commuteCash',{...defaults('commuteCash'),commuteDays:0,commuteMonths:1,commuteMinutes:120});
 assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));assert.ok(a.charts.slice(0,2).every(c=>c.source));assert.ok(a.charts.slice(2).every(c=>!c.source));near(a.charts[0].rows.reduce((s,r)=>s+r.value,0),.99);
});
test('an independently enumerated commute calendar verifies cash and hours without converting time to wages',()=>{
 const d=defaults('commuteCash'),p=commuteCashPlan(d);near(p.pass,1920);near(p.fare,1152);near(p.car,2592);near(p.hours,192);near(p.breakEvenDays,20);assert.equal(p.days,144);
 for(const commuteDays of [0,1,12,20,23])for(const commuteMonths of [1,6,12])for(const commuteMinutes of [0,40,120]){
  const input={...d,commuteDays,commuteMonths,commuteMinutes},q=commuteCashPlan(input);let pass=0,fare=0,car=0,minutes=0;
  for(let month=0;month<commuteMonths;month++){pass+=160;for(let day=0;day<commuteDays;day++){fare+=8;car+=18;minutes+=commuteMinutes*2;}}
  near(q.pass,pass);near(q.fare,fare);near(q.car,car);near(q.hours,minutes/60);
 }
 const crossing=commuteCashPlan({...d,commuteDays:20});near(crossing.pass,crossing.fare);
 assert.ok(commuteCashPlan({...d,commuteDays:19}).pass>commuteCashPlan({...d,commuteDays:19}).fare);assert.ok(commuteCashPlan({...d,commuteDays:21}).pass<commuteCashPlan({...d,commuteDays:21}).fare);
 const none=commuteCashPlan({...d,commuteDays:0});near(none.pass,1920);near(none.fare,0);near(none.car,0);near(none.hours,0);
 assert.equal(commuteCashPlan({...d,commuteFare:0}).breakEvenDays,null);near(commuteCashPlan({...d,commutePass:0}).breakEvenDays,0);
 const costs=planningResult('commuteCash',d).charts[2];assert.equal(costs.series.length,3);for(const series of costs.series)assert.equal(series.rows.length,24);
 const matrix=planningResult('commuteCash',d).charts[3];near(matrix.rows[0].values[0],32);near(matrix.rows[3].values[3],520);
});
test('commuting guide preserves English detail, working links, valid whole-day controls and four accessible figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of commuteCashGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.equal((html.match(/>Official statistics</g)||[]).length,2);}
  }
 }
 assert.equal(validInputs('commuteCash',{...defaults('commuteCash'),commuteDays:1.5}),false);assert.equal(validInputs('commuteCash',{...defaults('commuteCash'),commuteMonths:1.5}),false);
});
