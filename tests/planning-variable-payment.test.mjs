import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult,validInputs } from '../src/planning-models.js';
import { variableMortgagePath } from '../src/planning-variable-payment-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
const annuityBalance=(principal,rate,payment,n)=>rate===0?principal-payment*n:principal*(1+rate)**n-payment*((1+rate)**n-1)/rate;

test('fixed and alternative payment paths share exactly the initial phase and differ after the boundary',()=>{
  const input=defaults('variableMortgage'),fixed=variableMortgagePath(input),alternate=variableMortgagePath(input,true);
  assert.deepEqual(fixed.rows.slice(0,13),alternate.rows.slice(0,13));near(fixed.rows[12].value,annuityBalance(400000,.05/12,2400,12));
  near(fixed.rows[12].charge,fixed.rows[11].value*.05/12);near(fixed.rows[13].charge,fixed.rows[12].value*.08/12);
  near(fixed.rows[13].payment,2400);near(alternate.rows[13].payment,3200);near(fixed.rows[13].charge,alternate.rows[13].charge);
});
test('negative principal allocation is charged interest not covered by cash and added to debt',()=>{
  const input=defaults('variableMortgage'),p=variableMortgagePath(input),first=p.rows[13];
  near(first.charge,2606.6367064854335);near(first.principal,-206.63670648543348);near(first.capitalized,206.63670648543348);near(first.value,p.rows[12].value-first.principal);
  near(p.capitalized,11643.9608597798);near(p.rows.slice(1).reduce((s,r)=>s+Math.max(0,-r.principal),0),p.capitalized);
  const bridge=planningResult('variableMortgage').charts[1];near(bridge.rows.reduce((s,r)=>s+r.value,0),first.principal);
});
test('full fixed-payment ledger reconciles to an independent piecewise annuity equation',()=>{
  const input=defaults('variableMortgage'),p=variableMortgagePath(input),after12=annuityBalance(400000,.05/12,2400,12);
  near(p.balance,annuityBalance(after12,.08/12,2400,48));near(p.balance,402639.4668325949);near(p.paid,144000);near(p.balance,input.principal+p.interest-p.paid);
  assert.ok(p.capitalized>p.balance-input.principal);
});
test('alternative payment changes cash commitment as well as interest and remaining debt',()=>{
  const input=defaults('variableMortgage'),fixed=variableMortgagePath(input),alternate=variableMortgagePath(input,true);
  near(alternate.paid,12*2400+48*3200);near(alternate.capitalized,0);near(alternate.balance,357559.53478053934);near(alternate.balance,input.principal+alternate.interest-alternate.paid);
  near(alternate.paid-fixed.paid,38400);near(fixed.balance-alternate.balance,alternate.paid-fixed.paid+fixed.interest-alternate.interest);
});
test('illustrative trigger covers one month of interest exactly on the chosen balance',()=>{
  const input=defaults('variableMortgage'),p=variableMortgagePath(input),debt=p.rows[input.changeAfter].value,trigger=planningResult('variableMortgage').metrics[0][1];
  near(debt*trigger/12,input.fixedPayment);near(trigger,.07365813560527827);
  const at=variableMortgagePath({...input,laterRate:trigger*100});near(at.rows[13].principal,0);
  const immediate=variableMortgagePath({...input,changeAfter:0});near(immediate.rows[1].charge,input.principal*.08/12);
});
test('zero-rate, zero-payment and repaid paths do not invent charges or collect extra payments',()=>{
  const input=defaults('variableMortgage'),paid=variableMortgagePath({...input,principal:1000,fixedPayment:600,initialRate:0,laterRate:0});
  near(paid.rows[1].value,400);near(paid.rows[2].payment,400);assert.ok(paid.rows.slice(3).every(r=>r.payment===0&&r.charge===0));near(paid.interest,0);near(paid.paid,1000);
  const frozen=variableMortgagePath({...input,principal:1000,fixedPayment:0,initialRate:0,laterRate:0});near(frozen.balance,1000);near(frozen.capitalized,0);
  const empty=planningResult('variableMortgage',{...input,principal:0});assert.equal(empty.metrics[0][3],'No debt at the change');
});
test('supported extremes preserve finite accessible figures and fractional periods are rejected',()=>{
  const kind='variableMortgage',d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  for(const key of ['changeAfter','months'])assert.equal(validInputs(kind,{...d,[key]:d[key]+.5}),false);
});
