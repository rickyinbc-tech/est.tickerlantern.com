import test from 'node:test';
import assert from 'node:assert/strict';
import {performanceFeePath} from '../src/planning-performance-fee-models.js';
import {performanceFeeGuides} from '../src/planning-performance-fee-guides.js';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);

test('loss recovery triggers annual positive-gain fees but no fee above the old high-water mark',()=>{
 const p=performanceFeePath(defaults('performanceFee'));near(p.rows[1].annual,80000);near(p.rows[1].marked,80000);
 near(p.rows[2].annualGross,100000);near(p.rows[2].annualFee,4000);near(p.rows[2].annual,96000);
 near(p.rows[2].markedGross,100000);near(p.rows[2].markedFee,0);near(p.rows[2].marked,100000);near(p.rows[2].mark,100000);
});
test('post-fee high-water marks and each path’s own capital reconcile to the default ending values',()=>{
 const p=performanceFeePath(defaults('performanceFee'));
 near(p.rows[3].markedFee,2000);near(p.rows[3].marked,108000);near(p.rows[3].mark,108000);near(p.rows[4].openingMark,108000);
 near(p.rows[4].markedFee,2160);near(p.rows[4].annualFee,2073.6);near(p.marked,116640);near(p.annual,111974.4);near(p.plain,121000);near(p.advantage,4665.6);
 near(p.markedFees,4160);near(p.annualFees,7993.6);near(p.markedGap,4360);near(p.markedSubsequentEffect,200);
});
test('the ending gap equals each actual deducted fee compounded through its own remaining gross-return periods',()=>{
 const d=defaults('performanceFee');
 for(const last of [-50,-20,0,10,40]){
  const p=performanceFeePath({...d,feeYearFour:last});
  for(const [feeKey,gapKey] of [['annualFee','annualGap'],['markedFee','markedGap']]){
   const weighted=p.rows.slice(1).reduce((sum,row,i)=>sum+row[feeKey]*p.returns.slice(i+1).reduce((factor,r)=>factor*(1+r),1),0);near(weighted,p[gapKey]);
  }
 }
 const negative=performanceFeePath({...d,feeYearFour:-20});near(negative.markedFees,2000);near(negative.markedGap,1600);near(negative.markedSubsequentEffect,-400);near(negative.rows[4].mark,108000);
 const r=planningResult('performanceFee',d);near(r.charts[3].rows.reduce((s,row)=>s+row.value,0),4360);
});
test('zero fees, zero capital, all gains and all losses retain their separate boundaries',()=>{
 const d=defaults('performanceFee'),free=performanceFeePath({...d,performanceRate:0});near(free.marked,free.plain);near(free.annual,free.plain);near(free.advantage,0);
 const zero=performanceFeePath({...d,feeCapital:0});for(const key of ['plain','annual','marked','annualFees','markedFees','advantage'])assert.equal(zero[key],0);
 const gains=performanceFeePath({...d,feeYearOne:10,feeYearTwo:10,feeYearThree:10,feeYearFour:10});near(gains.annual,100000*1.08**4);near(gains.marked,gains.annual);
 const losses=performanceFeePath({...d,feeYearOne:-20,feeYearTwo:-20,feeYearThree:-20,feeYearFour:-20});near(losses.marked,100000*.8**4);near(losses.markedFees,0);near(losses.annualFees,0);assert.ok(losses.rows.every(r=>r.mark===100000));
});
test('performance-fee prose distinguishes hypothetical contract rules, new cash flows and subsequent return effects',()=>{
 const g=performanceFeeGuides[0],prose=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,6);assert.ok(prose.replace(/<[^>]*>/g,' ').split(/\s+/).length>=900);
 assert.match(prose,/two explicitly invented annual rules/);assert.match(prose,/not label that last step as another charge/);assert.match(prose,/not principal protection/);
 for(const slug of g.related)assert.ok(planningGuides.some(x=>x.slug===slug),slug);
});
test('fee path invariants and supported edge values render five finite accessible charts',()=>{
 const kind='performanceFee',d=defaults(kind),fields=definitions[kind].fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){
  const p=performanceFeePath(input);assert.ok(p.marked>=p.annual-1e-7);assert.ok(p.plain>=p.marked-1e-7);
  for(let i=1;i<p.rows.length;i++){const r=p.rows[i];assert.ok(r.mark>=p.rows[i-1].mark);assert.ok(r.mark>=r.marked);assert.ok(r.markedFee>=0&&r.annualFee>=0);if(r.markedGross<=r.openingMark)assert.equal(r.markedFee,0);}
  for(const width of [300,760]){const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
 }
});
