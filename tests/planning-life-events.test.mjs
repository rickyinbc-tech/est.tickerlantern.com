import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { installmentPayment, carOwnership, retainedLoss, claimYearCost, breakFunding } from '../src/planning-life-events-models.js';
import { renderFigure } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('car installment uses nominal monthly interest and matches an independent present-value formula',()=>{
  for(const rate of [0,6,20]){
    const principal=31200,n=60,r=rate/1200;
    near(installmentPayment(principal,rate,n),r===0?principal/n:principal/((1-(1+r)**-n)/r));
  }
  assert.equal(installmentPayment(0,6,60),0);
});
test('car debt at an early exit and total ownership cost match independent balance and economic-cost identities',()=>{
  const input={...defaults('car'),years:3,loanYears:8},p=carOwnership(input),r=input.rate/1200,n=input.years*12;
  const expectedDebt=p.principal*(1+r)**n-p.payment*((1+r)**n-1)/r;
  near(p.end.debt,expectedDebt);
  near(p.interest,p.paid-p.principal+expectedDebt);
  near(p.running,12*input.operating*((1+input.inflation/100)**input.years-1)/(input.inflation/100));
  near(p.cost,input.value-p.end.value+input.costs+p.interest+p.running);
  near(p.end.value,input.value*.85**3);
});
test('zero-interest ownership cost is independent of principal-payment timing after settling debt at sale',()=>{
  const input={...defaults('car'),rate:0,years:3};
  const short=carOwnership({...input,loanYears:2}),long=carOwnership({...input,loanYears:8});
  assert.equal(short.end.debt,0);assert.ok(long.end.debt>0);near(short.cost,long.cost);
  near(short.paid+short.end.debt,short.principal);near(long.paid+long.end.debt,long.principal);
});
test('car cash purchase, negative equity and the waterfall retain acquisition costs and liabilities once',()=>{
  const input=defaults('car'),cash=carOwnership({...input,down:100});
  assert.equal(cash.payment,0);assert.equal(cash.interest,0);assert.equal(cash.end.debt,0);
  near(cash.down,input.value+input.costs);
  const stress=carOwnership({...input,down:0,rate:10,loanYears:8,depreciation:35,years:1});assert.ok(stress.equity<0);
  const result=planningResult('car');near(result.charts[2].rows.reduce((sum,r)=>sum+r.value,0),result.metrics[1][1]);
});
test('deductible share is capped by the covered loss and household plus insurer portions reconcile',()=>{
  for(const loss of [0,300,500,5000])for(const deductible of [0,500,1500]){
    const own=retainedLoss(loss,deductible);assert.ok(own<=loss&&own<=deductible&&own>=0);near(own+(loss-own),loss);
  }
  assert.equal(retainedLoss(300,500),300);
  const result=planningResult('deductibles');result.charts[2].rows.forEach(r=>near(r.values[0]+r.values[1],5000));
});
test('annual deductible cost responds to selected claim count and preserves reversed policy rankings',()=>{
  near(claimYearCost(1200,500,5000,1),1700);near(claimYearCost(900,1500,5000,1),2400);
  const input=defaults('deductibles'),none=planningResult('deductibles',{...input,claims:0}),one=planningResult('deductibles',input);
  assert.ok(none.metrics[1][1]<none.metrics[0][1]);assert.ok(one.metrics[1][1]>one.metrics[0][1]);
  assert.deepEqual(none.metrics.slice(0,2).map(r=>r[1]),[1200,900]);near(one.metrics[2][1],500);
  assert.equal(planningResult('deductibles',{...input,cash:2000}).metrics[2][1],0);
});
test('planned work break counts temporary payments only while available and solves the pre-break saving requirement',()=>{
  const p=breakFunding(defaults('careerBreak'));near(p.required,18000);near(p.gap,3000);near(p.monthly,250);near(p.temporaryTotal,9000);
  assert.equal(p.budget[5].income,4000);assert.equal(p.budget[6].income,2500);
  near(p.positions.at(-1).value,-18000);
  const result=planningResult('careerBreak');near(result.charts[2].rows.reduce((sum,r)=>sum+r.value,0),3000);
});
test('work-break reserve covers an early upfront need even when later income creates an end-period surplus',()=>{
  const input={...defaults('careerBreak'),expenses:0,income:2000,temporary:0,upfront:3000,saved:0},p=breakFunding(input);
  near(p.required,3000);assert.ok(p.positions.at(-1).value>0);
  assert.ok(p.positions.every(r=>p.required+r.value>=-1e-8));
  assert.ok(p.positions.some(r=>p.required-.01+r.value<0));
  assert.equal(breakFunding({...input,saved:5000}).gap,0);
});
test('work-break preparation horizon and payment duration alter separate parts of the plan',()=>{
  const input=defaults('careerBreak'),base=breakFunding(input),longerPrep=breakFunding({...input,prepareMonths:24});
  near(longerPrep.required,base.required);near(longerPrep.monthly,base.monthly/2);
  const short=breakFunding({...input,months:3,paidMonths:24});near(short.temporaryTotal,4500);
  const none=breakFunding({...input,paidMonths:0});near(none.temporaryTotal,0);assert.ok(none.required>base.required);
});
test('all life-event topics have four finite figures and require whole counts',()=>{
  for(const kind of ['car','deductibles','careerBreak']){
    const result=planningResult(kind);assert.equal(result.charts.length,4);assert.equal(new Set(result.charts.map(c=>c.id)).size,4);
    for(const chart of result.charts)assert.doesNotMatch(renderFigure(chart,300),/NaN|Infinity|undefined/);
  }
  for(const [kind,key] of [['car','loanYears'],['deductibles','claims'],['careerBreak','paidMonths'],['careerBreak','prepareMonths']])assert.equal(validInputs(kind,{...defaults(kind),[key]:2.5}),false);
  assert.match(renderFigure(planningResult('careerBreak').charts[0],300),/H[\d.]+V[\d.]+/);
});
