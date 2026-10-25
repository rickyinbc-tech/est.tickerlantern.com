import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {rdspRepaymentPlan} from '../src/planning-rdsp-repayment-models.js';
import {rdspRepaymentGuides} from '../src/planning-rdsp-repayment-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
test('ordinary RDSP illustration caps three-for-one repayment and reconciles both payment destinations',()=>{
 const d=defaults('rdspRepayment');
 for(const grossPayment of [0,500,2500,10000])for(const holdback of [0,1000,10000,30000])for(const planValue of [50000,100000,500000]){
  const p=rdspRepaymentPlan({...d,grossPayment,holdback,planValue}),expected=grossPayment<=holdback/3?3*grossPayment:holdback;
  near(p.repayment,expected);near(p.remaining+p.repayment+grossPayment,planValue);near(p.holdbackAfter+p.repayment,holdback);
  assert.ok(planValue-grossPayment>=holdback);assert.ok(p.remaining>=0);assert.ok(p.repayment<=3*grossPayment&&p.repayment<=holdback&&p.repayment<=planValue);
 }
 const p=rdspRepaymentPlan(d);near(p.repayment,7500);near(p.remaining,90000);near(p.holdbackAfter,2500);near(p.outflow,10000);near(p.ratio,4);
 near(p.remaining+d.grossPayment,d.planValue-p.repayment);
});
test('repayment cap, zero payment and alternative transactions do not silently reuse the original holdback',()=>{
 const d=defaults('rdspRepayment'),p=rdspRepaymentPlan(d),none=rdspRepaymentPlan({...d,grossPayment:0});near(none.repayment,0);near(none.remaining,d.planValue);assert.equal(none.ratio,null);
 const next=rdspRepaymentPlan({...d,planValue:p.remaining,holdback:p.holdbackAfter});near(next.repayment,2500);
 const zero=rdspRepaymentPlan({...d,holdback:0});near(zero.repayment,0);near(zero.ratio,1);
 const charts=planningResult('rdspRepayment').charts,bridge=charts.find(c=>c.type==='waterfall');near(bridge.rows.reduce((s,r)=>s+r.value,0),p.remaining);
 const repaymentSeries=charts[1].series[1].rows,knee=d.holdback/3;assert.ok(repaymentSeries.some(r=>r.x===knee));near(repaymentSeries.find(r=>r.x===knee).value,d.holdback);
});
test('RDSP guide preserves its narrow scope and four accessible finite figures at every supported boundary',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of rdspRepaymentGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
 assert.equal(validInputs('rdspRepayment',{...defaults('rdspRepayment'),grossPayment:10001}),false);
});
