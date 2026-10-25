import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { wealthChoiceGuides } from '../src/planning-wealth-choice-guides.js';
import { employerCash, purchasePath } from '../src/planning-wealth-choice-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('loan payment, interest and terminal savings reconcile to independent annuity formulas',()=>{
  const d=defaults('purchaseFinance'),p=purchasePath(d,true),q=purchasePath(d),r=d.apr/1200,n=d.financeMonths;
  const payment=d.price*r/(1-(1+r)**(-n));near(p.payment,payment);near(p.interest,payment*n-d.price);near(p.debt,0);near(p.paid,d.price+p.interest);
  const c=(1+d.cashRate/100)**(1/12),annuity=((c**n-1)/(c-1));
  near(p.cash,(d.cash-d.fee)*c**n+(d.budget-payment)*annuity);
  near(q.cash,(d.cash-d.price*(1-d.discount/100))*c**n+d.budget*annuity);
  near(q.minCash,5300);assert.equal(p.fundingGap,0);assert.equal(q.fundingGap,0);
  near(planningResult('purchaseFinance',d).metrics[1][1],979.1335361764253);
});
test('zero-rate finance can still cost a fee and lost discount while equal free financing reconciles',()=>{
  const d={...defaults('purchaseFinance'),apr:0,cashRate:0},p=purchasePath(d,true);near(p.payment,d.price/d.financeMonths);near(p.interest,0);
  near(planningResult('purchaseFinance',d).metrics[1][1],450);
  const free={...d,fee:0,discount:0};near(purchasePath(free,true).cash,purchasePath(free).cash);
  const results=planningResult('purchaseFinance',{...d,cash:0,budget:0});assert.equal(results.metrics[2][1],null);assert.match(results.metrics[2][3],/Funding needed/);
});
test('payment-date gaps remain visible even when a later budget restores positive cash',()=>{
  const d={...defaults('purchaseFinance'),cash:100,price:1000,fee:0,apr:0,financeMonths:3,budget:1000,cashRate:0,reserve:0};
  const p=purchasePath(d,true);near(p.rows[1].before,100-1000/3);assert.ok(p.rows[1].value>0);near(p.fundingGap,1000/3-100);
  const cash=purchasePath({...d,cash:0});assert.ok(cash.fundingGap>0);
  const repaired=purchasePath({...d,cash:d.cash+p.fundingGap},true);near(repaired.fundingGap,0);
});
test('both guides retain finite accessible charts and reject fractional schedule months',()=>{
  assert.equal(wealthChoiceGuides.length,2);
  for(const kind of ['purchaseFinance']) {
    const key=kind==='stagedEntry'?'stageMonths':'financeMonths';assert.equal(validInputs(kind,{...defaults(kind),[key]:3.5}),false);
  }
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const kind of ['employerRisk','purchaseFinance']){
    const d=defaults(kind),fields=definitions[kind].fields;
    const cases=[d,...fields.flatMap(([k,,,min,max])=>[{...d,[k]:min},{...d,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
    for(const input of cases){assert.ok(validInputs(kind,input));const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});

test('employer-share loss and lost pay remain distinct, with bills before income',()=>{
  const d=defaults('employerRisk'),hold=employerCash(d),sell=employerCash(d,true);
  near(hold.shareValue,36000);near(sell.saleCash,32400);near(hold.unfunded,10000);near(sell.unfunded,0);
  near(hold.rows[7].gap,3000);near(hold.paid+hold.unfunded,12*d.essentials);
  for(const p of [hold,sell])near(p.cash,d.cash+p.saleCash+p.income-p.paid);
  assert.equal(employerCash({...d,shareFall:100},true).saleCash,0);
  assert.deepEqual(employerCash({...d,netSalePct:0},true).rows,hold.rows);
  assert.equal(validInputs('employerRisk',{...d,interruptionMonths:3.5}),false);
});
