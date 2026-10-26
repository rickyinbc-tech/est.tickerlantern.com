import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {cwb} from '../src/planning-cwb-phase-models.js';

const kind='cwbPhaseWorkers';
const close=(a,b,t=.01)=>assert.ok(Math.abs(a-b)<=t,`${a} vs ${b}`);
const h=o=>({family:0,workA:0,workB:0,other:0,deduct:0,dtc:0,...o});
test('2026 single and family boundaries match CRA amounts and section 122.7 rates',()=>{
 assert.equal(cwb(h({workA:3000})).total,0);close(cwb(h({workA:5000})).basic,540);
 close(cwb(h({workA:3000+1665/.27})).basic,1665);assert.equal(cwb(h({workA:27392})).basic,1665);
 close(cwb(h({workA:38492})).basic,0);assert.equal(cwb(h({workA:45000})).basic,0);
 close(cwb(h({family:1,workA:31251})).basic,2869);close(cwb(h({family:1,workA:31251+2869/.15})).basic,0);
 close(cwb(h({workA:1150+860/.27,dtc:1})).disability,860);close(cwb(h({workA:38495+860/.15,dtc:1})).disability,0);
 close(cwb(h({family:1,workA:50377+860/.075,dtc:2,workB:0})).disability,0);
});
test('default single worker reconciles to the worked example',()=>{
 const r=planningResult(kind,defaults(kind));
 assert.deepEqual(r.metrics.map(m=>m[1]),[30000,1273.8,300,1420,457.3]);
 assert.deepEqual(r.charts[1].rows.map(x=>x.value),[2000,-300,-280]);
 assert.deepEqual(r.charts[4].rows.map(x=>x.value),[1273.8,-816.5]);
 const marg=r.charts[2].series[0].rows;assert.equal(marg.find(x=>x.x===5000).value,-.27);assert.equal(marg.find(x=>x.x===20000).value,0);assert.equal(marg.find(x=>x.x===30000).value,.15);
});
test('deductions, second earner, disability and repayment cases behave as described',()=>{
 close(cwb(h({workA:32000,deduct:2000})).basic,1273.8);assert.equal(cwb(h({workA:30000,deduct:3000})).basic,1665);
 const fam=h({family:1,workA:28000,workB:12000});
 assert.equal(cwb(fam).total,2869);close(cwb(fam,{exemption:false}).total,1556.65);
 const gap=cwb(h({family:1,workA:28000,workB:20000})),gapNo=cwb(h({family:1,workA:28000,workB:20000}),{exemption:false});close(gap.total-gapNo.total,2507.1);
 assert.equal(cwb(h({workA:20000,dtc:1})).total,2525);
 const both=cwb(h({family:1,workA:40000,workB:20000,dtc:2}));assert.equal(both.afni,43286);close(both.basic,1063.75);assert.equal(both.disability,1720);
 const d=defaults(kind),repay=planningResult(kind,{...d,cwbWorkA:40000});assert.equal(repay.metrics[1][1],0);assert.equal(repay.metrics[4][1],-816.5);
 const plateau=planningResult(kind,{...d,cwbWorkA:15000});assert.equal(plateau.metrics[2][1],0);assert.equal(plateau.metrics[3][1],1720);
 const phaseIn=planningResult(kind,{...d,cwbWorkA:4000,cwbRaise:1000});assert.equal(phaseIn.metrics[2][1],-270);
});
test('input limits, guide wiring and accessible figures remain valid',()=>{
 const d=defaults(kind),guide=planningGuides.find(g=>g.slug==='canada-workers-benefit-phase-in-phase-out-advance-payments');
 assert.ok(guide);assert.ok(guide.sources.length>=6);assert.ok(guide.sections.length>=6);
 assert.equal(guide.related.length,3);assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)));
 for(const bad of [{...d,cwbWorkB:1000},{...d,cwbDtc:2},{...d,cwbFamily:.5},{...d,cwbDeduct:40000},{...d,cwbWorkA:-1},{...d,cwbAdvance:3000}])assert.equal(validInputs(kind,bad),false);
 for(const input of [d,{...d,cwbWorkA:0,cwbRaise:0,cwbAdvance:0,cwbOtherRate:0},{...d,cwbFamily:1,cwbWorkA:120000,cwbWorkB:120000,cwbOther:100000,cwbDtc:2,cwbRaise:30000,cwbOtherRate:60,cwbAdvance:2300},{...d,cwbFamily:1,cwbWorkA:20000,cwbWorkB:9000,cwbDtc:1}]){
  assert.ok(validInputs(kind,input));const result=planningResult(kind,input),html=renderResult(result,360);
  assert.equal(result.charts.length,6);assert.equal((html.match(/<svg /g)||[]).length,6);assert.equal((html.match(/<caption>/g)||[]).length,6);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
});
