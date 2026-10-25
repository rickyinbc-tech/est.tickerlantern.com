import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {percentageDeductibleShare} from '../src/planning-percentage-deductible-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('insured-value percentage defaults produce a 12000 household portion and a 4000 reserve gap',()=>{
 const p=percentageDeductibleShare(defaults('percentageDeductible'));near(p.threshold,12000);near(p.owner,12000);near(p.insurer,28000);near(p.reserveUsed,8000);near(p.gap,4000);near(p.lossBasedOwner,800);near(p.flatOwner,2000);
});
test('small losses never incur a household amount greater than the accepted damage',()=>{
 const d=defaults('percentageDeductible');for(const [damage,owner,insurer] of [[0,0,0],[5000,5000,0],[12000,12000,0],[20000,12000,8000],[200000,12000,188000]]){
  const p=percentageDeductibleShare(d,damage);near(p.owner,owner);near(p.insurer,insurer);near(p.owner+p.insurer,damage);assert.ok(p.owner<=damage);assert.ok(p.gap>=0);
 }
});
test('changing only the insured basis changes its threshold without changing the loss-based countercase',()=>{
 const d=defaults('percentageDeductible'),a=percentageDeductibleShare(d),b=percentageDeductibleShare({...d,insuredBase:800000});near(b.threshold,16000);near(b.owner,16000);near(b.gap,8000);near(b.lossBasedOwner,a.lossBasedOwner);near(b.flatOwner,a.flatOwner);
 const capped=percentageDeductibleShare({...d,insuredBase:2000000,deductiblePercent:10});near(capped.threshold,200000);near(capped.owner,40000);near(capped.insurer,0);near(capped.gap,32000);
});
test('assigned cash is used only up to the household portion and never creates a negative funding gap',()=>{
 const d=defaults('percentageDeductible'),small=percentageDeductibleShare({...d,coveredDamage:5000});near(small.reserveUsed,5000);near(small.gap,0);near(d.assignedReserve-small.reserveUsed,3000);
 const noReserve=percentageDeductibleShare({...d,assignedReserve:0});near(noReserve.gap,12000);near(noReserve.reserveUsed,0);
 const noDeductible=percentageDeductibleShare({...d,deductiblePercent:0});near(noDeductible.owner,0);near(noDeductible.insurer,40000);near(noDeductible.gap,0);
});
test('each alternative formula divides the same loss without presenting them as selectable claim options',()=>{
 const d=defaults('percentageDeductible'),r=planningResult('percentageDeductible',d);for(const row of r.charts[0].rows)near(row.values.reduce((a,b)=>a+b,0),40000);
 assert.match(r.note,/not alternative deductibles the claimant may choose/);near(r.charts[2].rows.reduce((n,row)=>n+row.value,0),4000);
});
test('the loss curve includes its exact bend and the matrix retains the damage cap before reserve subtraction',()=>{
 const d=defaults('percentageDeductible'),r=planningResult('percentageDeductible',d),rows=r.charts[1].series[0].rows;near(rows.find(v=>v.x===12000).value,12000);near(rows.at(-1).value,12000);near(r.charts[3].rows[3].values[3],32000);
 const small=planningResult('percentageDeductible',{...d,coveredDamage:5000});assert.ok(small.charts[3].rows.every(row=>row.values.every(v=>v===0)));
});
test('all supported field endpoints preserve the covered-loss range and render four finite data-backed figures',()=>{
 const d=defaults('percentageDeductible'),variants=[d];for(const [key,,,min,max] of definitions.percentageDeductible.fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs('percentageDeductible',input),true);assert.ok(input.coveredDamage<=input.insuredBase);const p=percentageDeductibleShare(input);near(p.owner+p.insurer,input.coveredDamage);near(p.reserveUsed+p.gap,p.owner);const html=renderResult(planningResult('percentageDeductible',input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
});
