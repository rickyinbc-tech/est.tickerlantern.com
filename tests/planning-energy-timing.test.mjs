import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { energyShiftBill } from '../src/planning-energy-timing-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('default kWh, cents-to-CAD charges and weighted prices reconcile the complete simplified bill',()=>{
 const d=defaults('energyTiming'),p=energyShiftBill(d);near(p.totalKwh,700);near(p.moved,70);assert.deepEqual(p.before,[280,210,210]);assert.deepEqual(p.after,[210,210,280]);
 near(p.beforeEnergy,280*.2+210*.12+210*.08);near(p.beforeEnergy,98);near(p.afterEnergy,89.6);near(p.beforeBill,118);near(p.afterBill,109.6);near(p.saving,8.4);near(p.beforeWeightedCents,14);near(p.afterWeightedCents,12.8);near(p.billSavingShare,8.4/118);
});
test('every tested shift conserves all energy and moves only the chosen share of original on-peak use',()=>{
 const d=defaults('energyTiming');for(const shiftPercent of [0,1,25,50,100]){
  const p=energyShiftBill({...d,shiftPercent});near(p.after.reduce((a,b)=>a+b,0),p.totalKwh);near(p.before[0]-p.after[0],p.after[2]-p.before[2]);near(p.after[1],p.before[1]);assert.ok(p.after.every(v=>v>=0));near(p.saving,p.moved*(d.peakCents-d.offCents)/100);
 }
});
test('unchanged charges affect whole-bill percentages but cancel in the dollar saving',()=>{
 const d=defaults('energyTiming'),a=energyShiftBill(d),b=energyShiftBill({...d,fixedCharge:60});near(a.saving,b.saving);near(b.beforeBill,158);near(b.afterBill,149.6);assert.ok(b.billSavingShare<a.billSavingShare);
});
test('equal or reversed rates and zero on-peak energy do not silently enforce a saving',()=>{
 const d=defaults('energyTiming');near(energyShiftBill({...d,offCents:20}).saving,0);near(energyShiftBill({...d,offCents:30}).saving,-7);near(energyShiftBill({...d,peakKwh:0}).saving,0);near(energyShiftBill({...d,shiftPercent:0}).saving,0);
});
test('zero consumption and a zero baseline bill keep undefined ratios explicit without hiding a higher after-shift cost',()=>{
 const d=defaults('energyTiming'),zero=energyShiftBill({...d,peakKwh:0,midKwh:0,offKwh:0});assert.equal(zero.beforeWeightedCents,null);assert.equal(zero.afterWeightedCents,null);near(zero.beforeBill,20);near(zero.saving,0);
 const i={...d,midKwh:0,offKwh:0,peakCents:0,fixedCharge:0},p=energyShiftBill(i);near(p.beforeBill,0);assert.ok(p.afterBill>0);assert.equal(p.billSavingShare,null);assert.match(planningResult('energyTiming',i).note,/zero baseline bill/);assert.doesNotMatch(renderResult(planningResult('energyTiming',i),300),/NaN|Infinity|undefined/);
});
test('the bridge and bill components reconcile, while the full-range curve is independent of only the selected shift',()=>{
 const d=defaults('energyTiming'),a=planningResult('energyTiming',d),b=planningResult('energyTiming',{...d,shiftPercent:100}),p=energyShiftBill(d);
 near(a.charts[1].rows[0].values.reduce((x,y)=>x+y,0),p.beforeBill);near(a.charts[1].rows[1].values.reduce((x,y)=>x+y,0),p.afterBill);near(a.charts[2].rows.reduce((n,r)=>n+r.value,0),p.saving);assert.deepEqual(a.charts[3],b.charts[3]);assert.notDeepEqual(a.charts[0],b.charts[0]);
});
test('all field bounds render four finite accessible figures with kWh separate from currency',()=>{
 const kind='energyTiming',d=defaults(kind),variants=[d];for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs(kind,input),true);const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/kWh/);}
});
