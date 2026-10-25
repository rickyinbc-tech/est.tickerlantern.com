import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {maturityCalendarPlan} from '../src/planning-maturity-average-models.js';
import {maturityAverageGuides} from '../src/planning-maturity-average-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
test('independent receipt-at-deadline identities verify funding gaps while the face-weighted means stay equal',()=>{
 const d=defaults('maturityCalendar');
 for(const maturityMean of [4,6,8])for(const maturitySpacing of [0,1,2,3])for(const maturityBillYear of [1,2,4,5,6,8,10,12]){
  const p=maturityCalendarPlan({...d,maturityMean,maturitySpacing,maturityBillYear}),early=maturityMean-maturitySpacing,late=maturityMean+maturitySpacing;
  const splitPaid=d.maturityFace/2*(Number(early<=maturityBillYear)+Number(late<=maturityBillYear)),singlePaid=d.maturityFace*Number(maturityMean<=maturityBillYear);
  assert.equal(p.mean,(d.maturityFace/2*early+d.maturityFace/2*late)/d.maturityFace);assert.equal(p.mean,maturityMean);
  assert.equal(p.due.splitPrincipal,splitPaid);assert.equal(p.due.singlePrincipal,singlePaid);
  assert.equal(p.splitExtra,Math.max(0,d.maturityBill-d.maturityOpeningCash-splitPaid));assert.equal(p.singleExtra,Math.max(0,d.maturityBill-d.maturityOpeningCash-singlePaid));
  assert.equal(p.end.splitCash,d.maturityOpeningCash+d.maturityFace-d.maturityBill);assert.equal(p.end.singleCash,p.end.splitCash);
  assert.equal(p.rows.reduce((s,r)=>s+r.splitReceipt,0),d.maturityFace);assert.equal(p.rows.reduce((s,r)=>s+r.singleReceipt,0),d.maturityFace);assert.equal(p.rows.reduce((s,r)=>s+r.bill,0),d.maturityBill);
 }
});
test('equal endpoints do not erase the earlier gap, and moving the deadline can reverse the comparison',()=>{
 const d=defaults('maturityCalendar'),p=maturityCalendarPlan(d);assert.equal(p.early,4);assert.equal(p.late,8);assert.equal(p.mean,6);assert.equal(p.splitExtra,8000);assert.equal(p.singleExtra,0);assert.equal(p.end.splitCash,2000);
 assert.equal(p.rows[6].splitCash,-8000);assert.equal(p.rows[8].splitCash,2000);
 const earlier=maturityCalendarPlan({...d,maturityBillYear:5});assert.equal(earlier.splitExtra,8000);assert.equal(earlier.singleExtra,18000);
 const coincident=maturityCalendarPlan({...d,maturitySpacing:0});assert.ok(coincident.rows.every(r=>r.splitCash===r.singleCash));assert.equal(coincident.rows[6].splitReceipt,20000);
 assert.equal(planningResult('maturityCalendar',{...d,maturitySpacing:0}).charts[0].rows.length,1);
 assert.equal(planningResult('maturityCalendar').charts[2].rows.reduce((s,r)=>s+r.value,0),-8000);
});
test('mean-maturity guide has substantial prose, resolvable links and four accessible finite figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of maturityAverageGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
 for(const [key,value] of [['maturityMean',4.5],['maturitySpacing',1.5],['maturityBillYear',4.5]])assert.equal(validInputs('maturityCalendar',{...defaults('maturityCalendar'),[key]:value}),false);
});
