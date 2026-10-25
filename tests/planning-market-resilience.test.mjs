import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { fixedCouponPrice, bondGoalPath } from '../src/planning-market-resilience-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('bond price matches an independent sum of individual cash-flow present values',()=>{
  for(const years of [0,1,10,30])for(const coupon of [0,4,10])for(const y of [0,3,6,12]){
    const face=10000,cash=face*coupon/100;
    const expected=face/(1+y/100)**years+Array.from({length:years},(_,i)=>cash/(1+y/100)**(i+1)).reduce((a,b)=>a+b,0);
    near(fixedCouponPrice(face,coupon,y,years),expected);
  }
  near(fixedCouponPrice(10000,4,4,10),10000);near(fixedCouponPrice(10000,4,6,10),8527.982589717173);
  assert.ok(fixedCouponPrice(10000,4,6,10)<fixedCouponPrice(10000,4,4,10));
});
test('bond goal accounts retain each coupon and maturity principal once, with idle cash after maturity',()=>{
  const d=defaults('bondGoal'),p=bondGoalPath(d);near(p.purchase,10000);near(p.end.coupons,1200);near(p.end.matured,0);near(p.end.value,10083.523712074455);near(p.profit,p.end.value-p.purchase);
  const matured=bondGoalPath({...d,cashYear:30});near(matured.end.value,14000);near(matured.end.market,0);near(matured.end.matured,10000);near(matured.end.coupons,4000);
  assert.ok(matured.rows.slice(10).every(row=>Math.abs(row.value-14000)<1e-7));
  const oneYear=bondGoalPath({...d,bondYears:1,cashYear:3});near(oneYear.end.value,10400);near(oneYear.end.coupons,400);
});
test('all new articles have four chart/data-table pairs and finite values across control boundaries',()=>{
  for(const [kind,key] of [['bondGoal','bondYears'],['bondGoal','cashYear']])assert.equal(validInputs(kind,{...defaults(kind),[key]:2.5}),false);
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['bondGoal']){
    const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){assert.ok(validInputs(kind,input));const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
