import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {ageAmount,pensionAmount,line7,ownBase,schedule2,spouseAmount,claimantRoom,household,zeroPoint,SCT_2026,SCT_2025,SCT_STATS} from '../src/planning-spouse-transfer-models.js';
import {DTC_STATS} from '../src/planning-dtc-transfer-models.js';

const kind='spouseTransfer';
test('2026 age, pension and Schedule 2 parameters match CRA',()=>{
 assert.equal(ageAmount(0),9208);assert.equal(ageAmount(46432),9208);assert.equal(ageAmount(60000),7172.8);assert.equal(ageAmount(107819),0);assert.equal(ageAmount(107818),.1);
 // 2025 amounts indexed by 2.0% land within CAD 1 of the 2026 figures (CRA indexes the unrounded prior amounts)
 for(const k of ['ageMax','ageFrom','firstTop','dtc'])assert.ok(Math.abs(SCT_2025[k]*1.02-SCT_2026[k])<1,k);
 assert.equal(pensionAmount(1500),1500);assert.equal(pensionAmount(4000),2000);
 assert.equal(line7(58523),58523);assert.equal(line7(60000),60685.75);
 assert.equal(ownBase(20000,0),16452);assert.equal(ownBase(12000,12000),18569.35);
 assert.equal(spouseAmount(85000,0),16452);assert.equal(spouseAmount(85000,12000),4452);assert.equal(spouseAmount(85000,20000),0);
 assert.equal(claimantRoom({ageA:true,netA:85000,pensionA:40000,earnA:0}),10558.54);assert.equal(claimantRoom({ageA:true,netA:20000,pensionA:20000,earnA:0}),0);
});
test('default couple and the article’s worked cases reconcile',()=>{
 const d=defaults(kind),r=planningResult(kind,d);
 assert.deepEqual(r.metrics.map(m=>m[1]),[7660,1072.4,0,3548,27660]);
 assert.deepEqual(r.charts[1].rows.map(x=>x.value),[9208,2000,0,0,-3548,0,-6587.6,0]);
 const dtc=household({...d,sctDtcB:1});assert.equal(dtc.transfer,18001);assert.equal(dtc.used,2520.14);assert.equal(zeroPoint({...d,sctDtcB:1}),38001);
 const none=household({...d,sctNetB:0,sctPensionB:0});assert.equal(none.transfer,9208);assert.equal(none.spouseAmt,16452);assert.equal(none.used,3592.4);
 const student=household({...d,sctAgeB:0,sctPensionB:0,sctTuitionB:8000,sctNetB:12000,sctEarnB:12000,sctAgeA:0,sctNetA:70000,sctEarnA:70000,sctPensionA:0});
 assert.deepEqual([student.transfer,student.tuitionCarry,student.spouseAmt,student.room,student.used],[5000,3000,4452,7414.52,1323.28]);
 const low=household({...d,sctNetA:20000,sctPensionA:20000});assert.equal(low.used,0);assert.equal(low.lost,1072.4);
 const grid=r.charts[4].rows.map(x=>x.values);
 assert.deepEqual(grid[0],[9208,9208,5660,0,0,0,0]);assert.deepEqual(grid[2],[19549,21549,18001,8001,0,0,0]);assert.deepEqual(grid[4],[5000,5000,1452,0,0,0,0]);
 assert.equal(schedule2({age:false,net:20000,pension:0,dtc:false,tuition:8000}).tuitionUsed,3548);
 const claimant=r.charts[3].series[0].rows;assert.equal(claimant.find(p=>p.x===26000).value,0);assert.ok(claimant.find(p=>p.x===36000).value===1072.4);assert.ok(claimant.find(p=>p.x===34000).value<1072.4);
 // pension income (and the pension amount) builds up over the first CAD 4,000, after which the transfer only falls
 const line=r.charts[0].series[0].rows;assert.equal(line[0].value,9208);assert.equal(line[4].value,11208);assert.equal(line.at(-1).value,0);
 for(let k=5;k<line.length;k++)assert.ok(line[k].value<=line[k-1].value+1e-9);
 for(const row of r.charts[2].rows)assert.ok(Math.abs(row.values.reduce((a,b)=>a+b,0)-household(d).line6)<1e-6||row.label!=='This household');
});
test('CRA 2024 line 32600 statistics are internally consistent',()=>{
 const s=SCT_STATS.rows.reduce((a,r)=>[a[0]+r[1],a[1]+r[2]],[0,0]);
 assert.equal(s[0],SCT_STATS.total[0]);assert.ok(Math.abs(s[1]-SCT_STATS.total[1])<=1);
 assert.equal(SCT_STATS.rows.length,DTC_STATS.rows.length);assert.ok(SCT_STATS.rows.every((r,k)=>r[0]===DTC_STATS.rows[k][0]));
 assert.equal(Math.round(SCT_STATS.total[1]*1000/SCT_STATS.total[0]),7122);
 assert.deepEqual(SCT_STATS.rows.map(r=>Math.round(r[2]*1000/r[1])),[7812,7586,7388,7021,6607,6625,6782,6535,6293,6169,6186]);
});
test('input limits, guide wiring and accessible figures remain valid',()=>{
 const d=defaults(kind),guide=planningGuides.find(g=>g.slug==='spouse-unused-credits-transfer-schedule-2-age-pension-disability');
 assert.ok(guide);assert.ok(guide.sources.length>=9);assert.ok(guide.sections.length>=8);
 assert.equal(guide.related.length,3);assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)));
 for(const bad of [{...d,sctAgeB:2},{...d,sctDtcB:.5},{...d,sctPensionB:21000},{...d,sctAgeB:0,sctPensionB:0},{...d,sctTuitionB:40050},{...d,sctNetA:-1}])assert.equal(validInputs(kind,bad),false);
 for(const input of [d,{...d,sctNetB:0,sctPensionB:0},{...d,sctDtcB:1,sctTuitionB:40000,sctNetB:150000,sctPensionB:0,sctEarnB:150000},{...d,sctAgeA:0,sctNetA:0,sctPensionA:0},{...d,sctNetA:300000,sctPensionA:0,sctEarnA:300000},{...d,sctAgeB:0,sctPensionB:0,sctDtcB:1}]){
  assert.ok(validInputs(kind,input));const result=planningResult(kind,input),html=renderResult(result,360);
  assert.equal(result.charts.length,6);assert.equal((html.match(/<svg /g)||[]).length,6);assert.equal((html.match(/<caption>/g)||[]).length,6);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
});
