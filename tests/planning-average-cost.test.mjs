import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {averageCostPlan} from '../src/planning-average-cost-models.js';
import {averageCostGuides} from '../src/planning-average-cost-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('independent execution ledger reconciles units, three averages and the default valuation',()=>{
 const d=defaults('purchaseAverage'),p=averageCostPlan(d),quotes=[20,16,12,18,24,20],bought=[9.9,12.375,16.5,11,8.25,9.9];
 assert.deepEqual(p.rows.map(r=>r.quote),quotes);p.rows.forEach((r,i)=>near(r.bought,bought[i]));
 near(p.end.units,67.925);near(p.end.securityCash,1188);near(p.end.fees,12);near(p.end.cash,1200);
 near(p.end.arithmetic,110/6);near(p.end.weighted,4320/247);near(p.end.allIn,1200/67.925);
 near(p.marketValue,1358.5);near(p.priceChange,170.5);near(p.gain,158.5);
 const lower=averageCostPlan({...d,valuationPrice:15});near(lower.marketValue,1018.875);near(lower.gain,-181.125);
 near(lower.end.weighted,p.end.weighted);near(lower.end.allIn,p.end.allIn);
});
test('equal-net-cash harmonic identity and fee ledger hold across independent input combinations',()=>{
 const d=defaults('purchaseAverage');
 for(const purchaseCash of [50,200,2000])for(const purchaseFee of [0,2,25])for(const quoteBase of [5,20,100])for(const quoteVariation of [0,100,150]){
  const p=averageCostPlan({...d,purchaseCash,purchaseFee,quoteBase,quoteVariation}),reciprocalSum=p.rows.reduce((s,r)=>s+1/r.quote,0),harmonic=6/reciprocalSum;
  near(p.end.units,(purchaseCash-purchaseFee)*reciprocalSum);near(p.end.weighted,harmonic);near(p.end.allIn,harmonic*purchaseCash/(purchaseCash-purchaseFee));
  assert.ok(p.end.weighted<=p.end.arithmetic+1e-9);near(p.end.cash,p.end.securityCash+p.end.fees);
  near(p.rows.reduce((s,r)=>s+r.bought*r.quote,0),p.end.securityCash);
  near(p.end.cash-p.end.fees+p.priceChange,p.marketValue);
 }
 const flat=averageCostPlan({...d,quoteVariation:0});near(flat.end.arithmetic,20);near(flat.end.weighted,20);near(flat.end.allIn,20*200/198);near(flat.gain,-12);
 const free=averageCostPlan({...d,purchaseFee:0});near(free.end.allIn,free.end.weighted);
});
test('purchase-average guide retains substantial prose, valid links and four accessible finite figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of averageCostGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   const p=averageCostPlan(input);assert.ok(p.rows.every(r=>r.quote>0&&r.bought>0));near(result.charts.find(c=>c.type==='waterfall').rows.reduce((s,r)=>s+r.value,0),p.marketValue);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
 assert.equal(validInputs('purchaseAverage',{...defaults('purchaseAverage'),purchaseFee:50}),false);
});
