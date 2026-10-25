import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { depositRule, depositCoverage, refinanceLoan, refinanceComparison, separationBudget } from '../src/planning-protection-transition-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('deposit rule combines one-name accounts at a member and never transfers unused coverage between members',()=>{
  assert.equal(depositRule.limit,100000);assert.equal(depositRule.reviewed,'2026-10-25');
  const input=defaults('depositCover'),p=depositCoverage(input);near(p.now[0].value,90000);near(p.now[1].value,50000);near(p.coveredNow,140000);
  const over=depositCoverage({...input,savingsA:100000,otherA:50000,memberB:50000,years:0});near(over.coveredNow,150000);near(over.aboveFuture,50000);
  const boundary=depositCoverage({...input,savingsA:80000,otherA:20000,memberB:0,years:0});near(boundary.coveredNow,100000);near(boundary.aboveFuture,0);
});
test('retained interest is included in both the projected balance and coverage-cap comparison',()=>{
  const input=defaults('depositCover'),p=depositCoverage(input),a=90000*1.04**5,b=50000*1.04**5;
  near(p.future[0].value,a);near(p.future[1].value,b);near(p.coveredFuture,100000+b);near(p.aboveFuture,a-100000);near(p.aboveFuture,9498.761216000014);
  assert.equal(p.rows.length,61);near(p.rows[36].a,90000*1.04**3);
  for(const row of [...p.now,...p.future])near(row.covered+row.above,row.value);
  const exactCap=depositCoverage({...input,savingsA:100000/1.04**5,otherA:0,memberB:0});near(exactCap.future[0].value,100000);near(exactCap.aboveFuture,0);
});
test('zero retained interest, zero time and empty deposits preserve the intended coverage boundaries',()=>{
  const input=defaults('depositCover'),zeroTime=depositCoverage({...input,years:0});assert.deepEqual(zeroTime.future,zeroTime.now);assert.equal(zeroTime.rows.length,1);
  const noGrowth=depositCoverage({...input,rate:0,years:10});assert.deepEqual(noGrowth.future,noGrowth.now);
  const empty=depositCoverage({...input,savingsA:0,otherA:0,memberB:0});near(empty.coveredNow,0);near(empty.coveredFuture,0);near(empty.aboveFuture,0);
});
test('refinance payments, remaining debt and interest agree with independent Canadian-rate closed forms',()=>{
  const p=refinanceComparison(defaults('refinanceCost'));
  for(const [loan,rate] of [[p.current,.06],[p.proposed,.045]]){
    const r=(1+rate/2)**(1/6)-1,n=240,h=36,payment=400000*r*(1+r)**n/((1+r)**n-1);
    const debt=400000*(1+r)**h-payment*((1+r)**h-1)/r;
    near(loan.payment,payment);near(loan.debt,debt);near(loan.paid,payment*h);near(loan.interest,loan.paid-(400000-debt));
  }
  near(p.paymentRelief,327.1331449550771);near(p.cashRelief,1776.7932183827797);near(p.costAdvantage,7268.922619986966);near(p.fees,10000);
});
test('refinance cost advantage reconciles cash relief and remaining principal at every month',()=>{
  const p=refinanceComparison(defaults('refinanceCost'));near(p.current.rows[0].debt,p.proposed.rows[0].debt);
  for(let i=0;i<p.rows.length;i++)near(p.rows[i].cost,p.rows[i].cash+p.current.rows[i].debt-p.proposed.rows[i].debt);
  assert.equal(p.rows.findIndex(r=>r.cost>=0),21);assert.equal(p.rows.findIndex(r=>r.cash>=0),31);
  near(p.debtDifference,5492.129401603597);
});
test('upfront cash fees reduce both comparisons without being added to the new loan',()=>{
  const input=defaults('refinanceCost'),p=refinanceComparison(input),more=refinanceComparison({...input,closingFee:7000});
  near(p.cashRelief-more.cashRelief,5000);near(p.costAdvantage-more.costAdvantage,5000);assert.deepEqual(more.proposed,p.proposed);
  const equal=refinanceComparison({...input,newRate:input.oldRate});near(equal.paymentRelief,0);near(equal.cashRelief,-10000);near(equal.costAdvantage,-10000);
  const dearer=refinanceComparison({...input,newRate:8});assert.ok(dearer.costAdvantage<0);assert.ok(dearer.paymentRelief<0);
});
test('zero-rate payoff and no opening mortgage remain explicit at the horizon boundaries',()=>{
  const loan=refinanceLoan(60000,0,5,60);near(loan.payment,1000);near(loan.paid,60000);near(loan.interest,0);near(loan.debt,0);
  const amortized=refinanceLoan(400000,6,5,60);near(amortized.debt,0);near(amortized.paid,400000+amortized.interest);
  const empty=refinanceComparison({...defaults('refinanceCost'),balance:0});near(empty.fees,0);near(empty.cashRelief,0);near(empty.costAdvantage,0);
});
test('separate household budgets include transition outflows and pre-income shortages, even with positive monthly surpluses',()=>{
  const input=defaults('separationCash'),p=separationBudget(input);near(p.monthlyA,1000);near(p.monthlyB,500);near(p.combinedMonthly,1500);
  near(p.rows[0].a,1000);near(p.rows[0].b,-1000);near(p.rows[1].a,-3000);near(p.rows[1].b,-3500);near(p.rows[1].endA,2000);near(p.rows[1].endB,-500);near(p.rows[2].endB,0);
  near(p.requiredA,8000);near(p.requiredB,5500);near(p.extraA,3000);near(p.extraB,3500);near(p.extra,6500);near(p.endingA,13000);near(p.endingB,5000);
  near(p.endingA,input.cashA-input.setupA+12*p.monthlyA);near(p.endingB,input.cashB-input.setupB+12*p.monthlyB);
  const funded=separationBudget({...input,cashA:p.requiredA,cashB:p.requiredB});assert.ok(funded.rows.every(r=>r.a>=0&&r.b>=0));
});
test('signed transfers cancel in the combined budget while changing individual affordability symmetrically',()=>{
  const input=defaults('separationCash'),p=separationBudget(input),large=separationBudget({...input,transfer:2000});near(large.combinedMonthly,p.combinedMonthly);near(large.monthlyA,-500);near(large.monthlyB,2000);near(large.extraA,10000);
  const reverse=separationBudget({...input,incomeA:input.incomeB,incomeB:input.incomeA,costA:input.costB,costB:input.costA,setupA:input.setupB,setupB:input.setupA,cashA:input.cashB,cashB:input.cashA,transfer:-input.transfer});
  near(reverse.extraA,p.extraB);near(reverse.extraB,p.extraA);near(reverse.monthlyA,p.monthlyB);near(reverse.endingA,p.endingB);
  for(let i=0;i<p.rows.length;i++){near(reverse.rows[i].a,p.rows[i].b);near(reverse.rows[i].b,p.rows[i].a);}
});
test('the prior household budget is comparison context and is not charged again to either new cash ledger',()=>{
  const input=defaults('separationCash'),p=separationBudget(input);assert.deepEqual(separationBudget({...input,oldCost:20000}),p);
  const higher=separationBudget({...input,costA:input.costA+1000});near(p.endingA-higher.endingA,12000);near(p.endingB,higher.endingB);
});
test('deposit time and mortgage comparison periods reject fractional calendar entries',()=>{
  for(const [kind,key,value] of [['depositCover','years',1.5],['refinanceCost','months',12.5],['refinanceCost','amortYears',20.5]])assert.equal(validInputs(kind,{...defaults(kind),[key]:value}),false);
});
test('coverage, refinance and separation models retain finite accessible graphics at supported field edges',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['depositCover','refinanceCost','separationCash']){
    const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input),count=kind==='refinanceCost'?5:4;finite(result);assert.equal(result.charts.length,count);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,count);assert.equal((html.match(/<caption>/g)||[]).length,count);}}
  }
});
