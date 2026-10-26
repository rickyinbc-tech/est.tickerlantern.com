import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentPerceptionSource as source} from '../src/planning-payment-perception-data.js';
import {paymentPerceptionLedger as ledger} from '../src/planning-payment-perception-models.js';
import {paymentPerceptionGuides} from '../src/planning-payment-perception-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {defaults,planningResult,validInputs} from '../src/planning-models.js';
import {renderFigure} from '../src/planning-charts.js';
const base=defaults('paymentPerception');

test('the public extract retains five distinct quarters, original percent levels and a specific methodology location',()=>{
 assert.deepEqual(source.rows.map(r=>[r.quarter,r.value]),[['2025 Q3',5.78],['2025 Q4',9.49],['2026 Q1',9.24],['2026 Q2',7.37],['2026 Q3',5.29]]);
 assert.equal(new Set(source.rows.map(r=>r.dateKey)).size,5);assert.equal(source.series,'CES_C14_MISS_DEBT');assert.equal(source.questionHorizon,'Next three months');
 assert.match(source.statistic,/Interpolated median/);assert.match(source.methodologyLocation,/printed page 17; PDF page 20/);
 for(const key of ['surveyHtmlSha256','dataJsonSha256','reportHtmlSha256','methodologyPdfSha256'])assert.match(source[key],/^[a-f0-9]{64}$/);
 assert.equal(source.releaseDate,'2026-10-19');assert.equal(source.retrieved,'2026-10-25');
});
test('chart probabilities convert source percent once and quarter changes use percentage points',()=>{
 const result=planningResult('paymentPerception',base),values=result.charts[0].series[0].rows.map(r=>r.value);
 [.0578,.0949,.0924,.0737,.0529].forEach((n,j)=>assert.ok(Math.abs(n-values[j])<1e-12));assert.equal(result.metrics[0][3],'5.29%');
 const changes=result.charts[1].rows.map(r=>r.value*100);
 [3.71,-.25,-1.87,-2.08].forEach((n,j)=>assert.ok(Math.abs(n-changes[j])<1e-12));
 assert.ok(values.every(v=>v<=result.charts[0].yMax));assert.equal(result.charts[1].unit,'pp');
 const change=result.charts[1];assert.match(renderFigure(change,300),/>2.5 pp</);assert.doesNotMatch(renderFigure(change,300),/>1.25 pp</);
 for(const axisTicks of [[NaN],[.1],[-.1]])assert.throws(()=>renderFigure({...change,axisTicks},300),/ticks must be finite and within/);
});
test('a positive final funding balance does not erase the full minimum shortfall before a later receipt',()=>{
 const p=ledger(base);assert.equal(p.resources,600);assert.equal(p.applied,600);assert.equal(p.gap,900);assert.equal(p.ending,100);
 assert.equal(p.rows[9].value,600);assert.equal(p.rows[10].value,-900);assert.equal(p.rows[14].value,-900);assert.equal(p.rows[15].value,100);assert.equal(p.rows.at(-1).value,100);
 const c=planningResult('paymentPerception',base).charts[2];assert.equal(c.rows.reduce((s,r)=>s+r.value,0),900);
 assert.ok(p.gap>1500*.0529,'The full funding need is not a survey-probability-scaled bill');
});
test('optional tick selection preserves legacy signed-bar automatic axes at floating-point endpoints',()=>{
 for(const values of [[-.083,.103,-.012,-.01,.003],[.04166666666666652,-.02083333333333326]]){
  const c={id:'legacy-auto-ticks',type:'signedbar',title:'Existing automatic axis',unit:'percent',rows:values.map((value,j)=>({label:'Scenario '+j,value}))};
  assert.doesNotThrow(()=>renderFigure(c,300));assert.doesNotMatch(renderFigure(c,760),/NaN|Infinity|undefined/);
 }
});
test('the stated same-day convention includes the cleared receipt before the payment without inventing an intraday peak',()=>{
 const p=ledger({...base,perceptionReceiptDay:10});assert.equal(p.resources,1600);assert.equal(p.gap,0);assert.equal(p.unusedAtDue,100);
 assert.equal(p.rows[9].value,600);assert.equal(p.rows[10].value,100);assert.ok(p.rows.every(r=>r.value>=0));
 for(const day of [1,60]){const q=ledger({...base,perceptionDueDay:day,perceptionReceiptDay:day});assert.equal(q.gap,0);assert.equal(q.rows[day].value,100);}
});
test('surplus resources are capped when applied to the bill, and a zero bill never creates a negative shortfall',()=>{
 for(const bill of [0,1500]){const i={...base,perceptionBill:bill,perceptionCash:20000,perceptionReceiptDay:1},p=ledger(i),c=planningResult('paymentPerception',i).charts[2];
  assert.equal(p.applied,bill);assert.equal(p.gap,0);assert.equal(p.unusedAtDue,21000-bill);assert.equal(c.rows.reduce((s,r)=>s+r.value,0),0);
 }
});
test('independent household inputs never rewrite the official survey panels',()=>{
 const a=planningResult('paymentPerception',base),b=planningResult('paymentPerception',{...base,perceptionBill:10000,perceptionCash:0,perceptionReceipt:20000,perceptionDueDay:60,perceptionReceiptDay:1});
 assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));assert.deepEqual(a.metrics[0],b.metrics[0]);assert.notDeepEqual(a.charts[2],b.charts[2]);
});
test('the matrix replaces only stated cash and receipt-day alternatives and respects due-day timing',()=>{
 const a=planningResult('paymentPerception',base).charts[4];
 assert.deepEqual(a.rows.map(r=>r.values),[[500,0,0,0],[500,0,0,0],[1500,1000,500,0],[1500,1000,500,0]]);
 const b=planningResult('paymentPerception',{...base,perceptionCash:20000,perceptionReceiptDay:1}).charts[4];assert.deepEqual(a,b);
 const c=planningResult('paymentPerception',{...base,perceptionDueDay:20}).charts[4];assert.ok(c.rows.every(r=>r.values[0]===500));
});
test('calendar days require valid whole-number inputs and invalid amounts cannot enter the ledger',()=>{
 for(const patch of [{perceptionDueDay:1.5},{perceptionReceiptDay:0},{perceptionDueDay:61},{perceptionBill:-1},{perceptionReceipt:Infinity},{perceptionCash:NaN}]){
  assert.equal(validInputs('paymentPerception',{...base,...patch}),false);assert.throws(()=>planningResult('paymentPerception',{...base,...patch}));assert.throws(()=>ledger({...base,...patch}));
 }
 assert.throws(()=>ledger(base,-1,5));assert.throws(()=>ledger(base,600,2.5));
});
test('five accessible figures use four visual types and remain finite across zero, maximum and boundary scenarios',()=>{
 const variants=[base,{...base,perceptionBill:0,perceptionCash:0,perceptionReceipt:0},{...base,perceptionBill:10000,perceptionCash:0,perceptionReceipt:0,perceptionDueDay:1},{...base,perceptionCash:20000,perceptionReceipt:20000,perceptionDueDay:60,perceptionReceiptDay:60}];
 for(const input of variants){assert.equal(validInputs('paymentPerception',input),true);const result=planningResult('paymentPerception',input);assert.equal(result.charts.length,5);assert.equal(new Set(result.charts.map(c=>c.type)).size,4);
  for(const c of result.charts)for(const width of [300,354,760]){const html=renderFigure(c,width);assert.match(html,/role="img"/);assert.match(html,/<table/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,c.source?/survey results/i:/Hypothetical scenario/);}
 }
});
test('the English guide integrates a unique route, six detailed sections and supported related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
 for(const guide of paymentPerceptionGuides){assert.ok(slugs.has(guide.slug));assert.equal(guide.sections.length,6);assert.ok(guide.related.every(s=>slugs.has(s)));const prose=guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ');assert.ok(prose.trim().split(/\s+/).length>=800);assert.match(prose,/CAD 79.35/);assert.match(prose,/minus CAD 900/);assert.match(prose,/interpolated median/i);assert.match(prose,/not a claim that a bank processed/);}
});
