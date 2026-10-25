import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {priceCutPlan} from '../src/planning-price-cut-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('price-cut defaults allow higher revenue with lower contribution and surplus',()=>{
 const p=priceCutPlan(defaults('priceCut'));near(p.unitCost,60);near(p.newPrice,80);near(p.originalMargin,40);near(p.newMargin,20);near(p.originalRevenue,10000);near(p.newRevenue,12000);near(p.originalVariable,6000);near(p.newVariable,9000);near(p.originalSurplus,1500);near(p.newSurplus,500);near(p.difference,-1000);assert.equal(p.requiredUnits,200);assert.equal(p.withinCapacity,false);
});
test('same-revenue, operating break-even and original-surplus targets are independently distinguishable',()=>{
 const d=defaults('priceCut'),sameRevenue=priceCutPlan({...d,discountUnits:125}),preserve=priceCutPlan({...d,discountUnits:200});near(sameRevenue.newRevenue,10000);near(sameRevenue.newSurplus,0);near(preserve.newSurplus,1500);near(preserve.newRevenue,16000);near(priceCutPlan({...d,discountUnits:180}).newSurplus,1100);
});
test('the ordered price-volume bridge reconciles without counting the interaction twice',()=>{
 const d=defaults('priceCut');for(const input of [d,{...d,discountUnits:50},{...d,cutPercent:0},{...d,cutPercent:100},{...d,fixedMonthly:50000}]){
  const p=priceCutPlan(input);near(p.originalSurplus+p.priceEffect+p.volumeEffect,p.newSurplus);near(p.newRevenue-p.newVariable-input.fixedMonthly,p.newSurplus);near(p.priceEffect+p.volumeEffect,p.difference);
 }
 const p=priceCutPlan(d);near(p.priceEffect,-2000);near(p.volumeEffect,1000);
});
test('whole-unit preservation rounds upward and is independent of unchanged fixed costs',()=>{
 const d=defaults('priceCut'),i={...d,cutPercent:13},p=priceCutPlan(i);near(p.exactUnits,4000/27);assert.equal(p.requiredUnits,149);const enough=priceCutPlan({...i,discountUnits:p.requiredUnits}),short=priceCutPlan({...i,discountUnits:p.requiredUnits-1});assert.ok(enough.newSurplus>=enough.originalSurplus);assert.ok(short.newSurplus<short.originalSurplus);assert.equal(priceCutPlan({...i,fixedMonthly:50000}).requiredUnits,149);
 assert.equal(priceCutPlan({...d,capacityUnits:200}).withinCapacity,true);
});
test('zero or negative discounted contribution has no finite recovery target for a positive baseline',()=>{
 const d=defaults('priceCut');for(const cutPercent of [40,50,100]){const p=priceCutPlan({...d,cutPercent});assert.equal(p.requiredUnits,null);assert.equal(p.withinCapacity,false);assert.match(planningResult('priceCut',{...d,cutPercent}).note,/no finite sales volume/);}
 near(priceCutPlan({...d,cutPercent:40,discountUnits:1000}).newSurplus,-2500);assert.equal(priceCutPlan({...d,baselineUnits:0,cutPercent:100}).requiredUnits,0);assert.equal(priceCutPlan({...d,cutPercent:0}).requiredUnits,100);
});
test('the rendered bridge, equality point and signed matrix agree with the baseline comparison',()=>{
 const d=defaults('priceCut'),r=planningResult('priceCut',d);near(r.charts[1].rows.reduce((n,row)=>n+row.value,0),500);near(r.charts[2].series[0].rows.find(v=>v.x===200).value,1500);near(r.charts[3].rows.find(v=>v.label==='200 units').values[2],0);near(r.charts[3].rows.find(v=>v.label==='150 units').values[2],-1000);
 const cap=planningResult('priceCut',{...d,discountUnits:200});assert.match(cap.note,/comparison volume itself exceeds/);
});
test('all integer unit controls and field endpoints retain four finite figures with unavailable thresholds explicit',()=>{
 const d=defaults('priceCut');for(const key of ['baselineUnits','discountUnits','capacityUnits'])assert.equal(validInputs('priceCut',{...d,[key]:1.5}),false);
 const variants=[d,{...d,cutPercent:40}];for(const [key,,,min,max] of definitions.priceCut.fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs('priceCut',input),true);const html=renderResult(planningResult('priceCut',input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
 assert.match(renderResult(planningResult('priceCut',{...d,cutPercent:40}),300),/Unavailable/);
});
