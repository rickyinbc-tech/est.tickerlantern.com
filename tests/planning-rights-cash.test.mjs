import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {rightsCashBenchmark} from '../src/planning-rights-cash-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('default prices, entitlement and subscription cash reconcile without manufacturing a gain',()=>{
 const d=defaults('rightsCash'),p=rightsCashBenchmark(d);near(p.subscriptionPrice,6);near(p.theoreticalPrice,9.2);near(p.newUnits,25);near(p.subscriptionCash,150);
 near(p.oldValue,1000);near(p.oldAfter,920);near(p.entitlementValue,80);near(p.beforeResources,1150);near(p.exerciseResources,1150);near(p.sellResources,1150);near(p.lapseResources,1070);near(p.shortfall,0);
 near(p.oldAfter+p.entitlementValue,p.oldValue);near(p.newUnits*(p.theoreticalPrice-p.subscriptionPrice),p.entitlementValue);
});
test('independent normalized capital identity and per-old-share entitlement formula match the benchmark',()=>{
 const d=defaults('rightsCash');
 for(const units of [0,1,100,999])for(const price of [0,10,100])for(const ratio of [1,4,10])for(const discount of [0,40,100]){
  const i={...d,rightsUnits:units,rightsOldPrice:price,rightsRatio:ratio,rightsDiscount:discount,rightsCash:100000},p=rightsCashBenchmark(i);
  near((ratio+1)*p.theoreticalPrice,ratio*price+p.subscriptionPrice);
  near(p.entitlementValue,units*(price-p.subscriptionPrice)/(ratio+1));near(p.sellResources,p.beforeResources);near(p.exerciseResources,p.beforeResources);
  near(p.beforeResources-p.lapseResources,p.entitlementValue);near(p.oldAfter+p.entitlementValue,p.oldValue);
 }
});
test('insufficient outside cash omits exercise rather than inventing funding or a negative cash asset',()=>{
 const d=defaults('rightsCash'),p=rightsCashBenchmark({...d,rightsCash:100});assert.equal(p.funded,false);near(p.shortfall,50);assert.equal(p.exerciseResources,null);
 const r=planningResult('rightsCash',{...d,rightsCash:100});assert.equal(r.charts[2].rows.length,3);assert.ok(r.charts[2].rows.every(row=>!row.label.startsWith('Exercise')));near(r.metrics[2][1],50);
 assert.ok(rightsCashBenchmark({...d,rightsCash:150}).funded);near(rightsCashBenchmark({...d,rightsCash:149.99}).shortfall,.01);
 const exact=rightsCashBenchmark({...d,rightsUnits:3,rightsCash:4.5});near(exact.newUnits,.75);near(exact.subscriptionCash,4.5);assert.ok(exact.funded);
});
test('zero discount, zero holding and zero old price preserve distinct boundary meanings',()=>{
 const d=defaults('rightsCash'),noDiscount=rightsCashBenchmark({...d,rightsDiscount:0});near(noDiscount.theoreticalPrice,d.rightsOldPrice);near(noDiscount.entitlementValue,0);near(noDiscount.lapseResources,noDiscount.beforeResources);
 const none=rightsCashBenchmark({...d,rightsUnits:0});near(none.subscriptionCash,0);near(none.entitlementValue,0);near(none.exerciseResources,d.rightsCash);
 const zeroPrice=rightsCashBenchmark({...d,rightsOldPrice:0});near(zeroPrice.theoreticalPrice,0);near(zeroPrice.subscriptionCash,0);near(zeroPrice.entitlementValue,0);near(zeroPrice.sellResources,d.rightsCash);
 const free=rightsCashBenchmark({...d,rightsDiscount:100,rightsCash:0});near(free.subscriptionCash,0);assert.ok(free.funded);near(free.exerciseResources,free.beforeResources);
});
test('holding and price scaling alter dollars while the theoretical per-share price has the right basis',()=>{
 const d=defaults('rightsCash'),a=rightsCashBenchmark(d),twice=rightsCashBenchmark({...d,rightsUnits:200,rightsCash:300}),price=rightsCashBenchmark({...d,rightsOldPrice:20,rightsCash:300});
 near(twice.subscriptionCash,2*a.subscriptionCash);near(twice.entitlementValue,2*a.entitlementValue);near(twice.exerciseResources,2*a.exerciseResources);near(twice.theoreticalPrice,a.theoreticalPrice);
 near(price.theoreticalPrice,2*a.theoreticalPrice);near(price.entitlementValue,2*a.entitlementValue);
});
test('value bridge excludes outside cash and sensitivity rows replace only discount and ratio',()=>{
 const d=defaults('rightsCash'),r=planningResult('rightsCash',d),p=rightsCashBenchmark(d);
 near(r.charts[1].rows.reduce((sum,row)=>sum+row.value,0),p.oldValue);assert.ok(r.charts[1].rows[1].value<0);
 [0,20,40,60].forEach((discount,j)=>[2,4,5,10].forEach((ratio,k)=>near(r.charts[3].rows[j].values[k],rightsCashBenchmark(d,discount,ratio).entitlementValue)));
 assert.deepEqual(r.charts[3],planningResult('rightsCash',{...d,rightsCash:0,rightsRatio:10,rightsDiscount:100}).charts[3]);
});
test('whole holdings/ratios and supported limits render four finite accessible figures/tables',()=>{
 const d=defaults('rightsCash'),fields=definitions.rightsCash.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('rightsCash',i));const r=planningResult('rightsCash',i);finite(r);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 for(const key of ['rightsUnits','rightsRatio'])assert.equal(validInputs('rightsCash',{...d,[key]:1.5}),false);
});
