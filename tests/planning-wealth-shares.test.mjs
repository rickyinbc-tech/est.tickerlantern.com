import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { wealthSharesData as data } from '../src/planning-wealth-shares-data.js';
import { wealthShareRows } from '../src/planning-wealth-shares-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('the dated public extract preserves reviewed means, group weights and published rounded changes',()=>{
 assert.equal(data.releaseDate,'2026-04-13');assert.equal(data.retrieved,'2026-10-25');
 assert.deepEqual(data.groups.map(r=>[r.mean2024,r.mean2025,r.populationShare,r.publishedGrowthPercent]),[[79978,81650,.4,2.1],[510071,526185,.2,3.2],[1111522,1160145,.2,4.4],[3342201,3543579,.2,6]]);
 assert.deepEqual([data.allHouseholds.mean2024,data.allHouseholds.mean2025],[1024750,1078642]);
 for(const r of data.groups)assert.equal(r.mean2025-r.mean2024,r.dollarChange);
});
test('weighted means and the normalised shares reconcile independently, preserving the 20-cent rounding difference',()=>{
 const expected2025=.4*81650+.2*526185+.2*1160145+.2*3543579,p=wealthShareRows(2025);near(p.weightedMean,expected2025);near(p.weightedMean,1078641.8);near(p.roundingDifference,-.2);
 near(p.groups[0].share,32660/1078641.8);near(p.groups[3].share,708715.8/1078641.8);
 for(const year of [2024,2025]){const v=wealthShareRows(year);near(v.groups.reduce((n,r)=>n+r.share,0),1);near(v.groups.reduce((n,r)=>n+r.populationShare,0),1);}
 near(wealthShareRows(2024).roundingDifference,0);
});
test('the cumulative series contains only available group boundaries and excludes an invented 20-percent point',()=>{
 for(const year of [2024,2025]){const p=wealthShareRows(year);assert.deepEqual(p.cumulative.map(r=>r.x),[0,40,60,80,100]);near(p.cumulative[0].value,0);near(p.cumulative.at(-1).value,1);
 let sum=0;for(let i=0;i<p.groups.length;i++){sum+=p.groups[i].share;near(p.cumulative[i+1].value,sum);assert.ok(p.cumulative[i+1].value>=p.cumulative[i].value);}
 }
});
test('the year control updates the historical snapshot without turning the fixed change comparison into a forecast',()=>{
 const a=planningResult('wealthShares',{wealthReferenceYear:2024}),b=planningResult('wealthShares',{wealthReferenceYear:2025});assert.notDeepEqual(a.charts[0],b.charts[0]);assert.notDeepEqual(a.charts[2],b.charts[2]);assert.deepEqual(a.charts[3],b.charts[3]);
 near(a.metrics[0][1],1024750);near(b.metrics[0][1],1078642);assert.equal(b.charts[2].yMax,1);assert.equal(b.charts[2].series[1].dash,true);
 assert.throws(()=>wealthShareRows(2026),/dated extract/);assert.equal(validInputs('wealthShares',{wealthReferenceYear:2024.5}),false);
});
test('both source-year states render four finite accessible charts with source and uncertainty limits',()=>{
 for(const wealthReferenceYear of [2024,2025]){const r=planningResult('wealthShares',{wealthReferenceYear}),html=renderResult(r,300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/no confidence intervals/i);assert.match(html,/within-group detail unavailable/i);assert.match(html,/20%/);}
 assert.equal(defaults('wealthShares').wealthReferenceYear,2025);
});
