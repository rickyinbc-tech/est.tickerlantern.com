import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {annualBondYield,premiumReserveDeposit,premiumBondPlan} from '../src/planning-premium-bond-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<tolerance,`${a} differs from ${b}`);

test('coupon rate, current yield and annual cash-flow yield use different parts of the premium purchase',()=>{
 const p=premiumBondPlan(defaults('premiumBond'));
 assert.equal(p.price,11000);assert.equal(p.couponCash,600);near(p.currentYield,600/11000);near(p.cashFlowYield,.047223575927171635);
 assert.ok(p.cashFlowYield<p.currentYield&&p.currentYield<.06);near(p.deposit,91.32652786531646);near(p.remainingCoupon,508.67347213468355);
});
test('the yield solver prices every positive annual cash-flow stream, including negative yields',()=>{
 for(const years of [1,10,20])for(const coupon of [0,600,1200])for(const pricePercent of [80,100,110,130]){
  const price=10000*pricePercent/100,y=annualBondYield(10000,coupon,price,years);
  let pv=10000/Math.pow(1+y,years);for(let year=1;year<=years;year++)pv+=coupon/Math.pow(1+y,year);
  near(pv,price,1e-6);assert.ok(Number.isFinite(y)&&y>-.99&&y<1);
 }
 assert.ok(annualBondYield(10000,0,13000,1)<0);assert.equal(annualBondYield(10000,100,11000,10),0);
});
test('par and zero-coupon cases match independent closed-form yield identities',()=>{
 for(const years of [1,5,20]){
  near(annualBondYield(10000,600,10000,years),.06);
  for(const price of [8000,10000,13000])near(annualBondYield(10000,0,price,years),Math.pow(10000/price,1/years)-1);
 }
});
test('equal year-end reserve deposits independently compound to the positive premium target',()=>{
 const d=defaults('premiumBond');
 for(const years of [1,10,20])for(const reinvestRate of [0,2,8])for(const pricePercent of [80,100,110,130]){
  const input={...d,years,reinvestRate,pricePercent},p=premiumBondPlan(input);let future=0;
  for(let receiptYear=1;receiptYear<=years;receiptYear++)future+=p.deposit*Math.pow(1+reinvestRate/100,years-receiptYear);
  near(p.pool,future,1e-6);near(p.pool,Math.max(0,p.price-d.face),1e-6);
  if(pricePercent<=100)assert.equal(p.deposit,0);
 }
 assert.equal(premiumReserveDeposit(10000,110,10,0),100);
});
test('a reserve that exceeds the coupon needs outside funding rather than a negative spending entitlement',()=>{
 const p=premiumBondPlan({...defaults('premiumBond'),coupon:0,years:1,pricePercent:130});
 assert.equal(p.deposit,3000);assert.equal(p.remainingCoupon,-3000);assert.equal(p.outsideNeed,3000);
 const r=planningResult('premiumBond',{...defaults('premiumBond'),coupon:0,years:1,pricePercent:130});
 near(r.charts[0].rows.reduce((sum,row)=>sum+row.value,0),-3000);assert.match(r.charts[0].note,/outside cash/);
});
test('the reserve sensitivity excludes the coupon while maturity capital includes funded reserve deposits once',()=>{
 const d=defaults('premiumBond'),r=planningResult('premiumBond'),zeroCoupon=planningResult('premiumBond',{...d,coupon:0});
 assert.deepEqual(r.charts[3],zeroCoupon.charts[3]);
 near(r.charts[2].rows[0].values.reduce((a,b)=>a+b,0),10000);near(r.charts[2].rows[1].values.reduce((a,b)=>a+b,0),11000);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++)near(r.charts[3].rows[row].values[col],premiumReserveDeposit(d.face,[100,105,110,120][row],d.years,[0,2,4,6][col]));
});
test('whole years and every input boundary produce four finite chart/table pairs',()=>{
 const d=defaults('premiumBond'),fields=definitions.premiumBond.fields;
 assert.equal(validInputs('premiumBond',{...d,years:10.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const result=planningResult('premiumBond',input);assert.equal(result.charts.length,4);
  for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
