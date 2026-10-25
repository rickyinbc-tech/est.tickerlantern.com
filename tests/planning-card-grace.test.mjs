import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {cardGraceCashPlan} from '../src/planning-card-grace-models.js';
import {cardGraceGuides} from '../src/planning-card-grace-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
test('posting date changes the purchase-to-due interval without resetting the common statement date',()=>{
 const d=defaults('cardGraceCash'),p=cardGraceCashPlan(d);assert.equal(p.cycleEnd,30);assert.equal(p.dueDay,51);assert.equal(p.days,46);near(p.available,1460);near(p.gap,40);
 const early=cardGraceCashPlan({...d,postedDay:1}),late=cardGraceCashPlan({...d,postedDay:30});assert.equal(early.days,50);assert.equal(late.days,21);assert.equal(early.dueDay,late.dueDay);near(early.gap,0);near(late.gap,290);
 assert.equal(p.rows[0].x,5);near(p.rows[0].reserve,1000);assert.equal(p.rows.at(-1).x,51);near(p.rows.at(-1).reserve,p.available);
});
test('daily allocations reconcile once and required saving rounds up sufficiently to fund the target',()=>{
 const d=defaults('cardGraceCash');
 for(const postedDay of [1,5,30])for(const graceDays of [21,30])for(const reserved of [0,1000,20000]){
  const input={...d,postedDay,graceDays,reserved},p=cardGraceCashPlan(input),required=Math.max(0,(d.purchase-reserved)/p.days);
  near(p.saved,p.days*d.dailyReserve);near(p.residual,reserved+p.saved-d.purchase);near(p.gap,Math.max(0,-p.residual));
  assert.ok(p.requiredDaily+1e-8>=required);assert.ok(p.requiredDaily-required<.01000001);near(cardGraceCashPlan({...input,dailyReserve:p.requiredDaily}).gap,0);
 }
 const p=cardGraceCashPlan(d);near(p.requiredDaily,10.87);near(cardGraceCashPlan({...d,dailyReserve:0}).gap,500);
 const bridge=planningResult('cardGraceCash').charts.find(c=>c.type==='waterfall');near(bridge.rows.reduce((s,r)=>s+r.value,0),p.residual);
});
test('grace-period guide keeps detailed prose, known related articles and four finite accessible figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of cardGraceGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
 for(const key of ['postedDay','graceDays'])assert.equal(validInputs('cardGraceCash',{...defaults('cardGraceCash'),[key]:21.5}),false);
});
