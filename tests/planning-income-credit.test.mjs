import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { annualMatch, employerSavings, fixedLoan, consolidationPlan, incomeProfiles, incomeReserve } from '../src/planning-income-credit-models.js';
import { renderFigure } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('employer matching applies to eligible employee contributions and stops at the cap',()=>{
  near(annualMatch(60000,6,50,6),1800);near(annualMatch(60000,10,50,6),1800);
  near(annualMatch(60000,2,50,6),600);assert.equal(annualMatch(60000,0,100,6),0);assert.equal(annualMatch(60000,6,50,0),0);
});
test('workplace saving agrees with an independently expanded future value of each month-end deposit',()=>{
  for(const rate of [-5,0,4])for(const growth of [0,2]){
    const input={...defaults('employerMatch'),employee:10,rate,growth},n=input.years*12;
    const expected=Array.from({length:n},(_,i)=>input.salary*input.employee/1200*(1+growth/100)**Math.floor(i/12)*(1+rate/100)**((n-i-1)/12)).reduce((s,v)=>s+v,0);
    const ratio=input.cap/input.employee*input.match/100,result=employerSavings(input);
    near(result.own,expected);near(result.employer,expected*ratio);near(result.total,expected*(1+ratio));
    const contributions=growth===0?input.salary*input.employee/100*input.years:input.salary*input.employee/100*((1+growth/100)**input.years-1)/(growth/100);
    near(result.ownPaid,contributions);near(result.employerPaid,contributions*ratio);
  }
});
test('matching waterfall keeps contributions separate from negative growth and a zero match removes the balance difference',()=>{
  const input={...defaults('employerMatch'),rate:-5},result=planningResult('employerMatch',input);
  assert.ok(result.charts[2].rows[2].value<0);near(result.charts[2].rows.reduce((s,r)=>s+r.value,0),result.metrics[2][1]);
  const noMatch=employerSavings({...input,match:0});assert.equal(noMatch.employer,0);near(noMatch.total,noMatch.own);
});
test('fixed loan interest equals the full annuity repayment less principal at zero and positive rates',()=>{
  for(const rate of [0,10,30])for(const years of [1,7]){
    const principal=20000,n=years*12,r=rate/1200,payment=r===0?principal/n:principal*r/(1-(1+r)**-n),p=fixedLoan(principal,rate,years);
    near(p.payment,payment);near(p.paid,payment*n);near(p.interest,payment*n-principal);assert.equal(p.rows.at(-1).value,0);
  }
});
test('consolidation can reduce payments while increasing total cost and includes the financed fee once',()=>{
  const input=defaults('consolidation'),p=consolidationPlan(input);
  assert.ok(p.combined.payment<p.currentPayment);assert.ok(p.newCost>p.currentCost);
  near(p.newCost,p.combined.paid-p.principal);near(p.currentCost,p.a.paid+p.b.paid-p.principal);
  near(p.newRows[0].value,p.principal+input.fee);near(p.oldRows[0].value,p.principal);
  assert.equal(p.oldRows[24].value,0);assert.ok(p.newRows[24].value>0);assert.equal(p.newRows[60].value,0);
  const noFee=consolidationPlan({...input,fee:0});assert.ok(p.newCost-noFee.newCost>input.fee);
});
test('zero debt creates no artificial consolidation fee or loan',()=>{
  const p=consolidationPlan({...defaults('consolidation'),balanceA:0,balanceB:0,fee:5000});
  assert.equal(p.fee,0);assert.equal(p.newCost,0);assert.equal(p.currentCost,0);assert.equal(p.combined.payment,0);
  assert.ok(p.newRows.every(r=>r.value===0));
});
test('variable-income schedules preserve annual receipts and reorder the same seasonal amounts',()=>{
  for(const lowMonths of [0,6,11])for(const drop of [0,50,100]){
    const input={...defaults('variableIncome'),lowMonths,drop},profiles=incomeProfiles(input);
    profiles.forEach(p=>near(p.values.reduce((s,v)=>s+v,0),input.annual));
    assert.deepEqual(profiles[1].values,[...profiles[2].values].reverse());
  }
});
test('income timing changes the required cash buffer without changing the year-end position',()=>{
  const input=defaults('variableIncome'),profiles=incomeProfiles(input),paths=profiles.map(p=>incomeReserve(input,p.values));
  near(paths[1].required,6*(input.spending+input.goals-2500));near(paths[1].required,12000);near(paths[1].gap,2000);
  near(paths[0].required,0);near(paths[2].required,0);
  paths.forEach(p=>near(p.ending,input.buffer+input.annual-12*(input.spending+input.goals)));
  const funded=incomeReserve({...input,buffer:12000},profiles[1].values);assert.ok(funded.rows.every(r=>r.value>=0));
  const deficit={...input,annual:36000,drop:0};incomeProfiles(deficit).forEach(p=>near(incomeReserve(deficit,p.values).required,18000));
});
test('all income-credit topics have four finite charts and reject fractional duration counts',()=>{
  for(const kind of ['employerMatch','consolidation','variableIncome']){
    const result=planningResult(kind);assert.equal(result.charts.length,4);assert.equal(new Set(result.charts.map(c=>c.id)).size,4);
    for(const chart of result.charts)assert.doesNotMatch(renderFigure(chart,300),/NaN|Infinity|undefined/);
  }
  for(const [kind,key] of [['consolidation','currentYears'],['consolidation','newYears'],['variableIncome','lowMonths']])assert.equal(validInputs(kind,{...defaults(kind),[key]:2.5}),false);
});
