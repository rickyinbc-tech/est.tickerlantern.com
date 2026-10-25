import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult,validInputs } from '../src/planning-models.js';
import { creditUseCalendar } from '../src/planning-credit-use-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('combined utilization is limit weighted and differs from the mean of card percentages',()=>{
  const input=defaults('creditUse'),p=creditUseCalendar(input),individualA=input.balanceA/input.limitA,individualB=input.balanceB/input.limitB;
  near(individualA,.9);near(individualB,0);near(p.initial,.09);near(p.initial,(individualA*input.limitA+individualB*input.limitB)/(input.limitA+input.limitB));assert.notEqual(p.initial,(individualA+individualB)/2);
  near(p.headroom,9100);near(planningResult('creditUse').charts[1].rows.reduce((n,r)=>n+r.value,0),p.headroom);
});
test('opening payment and unused-limit closure are independent changes with distinct debt effects',()=>{
  const input=defaults('creditUse'),p=creditUseCalendar(input);near(p.afterOpeningPayment,.04);near(p.withoutUnusedB,.9);
  const withDebt=creditUseCalendar({...input,balanceB:100});assert.equal(withDebt.withoutUnusedB,null);
  assert.equal(planningResult('creditUse',{...input,balanceB:100}).charts[2].rows.length,2);assert.equal(planningResult('creditUse').charts[2].rows.length,3);
  near(creditUseCalendar({...input,limitB:19000}).openingDebt,p.openingDebt);
});
test('a captured reference stays unchanged after a later purchase changes the current ratio',()=>{
  const input=defaults('creditUse'),p=creditUseCalendar(input);near(p.captured,.04);near(p.ending,.07);near(p.paymentUsed,500);
  near(p.rows[9].value,.09);near(p.rows[10].value,.04);near(p.rows[14].reference,.09);near(p.rows[15].reference,.04);
  near(p.rows[20].value,.07);near(p.rows[20].reference,.04);near(p.rows[31].reference,.04);
  near(creditUseCalendar({...input,snapshotDay:7}).captured,.09);near(creditUseCalendar({...input,snapshotDay:21}).captured,.07);
});
test('same-day ordering posts purchase then credits payment then captures the observation',()=>{
  const input=defaults('creditUse'),p=creditUseCalendar({...input,payDay:20,snapshotDay:20});
  near(p.rows[20].purchase,300);near(p.rows[20].payment,500);near(p.rows[20].balanceA,700);near(p.captured,.07);
  const samePayment=creditUseCalendar({...input,snapshotDay:input.payDay});near(samePayment.captured,.04);
});
test('payment is capped at debt on its posting day and unused requests do not create credit balances',()=>{
  const input={...defaults('creditUse'),payment:5000},early=creditUseCalendar({...input,payDay:10}),late=creditUseCalendar({...input,payDay:20,snapshotDay:21});
  near(early.paymentUsed,900);near(early.ending,.03);near(late.paymentUsed,1200);near(late.ending,0);near(late.captured,0);
  assert.ok(early.rows.every(r=>r.balanceA>=0));assert.ok(late.rows.every(r=>r.balanceA>=0));
  const empty=creditUseCalendar({...input,balanceA:0,balanceB:0,newPurchase:0});near(empty.paymentUsed,0);near(empty.ending,0);
});
test('over-limit observations remain visible while unsupported zero limits are rejected',()=>{
  const input=defaults('creditUse'),p=creditUseCalendar({...input,balanceA:15000});assert.ok(p.initial>1);assert.ok(p.headroom<0);
  assert.equal(validInputs('creditUse',{...input,limitA:0}),false);
  for(const key of ['payDay','snapshotDay'])assert.equal(validInputs('creditUse',{...input,[key]:10.5}),false);
});
test('five accessible figures remain finite at individual and combined field limits',()=>{
  const kind='creditUse',d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,5);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
});
