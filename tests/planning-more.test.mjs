import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { mortgageMonthlyRate, mortgagePayment, mortgageProjection, fundingNeed, educationFunding } from '../src/planning-more-models.js';
import { renderFigure } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('mortgage payment matches a present-value annuity with semi-annual quoted-rate conversion',()=>{
  for(const quoted of [0,4,6,12]){
    const m=(1+quoted/200)**(1/6)-1;
    near((1+m)**12,(1+quoted/200)**2);
    near(mortgageMonthlyRate(quoted),m);
    const payment=quoted===0?400000/240:400000/((1-(1+m)**-240)/m);
    near(mortgagePayment(400000,quoted,240),payment);
  }
});
test('renewal uses the independently calculated balance after 60 payments and retains the payoff date',()=>{
  const input=defaults('mortgage'),m=(1+input.rate/200)**(1/6)-1;
  const payment=input.balance*m/(1-(1+m)**(-input.years*12));
  const at60=input.balance*(1+m)**60-payment*((1+m)**60-1)/m;
  const r=(1+input.renewal/200)**(1/6)-1;
  const renewed=mortgageProjection(input,true);
  near(renewed.renewalBalance,at60);
  near(renewed.renewalPayment,at60*r/(1-(1+r)**(-((input.years-5)*12))));
  assert.equal(renewed.rows.at(-1).x,input.years);assert.equal(renewed.rows.at(-1).value,0);
  near(renewed.periods[0].principal,input.balance-at60);
  near(renewed.periods[0].principal+renewed.periods[0].interest,payment*60);
  near(renewed.periods[1].principal+renewed.periods[1].interest,renewed.renewalPayment*60);
});
test('zero and unchanged renewal rates produce complete nonnegative amortization schedules',()=>{
  for(const rate of [0,4,12]){
    const input={...defaults('mortgage'),rate,renewal:rate,years:10};
    const base=mortgageProjection(input),renew=mortgageProjection(input,true);
    near(base.firstPayment,renew.renewalPayment);
    base.rows.forEach((row,i)=>{near(row.value,renew.rows[i].value);assert.ok(row.value>=0);});
    near(renew.periods.reduce((sum,p)=>sum+p.principal,0),input.balance);
  }
});
test('protection present value matches an independent growing-annuity formula including equal rates',()=>{
  for(const [inflation,discount] of [[2,3],[3,3],[0,0],[0,6],[6,0]]){
    const input={gap:40000,years:20,inflation,discount,immediate:50000},g=inflation/100,d=discount/100;
    const pv=g===d?input.gap*input.years/(1+d):input.gap/(d-g)*(1-((1+g)/(1+d))**input.years);
    const result=fundingNeed(input);near(result.incomePV,pv);near(result.total,pv+50000);
    near(result.rows.at(-1).value,40000*(1+g)**19);
  }
});
test('protection surplus is preserved in the waterfall while the additional gap has a zero floor',()=>{
  const input={...defaults('protection'),gap:0,immediate:0,assets:100000,cover:300000};
  const result=planningResult('protection',input);
  assert.equal(result.metrics[2][1],0);
  near(result.charts[1].rows.reduce((s,r)=>s+r.value,0),-400000);
  assert.ok(result.charts[3].rows.every(r=>r.values.every(v=>v===0)));
});
test('education required saving funds the whole dated cost reserve at positive, zero and negative returns',()=>{
  for(const rate of [-5,0,4,10]){
    const input={...defaults('education'),rate},plan=educationFunding(input);
    const expectedTarget=input.cost*(1+input.inflation/100)**input.years*((1+input.inflation/100)**input.study-1)/(input.inflation/100);
    near(plan.target,expectedTarget);
    const n=input.years*12,m=(1+rate/100)**(1/12)-1;
    const terminal=rate===0?input.initial+plan.required*n:input.initial*(1+m)**n+plan.required*((1+m)**n-1)/m;
    near(terminal,expectedTarget);
    near(plan.costs[0].value,input.cost*1.03**input.years);
    near(plan.costs.at(-1).value,input.cost*1.03**(input.years+input.study-1));
  }
});
test('education zero inflation, sufficient initial capital and the funding bridge remain consistent',()=>{
  const input={...defaults('education'),inflation:0,rate:0,initial:100000},plan=educationFunding(input);
  near(plan.target,input.cost*input.study);assert.equal(plan.required,0);
  const result=planningResult('education',input);
  near(result.charts[2].rows.reduce((s,r)=>s+r.value,0),plan.target-plan.ending);
  assert.ok(plan.ending>plan.target);
});
test('net-worth components, combined stress and debt reconcile without clipping a negative balance',()=>{
  const input=defaults('networth'),result=planningResult('networth');
  assert.deepEqual(result.metrics.map(r=>r[1]),[780000,370000,410000]);
  near(result.charts[0].rows.reduce((s,r)=>s+r.value,0),410000);
  const both=result.charts[2].rows.at(-1).values;
  near(both[0]-both[1],252500);
  assert.ok(result.charts[2].rows.every(r=>r.values[1]===370000));
  const negative=planningResult('networth',{...input,home:0,investments:0,cash:0});
  near(negative.metrics[2][1],-370000);
  assert.ok(negative.charts[3].rows.every(r=>r.values.every(v=>v===-370000)));
});
test('new chart renderers retain signed totals and produce finite geometry for empty assets',()=>{
  const input={...defaults('networth'),home:0,investments:0,cash:0};
  const result=planningResult('networth',input);
  for(const width of [300,760])for(const chart of result.charts){
    const html=renderFigure(chart,width);
    assert.doesNotMatch(html,/NaN|Infinity|undefined/);
    assert.match(html,/View chart data/);
    if(chart.type==='waterfall')assert.match(html,/-\$370,000/);
    if(chart.type==='donut')assert.match(html,/No listed assets/);
  }
});
test('new topics have four figures and reject fractional calendar counts or non-finite inputs',()=>{
  for(const kind of ['mortgage','protection','education','networth']){
    const result=planningResult(kind);assert.equal(result.charts.length,4);
    assert.equal(new Set(result.charts.map(c=>c.id)).size,4);
    result.metrics.forEach(([,value])=>assert.ok(Number.isFinite(value)));
  }
  for(const [kind,key] of [['mortgage','years'],['protection','years'],['education','years'],['education','study']])assert.equal(validInputs(kind,{...defaults(kind),[key]:2.5}),false);
  assert.equal(validInputs('networth',{...defaults('networth'),cash:Infinity}),false);
});
