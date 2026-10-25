import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {unitPurchaseLedger} from '../src/planning-unit-cost-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('the original equal-cash ledger reconciles cash, units, cost and marked value',()=>{
 const p=unitPurchaseLedger(defaults('unitCost'));assert.deepEqual(p.purchases.map(r=>r.bought),[50,100,40,50]);
 near(p.totalUnits,240);near(p.totalPaid,4000);near(p.averageCost,50/3);near(p.meanPrice,18.75);near(p.endingValue,4800);near(p.gain,800);
 near(p.purchases[1].value,1500);near(p.purchases[1].paid,2000);
});
test('unit-weighted prices and the independent harmonic mean reproduce cost per unit',()=>{
 const d=defaults('unitCost');
 for(const prices of [[20,10,25,20],[1,100,1,100],[7,11,23,59],[25,25,25,25]]){
  const i={...d,unitPriceOne:prices[0],unitPriceTwo:prices[1],unitPriceThree:prices[2],unitPriceFour:prices[3]},p=unitPurchaseLedger(i);
  const harmonic=4/prices.reduce((s,x)=>s+1/x,0),weighted=p.purchases.reduce((s,r)=>s+r.price*r.bought,0)/p.totalUnits;
  near(p.averageCost,harmonic);near(p.averageCost,weighted);assert.ok(p.averageCost<=p.meanPrice+1e-9);
  near(p.purchases.reduce((s,r)=>s+r.bought/p.totalUnits,0),1);
  for(const r of p.purchases){near(r.price*r.bought,d.unitBudget);near(r.value,r.units*r.price);}
 }
});
test('flat prices produce the same price measures and zero dollar gain',()=>{
 const d=defaults('unitCost'),p=unitPurchaseLedger({...d,unitPriceOne:20,unitPriceTwo:20,unitPriceThree:20,unitPriceFour:20});
 near(p.averageCost,20);near(p.meanPrice,20);near(p.totalUnits,200);near(p.gain,0);
});
test('cash scale and uniform price scale have different unit effects but preserve the correct invariants',()=>{
 const d=defaults('unitCost'),a=unitPurchaseLedger(d),cash=unitPurchaseLedger({...d,unitBudget:3*d.unitBudget});
 near(cash.averageCost,a.averageCost);near(cash.totalUnits,3*a.totalUnits);near(cash.endingValue,3*a.endingValue);near(cash.gain,3*a.gain);
 const prices=unitPurchaseLedger({...d,unitPriceOne:2*d.unitPriceOne,unitPriceTwo:2*d.unitPriceTwo,unitPriceThree:2*d.unitPriceThree,unitPriceFour:2*d.unitPriceFour});
 near(prices.totalUnits,a.totalUnits/2);near(prices.averageCost,2*a.averageCost);near(prices.endingValue,a.endingValue);near(prices.gain,a.gain);
});
test('a low final price can buy more units and still leave a loss',()=>{
 const d=defaults('unitCost'),p=unitPurchaseLedger({...d,unitPriceFour:5});near(p.totalUnits,390);near(p.endingValue,1950);near(p.gain,-2050);
 assert.ok(p.averageCost<unitPurchaseLedger(d).averageCost);assert.ok(p.totalUnits>unitPurchaseLedger(d).totalUnits);
 const r=planningResult('unitCost',{...d,unitPriceFour:5});near(r.metrics[2][1],-2050);
});
test('supported boundaries preserve positive denominators and render four finite figures/tables',()=>{
 const d=defaults('unitCost'),fields=definitions.unitCost.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('unitCost',i));const r=planningResult('unitCost',i),p=unitPurchaseLedger(i);finite(r);assert.ok(p.totalUnits>0);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 assert.equal(validInputs('unitCost',{...d,unitPriceOne:0}),false);
});
