import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {bondReceiptPool,bondCallGap} from '../src/planning-callable-bond-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} differs from ${b}`);

test('a call pays the selected coupon and face value, then stops every later issuer coupon',()=>{
 const d=defaults('callableBond'),held=bondReceiptPool(d),called=bondReceiptPool(d,d.callYear);
 assert.equal(held.couponsPaid,6000);assert.equal(called.couponsPaid,1800);
 assert.equal(called.rows[3].couponPaid,600);assert.equal(called.rows[3].redemption,10000);
 assert.ok(called.rows.slice(4).every(r=>r.couponPaid===0&&r.redemption===0));assert.equal(held.rows[10].redemption,10000);
 assert.equal(called.rows.reduce((sum,r)=>sum+r.redemption,0),10000);assert.equal(held.rows.reduce((sum,r)=>sum+r.redemption,0),10000);
});
test('terminal pools match independent future-value sums for all actual issuer receipts',()=>{
 const d=defaults('callableBond');
 for(const callYear of [1,3,4,10])for(const rate of [0,2,6,10]){
  let expected=d.face*Math.pow(1+rate/100,d.bondYears-callYear);
  for(let receiptYear=1;receiptYear<=callYear;receiptYear++)expected+=d.face*d.coupon/100*Math.pow(1+rate/100,d.bondYears-receiptYear);
  near(bondReceiptPool(d,callYear,rate).total,expected);
 }
 const r=planningResult('callableBond');near(r.metrics[0][1],16569.8325998427);near(r.metrics[1][1],13596.1192468571);near(r.metrics[2][1],-2973.7133529856);
});
test('zero reinvestment isolates coupon differences and coupon-matched reinvestment equalises par-purchase endpoints',()=>{
 const d=defaults('callableBond');
 assert.equal(bondCallGap(d,3,0),-4200);
 for(const coupon of [0,2,6,12])for(const callYear of [1,2,3,4]){
  const input={...d,coupon},expected=d.face*Math.pow(1+coupon/100,d.bondYears);
  near(bondReceiptPool(input,callYear,coupon).total,expected);near(bondReceiptPool(input,input.bondYears,coupon).total,expected);assert.equal(bondCallGap(input,callYear,coupon),0);
 }
 assert.ok(bondCallGap({...d,coupon:0},3,2)>0);
});
test('the common-date waterfall reconciles coupon and reinvestment effects without a principal write-off',()=>{
 const d=defaults('callableBond');
 for(const reinvestRate of [0,2,6,10]){
  const r=planningResult('callableBond',{...d,reinvestRate});near(r.charts[2].rows.reduce((sum,row)=>sum+row.value,0),r.metrics[2][1]);
 }
 const r=planningResult('callableBond');assert.match(r.charts[1].unitLabel,/outstanding bond value excluded/);assert.match(r.charts[2].note,/not a write-off/);
});
test('the sensitivity grid replaces both call year and reinvestment return while preserving the common horizon',()=>{
 const d=defaults('callableBond'),r=planningResult('callableBond');
 for(let row=0;row<4;row++)for(let col=0;col<4;col++)near(r.charts[3].rows[row].values[col],bondReceiptPool(d,row+1,[0,2,4,6][col]).total-bondReceiptPool(d,d.bondYears,[0,2,4,6][col]).total);
 assert.ok(r.charts[3].rows.every(row=>row.values[3]===0));
});
test('call dates always precede maturity and all whole-year boundaries render four finite chart/table pairs',()=>{
 const d=defaults('callableBond'),fields=definitions.callableBond.fields;
 for(const key of ['callYear','bondYears'])assert.equal(validInputs('callableBond',{...d,[key]:d[key]+.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){assert.ok(input.callYear<input.bondYears);const result=planningResult('callableBond',input);assert.equal(result.charts.length,4);
  for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
