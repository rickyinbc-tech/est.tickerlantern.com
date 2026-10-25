import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {wholeReinvestmentPath} from '../src/planning-whole-reinvest-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);

test('the first default purchase preserves resources while changing the location of the same CAD 50',()=>{
 const d=defaults('wholeReinvest'),w=wholeReinvestmentPath(d),f=wholeReinvestmentPath(d,true);
 near(w.rows[1].dividend,50);assert.equal(w.rows[1].bought,0);assert.equal(w.rows[1].cash,50);
 near(w.rows[1].price,250.56805860725984);near(f.rows[1].bought,.19954658338303988);
 near(w.rows[1].total,f.rows[1].total);near(w.rows[1].total,5000*Math.pow(1.05,.25));
 near(w.end.total,6347.824011252638);near(w.end.cash,40.898740854050914);assert.equal(w.end.units,24);
 near(f.end.total,6381.407812500011);near(f.end.units,24.283431455708556);
});
test('distribution and purchase steps conserve wealth and each following payout uses the new opening share count',()=>{
 for(const annualReturn of [-10,0,10])for(const distributionRate of [0,4,8])for(const fractional of [false,true]){
  const d={...defaults('wholeReinvest'),annualReturn,distributionRate},p=wholeReinvestmentPath(d,fractional),factor=Math.pow(1+annualReturn/100,.25);
  for(let i=1;i<p.rows.length;i++){
   const before=p.rows[i-1],after=p.rows[i];
   near(after.total,before.total+before.security*(factor-1));
   near(after.beforePurchase,after.total);near(after.dividend,before.units*d.price*distributionRate/400);
   near(after.units,before.units+after.bought);near(after.cash,before.cash+after.dividend-after.bought*after.price);
  }
 }
});
test('unlimited fractional reinvestment independently compounds the total-return factors for every payout schedule',()=>{
 for(const annualReturn of [-10,0,10])for(const distributionRate of [0,4,8])for(const years of [1,5]){
  const d={...defaults('wholeReinvest'),annualReturn,distributionRate,years},p=wholeReinvestmentPath(d,true);
  for(const row of p.rows){near(row.total,d.units*d.price*Math.pow(1+annualReturn/100,row.quarter/4));assert.equal(row.cash,0);}
 }
});
test('whole-share purchases retain nonnegative cash below one share and keep integer share counts at every corner',()=>{
 for(const units of [1,200])for(const price of [10,1000])for(const annualReturn of [-10,10])for(const distributionRate of [0,8])for(const years of [1,5]){
  const p=wholeReinvestmentPath({units,price,annualReturn,distributionRate,years});
  for(const row of p.rows){assert.ok(row.price>0);assert.ok(row.cash>=0&&row.cash<row.price);assert.ok(Number.isInteger(row.units)&&Number.isInteger(row.bought));}
 }
});
test('cash exposure can cushion a negative return and neither a zero return nor zero payout creates a reinvestment gain',()=>{
 const d=defaults('wholeReinvest');
 for(const rate of [-8,0,8]){
  const r=planningResult('wholeReinvest',{...d,annualReturn:rate}),gap=r.metrics[2][1];
  if(rate<0)assert.ok(gap<0);else if(rate===0)assert.equal(gap,0);else assert.ok(gap>0);
 }
 const noPayout={...d,distributionRate:0};assert.deepEqual(wholeReinvestmentPath(noPayout).rows,wholeReinvestmentPath(noPayout,true).rows);
});
test('the sensitivity normalises each equally funded comparison by its own starting investment',()=>{
 const d=defaults('wholeReinvest'),r=planningResult('wholeReinvest');assert.equal(r.charts[3].signed,true);assert.equal(r.charts[3].compactValues,false);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const input={...d,units:[5,10,20,50][row],annualReturn:[-8,0,4,8][col]},w=wholeReinvestmentPath(input),f=wholeReinvestmentPath(input,true);
  near(r.charts[3].rows[row].values[col],(f.end.total-w.end.total)/(input.units*input.price));
 }
});
test('whole starting shares, whole years and input boundaries produce four finite chart/table pairs',()=>{
 const d=defaults('wholeReinvest'),fields=definitions.wholeReinvest.fields;
 assert.equal(validInputs('wholeReinvest',{...d,units:2.5}),false);assert.equal(validInputs('wholeReinvest',{...d,years:2.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const r=planningResult('wholeReinvest',input);assert.equal(new Set(r.charts.map(c=>c.id)).size,4);
  for(const width of [300,1000]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
