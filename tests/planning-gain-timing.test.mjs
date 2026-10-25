import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {gainTimingPlan} from '../src/planning-gain-timing-models.js';
import {gainTimingGuides} from '../src/planning-gain-timing-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
test('annual and final-sale cases agree with independent after-tax compounding identities',()=>{
 const d=defaults('gainRealization');
 for(const appreciation of [0,5,12])for(const gainTax of [0,25,60])for(const years of [1,10,30]){
  const p=gainTimingPlan({...d,appreciation,gainTax,years}),r=appreciation/100,t=gainTax/100;
  near(p.end.annual,d.initial*(1+r*(1-t))**years);near(p.end.deferredGross,d.initial*(1+r)**years);
  near(p.end.deferredNet,d.initial+(p.end.deferredGross-d.initial)*(1-t));near(p.deferredTax,(p.end.deferredGross-d.initial)*t);
  near(p.annualGrowth-p.annualTax,p.end.annual-d.initial);near(p.annualTax,p.annualGrowth*t);
  assert.ok(p.difference>=0);near(p.difference,p.end.deferredNet-p.end.annual);
 }
 const p=gainTimingPlan(d);near(p.end.annual,144504.39426308376);near(p.end.deferredNet,147167.09700830813);near(p.difference,2662.7027452243783);
});
test('equal payment dates or absent gain tax remove timing differences without taxing principal',()=>{
 const d=defaults('gainRealization');
 for(const changes of [{years:1},{gainTax:0},{appreciation:0}])assert.equal(gainTimingPlan({...d,...changes}).difference,0);
 const p=gainTimingPlan(d);assert.ok(p.deferredTax>p.annualTax);assert.ok(p.end.deferredNet>p.end.annual);
 const bridge=planningResult('gainRealization').charts.find(c=>c.type==='waterfall');near(bridge.rows.reduce((s,r)=>s+r.value,0),p.end.deferredNet);
 near(p.rows[1].annual,103750);near(p.rows[2].annual,107640.625);
});
test('gain-timing guide retains complete assumptions, substantial prose and four finite accessible figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of gainTimingGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
 assert.equal(validInputs('gainRealization',{...defaults('gainRealization'),years:1.5}),false);
});
