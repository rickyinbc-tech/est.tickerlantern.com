import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { cardMinimumPath, payRisePath, reserveRecoveryPath } from '../src/planning-habits-recovery-models.js';
import { habitsRecoveryGuides } from '../src/planning-habits-recovery-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('percentage minimum follows the independent geometric balance before its dollar floor binds',()=>{
  const input=defaults('cardMinimum'),p=cardMinimumPath(input),factor=(1+input.apr/1200)*(1-input.minimumPct/100);
  for(const row of p.rows.slice(1,13))near(row.value,input.balance*factor**row.x);
  near(p.rows[1].payment,(8000+8000*.2/12)*.03);assert.equal(p.months,212);
  for(const maintained of [false,true]){const q=cardMinimumPath(input,maintained);near(q.paid+q.remaining,input.balance+q.interest);assert.equal(q.remaining,0);}
});
test('maintained payment matches independent amortization and honours a larger minimum',()=>{
  const input=defaults('cardMinimum'),p=cardMinimumPath(input,true),r=input.apr/1200;
  const expected=Math.ceil(-Math.log(1-r*input.balance/input.fixedPayment)/Math.log(1+r));assert.equal(p.months,expected);assert.equal(p.months,36);
  assert.ok(p.rows.slice(1,-1).every(row=>row.payment===300));assert.ok(p.rows.at(-1).payment<300);
  const low={...input,fixedPayment:25};assert.deepEqual(cardMinimumPath(low,true),cardMinimumPath(low));
  const noInterest=cardMinimumPath({...input,apr:0},true);assert.equal(noInterest.months,Math.ceil(8000/300));near(noInterest.interest,0);
});
test('unfinished and empty card schedules preserve liabilities rather than inventing a payoff',()=>{
  const input={...defaults('cardMinimum'),minimumPct:1,apr:36};
  const p=cardMinimumPath(input);assert.equal(p.months,null);assert.ok(p.remaining>input.balance);assert.equal(p.rows.length,601);near(p.paid+p.remaining,input.balance+p.interest);
  const empty=cardMinimumPath({...input,balance:0});assert.equal(empty.months,0);assert.equal(empty.interest,0);assert.equal(empty.rows.length,1);
});
test('saving each annual pay-rise step reconciles to an independent triangular contribution total',()=>{
  const input=defaults('payRise'),p=payRisePath(input),years=input.years;
  const expected=12*input.netStep*input.capture/100*years*(years-1)/2;
  near(p.extraContributions,expected);near(p.extraContributions,171000);near(p.rows.at(-1).monthly,1925);
  near(p.extraContributions+p.extraSpending,12*input.netStep*years*(years-1)/2);
  near(p.annual[0].values[0],0);near(p.annual[1].values[0],900);
  near(payRisePath({...input,rate:0}).balance,input.initial+input.baseSaving*12*years+expected);
});
test('raise capture growth equals independently expanded terminal values of extra month-end deposits',()=>{
  const input=defaults('payRise');
  for(const rate of [-5,0,4,10]){
    const d={...input,rate},m=(1+rate/100)**(1/12)-1,N=12*d.years;
    let expected=0;
    for(let month=1;month<=N;month++)expected+=Math.floor((month-1)/12)*d.netStep*d.capture/100*(1+m)**(N-month);
    const p=payRisePath(d),base=payRisePath(d,0);near(p.balance-base.balance,expected);
    if(rate<0)assert.ok(expected<p.extraContributions);
  }
  const zero={...input,netStep:0};assert.deepEqual(payRisePath(zero,0),payRisePath(zero,100));
});
test('reserve bills precede contributions and unpaid amounts remain outside the account',()=>{
  const input=defaults('reserveRecovery'),p=reserveRecoveryPath(input);
  near(p.rows[3].before,800);near(p.rows[3].value,1200);near(p.rows[9].before,0);near(p.rows[9].gap,800);near(p.rows[9].value,400);
  near(p.unfunded,800);near(p.balance,6400);near(p.funded+p.unfunded,input.shockA+input.shockB);
  near(p.balance,input.cash+p.deposited-p.funded);assert.equal(p.recovery,null);
  const same={...input,shockMonthA:1,shockMonthB:1},q=reserveRecoveryPath(same);assert.equal(q.events.length,1);near(q.unfunded,4000);near(q.rows[1].value,400);
});
test('target caps deposits while preserving above-target cash and records recovery separately from unpaid bills',()=>{
  const input={...defaults('reserveRecovery'),cash:0,target:1000,monthly:1000,shockA:5000,shockMonthA:1,shockB:0},p=reserveRecoveryPath(input);
  near(p.unfunded,5000);near(p.balance,1000);near(p.deposited,1000);assert.equal(p.recovery,0);
  const full=reserveRecoveryPath({...input,cash:2000,shockA:0});near(full.balance,2000);near(full.deposited,0);assert.equal(full.recovery,0);
  const empty=reserveRecoveryPath({...input,target:0,monthly:0});near(empty.balance,0);near(empty.unfunded,5000);
});
test('article scenarios reject fractional bill months and retain full accessible charts at input boundaries',()=>{
  const kinds=['cardMinimum','payRise','reserveRecovery'];
  assert.equal(validInputs('reserveRecovery',{...defaults('reserveRecovery'),shockMonthB:3.5}),false);
  assert.equal(habitsRecoveryGuides.length,3);
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of kinds){
    const d=defaults(kind),fields=definitions[kind].fields;
    const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){assert.ok(validInputs(kind,input));const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
