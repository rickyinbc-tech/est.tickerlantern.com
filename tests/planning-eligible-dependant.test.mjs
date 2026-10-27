import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {schedule5,claim,zeroIncome,fullUseIncome,ccaTo,ED_2026,ED_2025,ED_STATS} from '../src/planning-eligible-dependant-models.js';
import {DTC_STATS} from '../src/planning-dtc-transfer-models.js';

const kind='eligibleDependant';
const s5=(netA,type,infirm,ownChild,netD)=>schedule5({netA,type,infirm,ownChild,netD});
test('2026 Schedule 5 parameters match CRA and the 2025 form',()=>{
 assert.equal(ccaTo,29374);assert.equal(ED_2025.ccaMax+ED_2025.ccaFrom,ED_2025.ccaTo);
 assert.equal(ED_2025.bpaMin+ED_2025.infirmAdd-ED_2025.ccaMax,ED_2025.lowBound);
 for(const k of ['infirmAdd','ccaMax','ccaFrom','bpaMax','bpaMin'])assert.ok(Math.abs(ED_2025[k]*1.02-ED_2026[k])<1,k);
 assert.equal(ED_2026.bpaMax+ED_2026.infirmAdd,19192);
 assert.deepEqual(s5(52000,1,false,true,0),{base:16452,add:0,l30400:16452,l30425:0,l30500:0,claimed:16452});
 assert.equal(s5(52000,1,false,true,6000).l30400,10452);assert.equal(s5(52000,1,false,true,16452).claimed,0);
 assert.equal(s5(220000,1,false,true,0).l30400,15639.68);assert.equal(s5(300000,1,false,true,0).l30400,14829);
});
test('infirm dependants combine line 30400 with line 30425 or line 30500',()=>{
 const p=s5(52000,3,true,false,18000);assert.deepEqual([p.l30400,p.l30425,p.claimed],[1192,7581,8773]);
 assert.equal(s5(52000,3,false,false,18000).claimed,0);assert.equal(s5(52000,3,false,false,15000).claimed,1452);
 assert.deepEqual([s5(52000,2,true,false,12000).l30400,s5(52000,2,true,false,12000).l30425],[7192,1581]);
 assert.deepEqual([s5(52000,2,true,false,0).l30400,s5(52000,2,true,false,0).l30425],[19192,0]);
 assert.equal(s5(52000,2,true,false,25000).claimed,4374);assert.equal(s5(52000,2,true,false,29374).claimed,0);
 // lines 30400 + 30425 equal the larger of line 30400 and the caregiver amount for every income
 for(let x=0;x<=40000;x+=250){const r=s5(52000,2,true,false,x);assert.equal(r.claimed,Math.max(Math.max(0,19192-x),Math.max(0,Math.min(8773,29374-x))));}
 const child=s5(52000,1,true,true,20000);assert.deepEqual([child.l30400,child.l30500,child.l30425],[0,2740,0]);
 assert.equal(s5(52000,1,true,false,0).l30400,19192);
});
test('default claimant and the article’s worked cases reconcile',()=>{
 const d=defaults(kind),r=planningResult(kind,d);
 assert.deepEqual(r.metrics.map(m=>m[1]),[16452,0,2303.28,4311.81,16452]);
 assert.deepEqual(r.charts[1].rows.map(x=>x.value),[16452,0,0,0,0,-14148.72,0]);
 assert.equal(fullUseIncome(d),36643);
 assert.equal(claim({...d,edNetA:20000,edEarnA:20000}).room,126.59);assert.equal(claim({...d,edNetA:20000,edEarnA:20000}).lost,2176.69);
 assert.equal(claim({...d,edNetA:28000,edEarnA:28000}).used,1172.9);assert.equal(claim({...d,edNetA:70000,edEarnA:70000}).used,2303.28);
 assert.equal(claim({...d,edNetD:6000}).used,1463.28);assert.equal(claim({...d,edType:3,edInfirm:1,edOwnChild:0,edNetD:18000}).used,1228.22);
 assert.equal(claim({...d,edType:2,edInfirm:1,edOwnChild:0}).credit,2686.88);
 assert.equal(zeroIncome({...d,edType:3,edInfirm:1}),29374);assert.equal(zeroIncome({...d,edType:1,edInfirm:1,edOwnChild:0}),19192);
 const grid=r.charts[3].rows.map(x=>x.values);
 assert.deepEqual(grid[0],[0,126.59,780.53,1434.47,2303.28,2303.28,2303.28]);assert.deepEqual(grid[3],[0,126.59,203.28,203.28,203.28,203.28,203.28]);assert.deepEqual(grid[4].at(-1),1228.22);
 assert.deepEqual(r.charts[4].rows.map(x=>x.values),[[16452,0,0],[16452,0,0],[10452,0,6000],[8773,0,10419],[1452,0,15000]]);
 const line=r.charts[0].series[1].rows;assert.equal(line.find(p=>p.x===20500).value,8773);assert.equal(line.find(p=>p.x===29000).value,374);assert.equal(line.at(-1).value,0);
 const used=r.charts[2].series[0].rows;for(let k=1;k<used.length;k++)assert.ok(used[k].value>=used[k-1].value-1e-9||used[k].x>181440);
});
test('CRA 2024 line 30400 statistics are internally consistent',()=>{
 const s=ED_STATS.rows.reduce((a,r)=>[a[0]+r[1],a[1]+r[2]],[0,0]);
 assert.ok(Math.abs(s[0]-ED_STATS.total[0])<=50);assert.equal(s[1],ED_STATS.total[1]);
 assert.equal(ED_STATS.rows.length,DTC_STATS.rows.length);assert.ok(ED_STATS.rows.every((r,k)=>r[0]===DTC_STATS.rows[k][0]));
 assert.equal(Math.round(ED_STATS.total[1]*1000/ED_STATS.total[0]),14937);
 assert.equal(ED_STATS.rows[0][1]+ED_STATS.rows[1][1],249420);
 assert.deepEqual(planningResult(kind,defaults(kind)).charts[5].rows.map(x=>x.value),[31.3,36.6,26.6,31.7,34.6,35.1,34.3,31.5,31.7,24.3,16.9]);
});
test('input limits, guide wiring and accessible figures remain valid',()=>{
 const d=defaults(kind),guide=planningGuides.find(g=>g.slug==='eligible-dependant-amount-single-parent-line-30400');
 assert.ok(guide);assert.ok(guide.sources.length>=9);assert.ok(guide.sections.length>=8);
 assert.equal(guide.related.length,3);assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)));
 assert.equal(planningGuides.filter(g=>g.planning===kind).length,1);
 for(const bad of [{...d,edType:4},{...d,edInfirm:.5},{...d,edType:2,edInfirm:0},{...d,edEarnA:90000,edNetA:52000},{...d,edNetD:-1},{...d,edOwnChild:2}])assert.equal(validInputs(kind,bad),false);
 for(const input of [d,{...d,edNetA:0,edEarnA:0},{...d,edNetA:300000,edEarnA:300000},{...d,edType:2,edInfirm:1,edNetD:60000},{...d,edType:3,edInfirm:1,edNetD:18000,edEarnA:0},{...d,edType:1,edInfirm:1,edOwnChild:1,edNetD:5000}]){
  assert.ok(validInputs(kind,input));const result=planningResult(kind,input),html=renderResult(result,360);
  assert.equal(result.charts.length,6);assert.equal((html.match(/<svg /g)||[]).length,6);assert.equal((html.match(/<caption>/g)||[]).length,6);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
});
