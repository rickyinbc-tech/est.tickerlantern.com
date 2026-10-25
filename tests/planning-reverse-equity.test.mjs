import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult,validInputs } from '../src/planning-models.js';
import { reverseEquityPath } from '../src/planning-reverse-equity-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
const cents=(a,b)=>assert.equal(Math.round(a*100),Math.round(b*100));

test('closing cash deducts fees and old-debt settlement without adding either to gross debt again',()=>{
  const input=defaults('reverseCashBridge'),p=reverseEquityPath(input);near(p.netCash,156000);near(p.rows[0].debt,200000);
  near(planningResult('reverseCashBridge').charts[0].rows.reduce((n,r)=>n+r.value,0),p.netCash);
  const before=input.reverseHome-input.reverseOldDebt,after=input.reverseHome-input.reverseAdvance+p.netCash;near(before-after,input.reverseFees);
  const gap=reverseEquityPath({...input,reverseOldDebt:500000});near(gap.netCash,-304000);near(gap.rows[0].debt,input.reverseAdvance);
});
test('capitalization reproduces independently checked high-precision decimal examples',()=>{
  const d=defaults('reverseCashBridge'),p=reverseEquityPath(d);cents(p.end.debt,569789.35);cents(p.capitalizedInterest,369789.35);cents(p.end.home,1009401.25);cents(p.selling,40376.05);cents(p.rawRemainder,399235.86);
  const other={...d,reverseAdvance:203000,reverseHome:800000,reverseGrowth:0,reverseSaleCosts:0};
  for(const [years,debt] of [[5,287777.93],[10,407961.26],[15,578336.19],[20,819863.99]])cents(reverseEquityPath(other,years).end.debt,debt);
  near(p.end.debt,inputAnnualEquivalent(d));
});
function inputAnnualEquivalent(input){return input.reverseAdvance*((1+input.reverseRate/1200)**12)**input.reverseYears;}
test('fees and old-debt payout affect initial proceeds while leaving a fixed gross-loan path unchanged',()=>{
  const d=defaults('reverseCashBridge'),base=reverseEquityPath(d),changed=reverseEquityPath({...d,reverseFees:9000,reverseOldDebt:80000});
  near(changed.netCash-base.netCash,-45000);assert.deepEqual(changed.rows,base.rows);near(changed.rawRemainder,base.rawRemainder);
});
test('zero interest keeps debt constant and property-value changes do not repay it',()=>{
  const d=defaults('reverseCashBridge'),zero=reverseEquityPath({...d,reverseRate:0});near(zero.capitalizedInterest,0);assert.ok(zero.rows.every(r=>r.debt===d.reverseAdvance));
  const flat=reverseEquityPath({...d,reverseGrowth:0}),grow=reverseEquityPath(d);near(flat.end.debt,grow.end.debt);near(flat.end.home,d.reverseHome);assert.ok(grow.end.home>flat.end.home);
  const noLoan=reverseEquityPath({...d,reverseAdvance:0});near(noLoan.end.debt,0);near(noLoan.capitalizedInterest,0);assert.ok(noLoan.netCash<0);
});
test('sale reconciliation subtracts selling costs and calculated debt once each',()=>{
  const d=defaults('reverseCashBridge'),p=reverseEquityPath(d),rows=planningResult('reverseCashBridge').charts[3].rows;near(rows.reduce((n,r)=>n+r.value,0),p.rawRemainder);near(p.netProperty,p.end.home-p.selling);
  const moreCosts=reverseEquityPath({...d,reverseSaleCosts:5});near(p.rawRemainder-moreCosts.rawRemainder,p.end.home*.01);near(moreCosts.end.debt,p.end.debt);
});
test('an arithmetic shortfall remains visible without pretending to calculate a lender guarantee',()=>{
  const d={...defaults('reverseCashBridge'),reverseHome:100000,reverseYears:30,reverseGrowth:-5},p=reverseEquityPath(d),result=planningResult('reverseCashBridge',d);
  assert.ok(p.end.debt>p.end.home);assert.ok(p.rawRemainder<0);near(p.rawRemainder,p.netProperty-p.end.debt);near(result.metrics[2][1],p.rawRemainder);
  assert.match(result.charts[3].note,/not a lender payout/);assert.match(result.charts[4].note,/before protections/);
  const grid=planningResult('reverseCashBridge').charts[4];near(grid.rows[2].values[2],reverseEquityPath({...defaults('reverseCashBridge'),reverseRate:8,reverseGrowth:2}).rawRemainder);
});
test('debt-component stacks reconcile to each independent elapsed-time balance',()=>{
  const d=defaults('reverseCashBridge'),rows=planningResult('reverseCashBridge').charts[2].rows;
  for(const [i,years] of [5,10,15,20,30].entries()){near(rows[i].values[0],d.reverseAdvance);near(rows[i].values.reduce((n,v)=>n+v,0),reverseEquityPath(d,years).end.debt);}
});
test('whole-year horizons and supported boundary scenarios retain five finite accessible charts',()=>{
  const kind='reverseCashBridge',d=defaults(kind),fields=definitions[kind].fields;assert.equal(validInputs(kind,{...d,reverseYears:1.5}),false);
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,5);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
});
