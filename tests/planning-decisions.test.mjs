import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { taxTimingValues, cppAdjustment, cppReceipts, housingComparison } from '../src/planning-decisions-models.js';
import { renderFigure } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('tax gross-up preserves equal net saving cost and equal tax rates give equal spendable results',()=>{
  for(const rate of [-5,0,10])for(const tax of [0,20,40,60]){
    const input={...defaults('taxTiming'),rate,deduction:tax,withdrawal:tax},v=taxTimingValues(input);
    near(v.deposit*(1-tax/100),input.budget);
    near(v.relief,v.deposit*tax/100);
    near(v.rrspNet,v.tfsa);
  }
});
test('tax outcome ratio and the signed reconciliation are independent of the common growth assumption',()=>{
  for(const [deduction,withdrawal] of [[20,40],[40,20],[0,60],[60,0]])for(const years of [1,40]){
    const input={...defaults('taxTiming'),deduction,withdrawal,years},v=taxTimingValues(input);
    near(v.rrspNet/v.tfsa,(1-withdrawal/100)/(1-deduction/100));
    const result=planningResult('taxTiming',input);
    near(result.charts[2].rows.reduce((n,r)=>n+r.value,0),v.rrspNet-v.tfsa);
  }
});
test('CPP age adjustments match official endpoint factors and the age-65 baseline',()=>{
  near(cppAdjustment(60),.64);near(cppAdjustment(65),1);near(cppAdjustment(70),1.42);
  near(cppAdjustment(64),.928);near(cppAdjustment(66),1.084);
});
test('CPP discounted month-end receipts match an independent deferred-annuity formula',()=>{
  for(const start of [60,65,70])for(const end of [70,90,100])for(const discount of [0,2,6]){
    const m=(1+discount/100)**(1/12)-1,n=(end-start)*12,delay=(start-60)*12,payment=1000*cppAdjustment(start);
    const expected=discount===0?payment*n:payment*(1-(1+m)**-n)/m/(1+m)**delay;
    near(cppReceipts(1000,start,end,discount),expected);
  }
});
test('CPP starts with no receipts, counts a full year at the next birthday, and crosses later without discounting',()=>{
  near(cppReceipts(1000,70,70),0);near(cppReceipts(1000,70,71),17040);
  near(cppReceipts(1000,65,70),60000);
  assert.ok(cppReceipts(1000,70,81)<cppReceipts(1000,65,81));
  assert.ok(cppReceipts(1000,70,82)>cppReceipts(1000,65,82));
});
test('rent-buy comparison with no interest, costs or growth conserves cash in either cost-advantage direction',()=>{
  for(const rent of [500,3000]){
    const input={...defaults('rentBuy'),rate:0,carry:0,buyCosts:0,sellCosts:0,appreciation:0,investment:0,rentGrowth:0,rent};
    const p=housingComparison(input),n=input.years*12,initialDebt=input.price*(1-input.down/100),payment=initialDebt/300;
    near(p.end.debt,initialDebt-payment*n);
    near(p.end.ownerPortfolio,Math.max(0,rent-payment)*n);
    near(p.end.renter,p.capital+Math.max(0,payment-rent)*n);
    near(p.end.owner-p.end.renter,rent*n);
  }
});
test('rent-buy portfolio balances and mortgage balance match independent closed forms at a constant housing budget',()=>{
  for(const rent of [500,5000]){
    const input={...defaults('rentBuy'),carry:0,appreciation:0,rentGrowth:0,rent},p=housingComparison(input);
    const m=(1+input.rate/200)**(1/6)-1,ir=(1+input.investment/100)**(1/12)-1,n=input.years*12;
    const principal=input.price*(1-input.down/100),pay=principal*m/(1-(1+m)**-300),factor=((1+ir)**n-1)/ir;
    const debt=principal*(1+m)**n-pay*((1+m)**n-1)/m;
    near(p.end.debt,debt);
    near(p.end.renter,p.capital*(1+ir)**n+Math.max(0,pay-rent)*factor);
    near(p.end.ownerPortfolio,Math.max(0,rent-pay)*factor);
    near(p.end.owner,input.price*(1-input.sellCosts/100)-debt+p.end.ownerPortfolio);
  }
});
test('rent-buy starting capital includes purchase costs while owner exit proceeds include sale costs once',()=>{
  const input=defaults('rentBuy'),p=housingComparison(input),result=planningResult('rentBuy',input);
  near(p.capital,132000);near(p.rows[0].owner,96000);near(p.rows[0].renter,132000);
  near(result.charts[2].rows.reduce((s,r)=>s+r.value,0),p.end.owner-p.end.renter);
  near(p.end.owner,360031.7771397984);near(p.end.renter,287564.1242706028);
});
test('housing losses remain signed and CPP age axes use their explicit minimum',()=>{
  const input={...defaults('rentBuy'),rate:10,appreciation:-5,rent:500,carry:5},p=housingComparison(input);
  assert.ok(p.end.owner<0);
  const chart=planningResult('rentBuy',input).charts[0];
  const html=renderFigure(chart,300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/-\$/);
  const cpp=planningResult('cppTiming').charts[1];assert.equal(cpp.xMin,60);assert.equal(cpp.series[0].rows[0].x,60);
});
test('all decision scenarios expose four figures, with whole ages required and finite boundaries',()=>{
  for(const kind of ['taxTiming','cppTiming','rentBuy']){
    const result=planningResult(kind);assert.equal(result.charts.length,4);
    assert.equal(new Set(result.charts.map(c=>c.id)).size,4);
    for(const c of result.charts)assert.doesNotMatch(renderFigure(c,300),/NaN|Infinity|undefined/);
  }
  assert.equal(validInputs('cppTiming',{...defaults('cppTiming'),age:80.5}),false);
});
