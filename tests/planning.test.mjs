import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, planningResult, savingsPath, debtSchedule, retirementPath, earlyLossReturns, spendingSource, validInputs } from '../src/planning-models.js';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<Math.max(1,Math.abs(expected))*1e-9,`${actual} != ${expected}`);

test('savings recurrence matches an independent ordinary-annuity formula at positive, zero and negative rates',()=>{
  for(const rate of [-5,0,5,12]) {
    const input={initial:10000,monthly:500,years:30,rate},n=360,m=(1+rate/100)**(1/12)-1;
    const expected=rate===0?190000:10000*(1+m)**n+500*((1+m)**n-1)/m;
    const end=savingsPath(input).at(-1);near(end.value,expected);near(end.contributions,190000);
  }
});
test('delayed saving retains initial capital but removes the skipped deposits',()=>{
  const input={initial:10000,monthly:500,years:30,rate:5},m=1.05**(1/12)-1;
  const delayed=savingsPath(input,10).at(-1);
  near(delayed.value,10000*1.05**30+500*((1+m)**240-1)/m);
  near(delayed.contributions,130000);
  near(savingsPath({...input,years:5},10).at(-1).value,10000*1.05**5);
});
test('inflation output preserves the nominal/real identity and the zero-inflation boundary',()=>{
  const result=planningResult('inflation');near(result.metrics[0][1],3000*1.03**25);near(result.metrics[1][1],10000/1.03**25);near(result.metrics[2][1],1.05/1.03-1);
  const zero=planningResult('inflation',{...defaults('inflation'),inflation:0});near(zero.metrics[0][1],3000);near(zero.metrics[1][1],10000);near(zero.metrics[2][1],.05);
});
test('official spending categories reconcile to both published annual totals and remain separate from reserve inputs',()=>{
  assert.equal(spendingSource.rows.reduce((sum,r)=>sum+r.before,0),67125);
  assert.equal(spendingSource.rows.reduce((sum,r)=>sum+r.after,0),76750);
  assert.deepEqual(spendingSource.rows.find(r=>r.label==='Transportation'),{label:'Transportation',before:10099,after:12090});
  const original=planningResult('emergency').charts[0];
  const edited=planningResult('emergency',{...defaults('emergency'),expenses:7000,saved:50000}).charts[0];assert.deepEqual(edited,original);
});
test('reserve timing rounds up whole deposits, retains an above-target reserve, and flags a truncated horizon',()=>{
  const result=planningResult('emergency');assert.equal(result.metrics[0][1],18000);assert.equal(result.metrics[2][1],30);
  const partial=planningResult('emergency',{...defaults('emergency'),saved:3050});assert.equal(partial.metrics[2][1],30);
  const full=planningResult('emergency',{...defaults('emergency'),saved:20000});assert.equal(full.metrics[2][1],0);assert.ok(full.charts[1].series[0].rows.every(r=>r.value===20000));
  const long=planningResult('emergency',{expenses:10000,months:12,saved:0,monthly:50});assert.equal(long.metrics[2][1],2400);assert.equal(long.charts[1].series[0].rows.at(-1).x,120);assert.match(long.charts[1].note,/Only the first 120/);
});
test('debt payoff months match the independent closed form and payments reconcile with principal plus interest',()=>{
  for(const [balance,apr,payment] of [[10000,18,300],[10000,18,400],[5000,0,300],[10000,6,200]]){
    const r=apr/1200,expected=apr===0?Math.ceil(balance/payment):Math.ceil(-Math.log(1-r*balance/payment)/Math.log(1+r));
    const result=debtSchedule(balance,apr,payment);assert.equal(result.months,expected);near(result.paid,balance+result.interest);assert.equal(result.rows.at(-1).value,0);assert.ok(result.rows.every(row=>row.value>=0));
    assert.ok(result.paid<=result.months*payment+1e-6);
  }
});
test('non-reducing payments, a model-limit failure and zero debt are distinct from a completed payoff',()=>{
  for(const payment of [100,150]){const result=debtSchedule(10000,18,payment);assert.equal(result.complete,false);assert.equal(result.months,null);assert.ok(result.rows.at(-1).value>=10000);}
  const truncated=debtSchedule(10000,1,9);assert.equal(truncated.complete,false);assert.equal(truncated.months,null);
  assert.equal(debtSchedule(0,18,300).months,0);
  const result=planningResult('debt',{balance:10000,apr:18,payment:100,extra:0});assert.equal(result.metrics[2][1],null);assert.equal(result.charts[1].rows[0].values,null);
});
test('retirement ending wealth matches an independently expanded start-of-year cash-flow equation',()=>{
  const initial=500000,withdrawal=25000,inflation=2;
  for(const rates of [earlyLossReturns,[...earlyLossReturns].reverse()]){
    const product=rates.reduce((p,r)=>p*(1+r),1);
    const withdrawalFutureValue=rates.reduce((sum,_,index)=>sum+withdrawal*1.02**index*rates.slice(index).reduce((p,r)=>p*(1+r),1),0);
    const result=retirementPath(initial,withdrawal,inflation,rates);near(result.rows.at(-1).value,initial*product-withdrawalFutureValue);assert.equal(result.shortfall,0);
  }
});
test('reversed returns give equal endpoints without cash flow, while unmet spending is explicitly retained',()=>{
  const rates=earlyLossReturns,reverse=[...rates].reverse();near(retirementPath(500000,0,0,rates).rows.at(-1).value,retirementPath(500000,0,0,reverse).rows.at(-1).value);
  const result=retirementPath(100,80,0,[-.5,.5]);near(result.paid,90);near(result.shortfall,70);assert.equal(result.rows.at(-1).value,0);
});
test('all five default topics expose three charts and range-invalid inputs never produce a chart',()=>{
  for(const kind of ['savings','inflation','emergency','debt','retirement']){const result=planningResult(kind);assert.equal(result.charts.length,3);assert.equal(new Set(result.charts.map(c=>c.id)).size,3);}
  assert.equal(validInputs('debt',{...defaults('debt'),payment:NaN}),false);
  assert.throws(()=>planningResult('savings',{...defaults('savings'),rate:-100}));
});
