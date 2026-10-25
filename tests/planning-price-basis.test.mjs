import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {priceBasisPlan} from '../src/planning-price-basis-models.js';
import {priceBasisGuides} from '../src/planning-price-basis-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('independent geometric-series and year-end cash recurrences verify matching present values',()=>{
 const d=defaults('consistentDiscounting');
 for(const pvNominal of [0,2,5,12])for(const pvInflation of [0,2,8])for(const pvYears of [1,10,40]){
  const p=priceBasisPlan({...d,pvNominal,pvInflation,pvYears}),q=(1+pvInflation/100)/(1+pvNominal/100),closed=d.pvAnnualCost*(Math.abs(q-1)<1e-12?pvYears:q*(1-q**pvYears)/(1-q));
  near(p.nominalPV,closed);near(p.realPV,closed);near((1+p.real)*(1+pvInflation/100),1+pvNominal/100);
  let balance=p.nominalPV;for(let year=1;year<=pvYears;year++)balance=balance*(1+pvNominal/100)-d.pvAnnualCost*(1+pvInflation/100)**year;
  assert.ok(Math.abs(balance)<Math.max(1,closed)*1e-8);
  assert.ok(p.lowError<=0&&p.highError>=0);p.rows.forEach(r=>near(r.nominalPV,r.realPV));
 }
});
test('default mismatches, zero inflation and zero real rate retain their distinct meanings',()=>{
 const d=defaults('consistentDiscounting'),p=priceBasisPlan(d);
 near(p.real,1.05/1.02-1);near(p.nominalPV,171117.35530963165);near(p.nominalCashTotal,223374.3083946523);
 near(p.wrongRealAtNominal,154434.6985836962);near(p.wrongNominalAtReal,190213.730012724);
 near(p.lowError,-16682.656725935434);near(p.highError,19096.374703092355);near(p.rows[0].nominalPV,20400/1.05);
 const noInflation=priceBasisPlan({...d,pvInflation:0});assert.equal(noInflation.lowError,0);assert.equal(noInflation.highError,0);near(noInflation.real,.05);
 const noRealDiscount=priceBasisPlan({...d,pvNominal:2});near(noRealDiscount.real,0);near(noRealDiscount.nominalPV,200000);near(noRealDiscount.realPV,200000);
 assert.ok(priceBasisPlan({...d,pvNominal:0,pvInflation:8}).real<0);
});
test('price-basis guide has substantial English prose, valid links and four finite accessible figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of priceBasisGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
 assert.equal(validInputs('consistentDiscounting',{...defaults('consistentDiscounting'),pvYears:1.5}),false);
});
