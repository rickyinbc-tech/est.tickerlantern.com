import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {spatialIndexPlan} from '../src/planning-spatial-index-models.js';
import {spatialIndexGuides} from '../src/planning-spatial-index-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('independent price anchors and consistent rebasing distinguish spatial prices from local changes',()=>{
 const d=defaults('spatialIndex'),p=spatialIndexPlan(d);near(p.costA,54000);near(p.costB,66000);near(p.priceGap,2/9);assert.ok(d.spatialIndexA>d.spatialIndexB&&p.costA<p.costB);
 const swapped={...d,spatialBaseA:60000,spatialBaseB:40000},q=spatialIndexPlan(swapped);near(q.costA,72000);near(q.costB,44000);assert.ok(q.costA>q.costB);assert.deepEqual(planningResult('spatialIndex',d).charts[0],planningResult('spatialIndex',swapped).charts[0]);
 const rebased=spatialIndexPlan({...d,spatialBaseA:p.costA,spatialBaseB:p.costB,spatialIndexA:100,spatialIndexB:100});near(rebased.costA,p.costA);near(rebased.costB,p.costB);near(rebased.priceGap,p.priceGap);near(rebased.advantage,p.advantage);near(rebased.end,p.end);
 near(100/(100/1.2),1.2);near(100/(100/1.1),1.1);
});
test('an annual difference ledger retains the upfront move and later positive or negative cash comparisons',()=>{
 const d=defaults('spatialIndex'),p=spatialIndexPlan(d);near(p.leftA,16000);near(p.leftB,19000);near(p.advantage,3000);near(p.end,7000);assert.deepEqual(p.rows.map(r=>r.value),[-8000,-5000,-2000,1000,4000,7000]);
 for(const spatialNetA of [20000,70000,150000])for(const spatialNetB of [20000,85000,150000])for(const spatialMove of [0,8000,30000]){
  const q=spatialIndexPlan({...d,spatialNetA,spatialNetB,spatialMove});let difference=-spatialMove;near(q.rows[0].value,difference);
  for(let year=1;year<=d.spatialYears;year++){difference+=spatialNetB;difference-=66000;difference-=spatialNetA;difference+=54000;near(q.rows[year].value,difference);}near(q.end,difference);
 }
 near(spatialIndexPlan({...d,spatialYears:2}).end,-2000);near(spatialIndexPlan({...d,spatialYears:3}).end,1000);near(spatialIndexPlan({...d,spatialNetB:82000}).end,-8000);near(spatialIndexPlan({...d,spatialNetB:80000}).end,-18000);
 const chart=planningResult('spatialIndex',d).charts[2];near(chart.rows.reduce((s,r)=>s+r.value,0),p.advantage);
});
test('spatial-index guide keeps hypothetical evidence clear with English detail, valid links and finite accessible figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of spatialIndexGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);assert.ok(result.charts.every(c=>!c.source));
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
 assert.equal(validInputs('spatialIndex',{...defaults('spatialIndex'),spatialYears:1.5}),false);
});
