import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {toyDebtPopulation} from '../src/planning-debt-denominators-models.js';
import {debt2023} from '../src/planning-debt-denominators-data.js';
import {debtDenominatorGuides} from '../src/planning-debt-denominators-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult,renderFigure} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
test('invented population preserves positive-holder filtering, the even-sample median and exact means',()=>{
 const d=defaults('debtPopulation');
 for(let holders=0;holders<=100;holders++){
  const p=toyDebtPopulation({...d,holders});assert.equal(p.values.length,100);assert.equal(p.values.filter(x=>x>0).length,holders);near(p.total,holders*d.balance);near(p.mean,holders*d.balance/100);
  near(p.median,holders<50?0:holders===50?d.balance/2:d.balance);assert.equal(p.holderMedian,holders?d.balance:null);assert.equal(p.nonholders+holders,100);
 }
 const p=toyDebtPopulation(d);near(p.median,0);near(p.mean,4000);near(p.holderMedian,10000);
});
test('official source estimates retain all supplied confidence bounds and remain fixed under toy edits',()=>{
 assert.equal(debt2023.rows.length,5);const vectors=[];
 for(const row of debt2023.rows)for(const key of ['holding','median']){const s=row[key];assert.ok(s.lower<=s.value&&s.value<=s.upper);assert.equal(s.observations.length,3);vectors.push(...s.observations.map(x=>x.VECTOR));}
 assert.equal(new Set(vectors).size,30);
 const original=planningResult('debtPopulation'),changed=planningResult('debtPopulation',{holders:100,balance:100000});assert.deepEqual(original.charts.slice(0,2),changed.charts.slice(0,2));
 const empty=planningResult('debtPopulation',{holders:0,balance:10000});assert.equal(empty.metrics[1][1],null);assert.match(renderResult(empty),/Unavailable/);
});
test('interval bars expose the point estimate and both confidence bounds with readable uncertainty semantics',()=>{
 const result=planningResult('debtPopulation');
 for(const width of [300,760]){
  const html=renderFigure(result.charts[1],width);assert.match(html,/Whiskers show the published lower and upper bounds/);assert.match(html,/95% CI lower/);assert.match(html,/95% CI upper/);assert.match(html,/>\$205,000<\/text>/);assert.match(html,/95% CI: \$200,000–\$215,000/);assert.doesNotMatch(html,/NaN|Infinity/);
 }
});
test('debt-statistics guide retains substantial prose, known related links and four accessible finite figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of debtDenominatorGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
 assert.equal(validInputs('debtPopulation',{...defaults('debtPopulation'),holders:40.5}),false);
});
