import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {salesTaxPath} from '../src/planning-sales-tax-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);

test('the default ledger separates the bank position, positive tax reserve and position after reserve',()=>{
 const p=salesTaxPath(defaults('salesTax'));
 assert.deepEqual(p.rows.map(r=>r.value),[5000,9900,14800,19700,21900,26800,31700]);
 assert.deepEqual(p.rows.map(r=>r.reserve),[0,900,1800,2700,900,1800,2700]);
 assert.deepEqual(p.rows.map(r=>r.afterReserve),[5000,9000,13000,17000,21000,25000,29000]);
 assert.equal(p.remitted,2700);assert.equal(p.rows[4].remittance,2700);assert.equal(p.end.receivable,0);
});
test('negative net tax remains a potential receivable and is never automatically deposited',()=>{
 const d={...defaults('salesTax'),inputTax:2000},p=salesTaxPath(d);
 assert.equal(p.remitted,0);assert.equal(p.end.value,24800);assert.equal(p.end.reserve,0);assert.equal(p.end.receivable,4200);
 assert.deepEqual(p.rows.map(r=>r.receivable),[0,700,1400,2100,2800,3500,4200]);
 assert.equal(p.end.afterReserve,p.end.value);assert.equal(p.rows[4].value-p.rows[3].value,3300);
});
test('cash and tax records reconcile independently for both positive and negative net tax',()=>{
 const d=defaults('salesTax');
 for(const outputTax of [0,400,1300,15000])for(const inputTax of [0,400,2000,15000]){
  const input={...d,outputTax,inputTax},p=salesTaxPath(input);
  near(p.end.value,input.opening+6*(input.sales+outputTax-input.costs-inputTax)-p.remitted);
  near(6*(outputTax-inputTax)-p.remitted,p.end.reserve-p.end.receivable);
  near(p.end.afterReserve+p.end.receivable,input.opening+6*(input.sales-input.costs));
 }
});
test('varying positive net tax changes the bank/reserve gap without creating operating cash income',()=>{
 const d=defaults('salesTax'),base=salesTaxPath(d),more=salesTaxPath({...d,outputTax:2000});
 assert.ok(more.end.value>base.end.value);assert.ok(more.end.reserve>base.end.reserve);assert.equal(more.end.afterReserve,base.end.afterReserve);
 const zero=salesTaxPath({...d,outputTax:0,inputTax:0});assert.equal(zero.remitted,0);assert.equal(zero.end.value,29000);assert.equal(zero.end.reserve,0);
});
test('the bank waterfall includes payments once and does not deduct the closing reserve',()=>{
 const r=planningResult('salesTax');
 near(r.charts[3].rows.reduce((sum,row)=>sum+row.value,0),r.metrics[0][1]);
 assert.equal(r.charts[3].rows.at(-1).value,-2700);assert.equal(r.metrics[1][1],2700);
 assert.match(r.charts[3].note,/not another bank payment/);assert.match(r.note,/not a calculated statutory/);
});
test('all input boundaries render four finite chart/table pairs, including missing business funding',()=>{
 const d=defaults('salesTax'),fields=definitions.salesTax.fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const result=planningResult('salesTax',input);assert.equal(result.charts.length,4);
  for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 assert.ok(salesTaxPath({...d,opening:0,sales:0,costs:100000}).end.value<0);
});
