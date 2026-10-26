import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {claim,taxRoom,reduction,rmes,bpa,federalTax,METC_STATS} from '../src/planning-metc-claim-models.js';

const kind='metcClaimant';
test('2026 threshold, supplement and payroll-credit parameters match CRA',()=>{
 assert.equal(reduction(26000),780);assert.equal(reduction(96333.33),2890);assert.equal(reduction(96333),2889.99);assert.equal(reduction(250000),2890);assert.equal(reduction(0),0);
 assert.equal(rmes(10000,4478,33960),1534);assert.equal(rmes(10000,4477,0),0);assert.equal(rmes(10000,4478,64640),0);assert.equal(rmes(10000,4478,64620),1);
 assert.equal(rmes(4800,40000,52000),298);assert.equal(rmes(5640,6000,52000),508);
 // 2025 parameters reproduce CRA's published CAD 63,374 supplement limit
 assert.equal(33294+1504/.05,63374);
 assert.equal(federalTax(58523),8193.22);assert.equal(bpa(181440),16452);assert.equal(bpa(258482),14829);assert.equal(bpa(219961),15640.5);
 assert.deepEqual(taxRoom(26000,20000),{gross:3640,credits:2673.41,cpp:816.75,ei:326,room:966.59});
 const hi=taxRoom(70000,70000);assert.equal(hi.cpp,3291.75);assert.equal(hi.ei,1123.07);assert.equal(hi.room,7414.52);
 assert.equal(taxRoom(100000,100000).cpp,3519.45);
});
test('default household and the article’s worked cases reconcile',()=>{
 const d=defaults(kind),r=planningResult(kind,d);
 assert.deepEqual(r.metrics.map(m=>m[1]),[735,5250,184.8,0,96333.33]);
 assert.match(r.metrics[0][0],/Person B/);
 assert.deepEqual(r.charts[0].rows.map(x=>x.values),[[550.2,0,0],[735,0,0]]);
 assert.deepEqual(r.charts[1].rows.map(x=>x.value),[4500,-780,1530,-4515,0,0]);
 const w=r.charts[3].series;assert.equal(w[0].rows[10].value,735);assert.equal(w[1].rows[10].value,625.8);assert.equal(w[1].rows[0].value,735);assert.equal(w[1].rows[20].value,735);
 assert.ok(w[1].rows.every(x=>x.value<=735));
 const low=planningResult(kind,{...d,metcNetA:40000,metcEarnA:40000,metcNetB:12000,metcEarnB:6000,metcExp:6000,metcDepExp:0,metcDepNet:0});
 assert.deepEqual(low.metrics.slice(0,3).map(m=>m[1]),[970,4800,462]);assert.match(low.metrics[0][0],/Person A/);
 assert.deepEqual(low.charts[0].rows.map(x=>x.values),[[672,298,0],[0,508,789.6]]);
 const single=planningResult(kind,{...d,metcCouple:0,metcNetA:18000,metcEarnA:9000,metcNetB:0,metcEarnB:0,metcExp:3000,metcDepExp:0,metcDepNet:0});
 assert.deepEqual(single.metrics.slice(0,4).map(m=>m[1]),[615,2460,615,344.4]);assert.equal(single.charts[0].rows.length,1);
 const top=planningResult(kind,{...d,metcNetA:150000,metcEarnA:150000,metcNetB:0,metcEarnB:0,metcDepExp:0,metcDepNet:0});
 assert.deepEqual(top.metrics.slice(0,3).map(m=>m[1]),[225.4,1610,225.4]);assert.deepEqual(top.charts[0].rows[1].values,[0,0,630]);
 const z=claim({net:50000,earn:50000,family:50000,exp:1500});assert.equal(z.total,0);assert.equal(z.value,0);
});
test('CRA 2024 statistics are internally consistent',()=>{
 const s=METC_STATS.rows.reduce((a,r)=>[a[0]+r[1],a[1]+r[2],a[2]+r[3]],[0,0,0]);
 assert.ok(Math.abs(s[0]-METC_STATS.total[0])<=50);assert.ok(Math.abs(s[1]-METC_STATS.total[1])<=50);assert.ok(Math.abs(s[2]-METC_STATS.total[2])<=5);
 assert.equal(Math.round(METC_STATS.total[1]/METC_STATS.total[0]*1000)/10,18.5);assert.equal(Math.round(METC_STATS.total[2]*1000/METC_STATS.total[1]),3489);
});
test('input limits, guide wiring and accessible figures remain valid',()=>{
 const d=defaults(kind),guide=planningGuides.find(g=>g.slug==='medical-expense-tax-credit-2026-threshold-which-spouse-claims-12-month-window');
 assert.ok(guide);assert.ok(guide.sources.length>=8);assert.ok(guide.sections.length>=7);
 assert.equal(guide.related.length,3);assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)));
 for(const bad of [{...d,metcCouple:2},{...d,metcCouple:.5},{...d,metcCouple:0},{...d,metcExp:-1},{...d,metcNetA:0,metcEarnA:70000},{...d,metcDepNet:200000}])assert.equal(validInputs(kind,bad),false);
 for(const input of [d,{...d,metcExp:0,metcDepExp:0},{...d,metcCouple:0,metcNetB:0,metcEarnB:0},{...d,metcNetA:300000,metcEarnA:300000,metcNetB:300000,metcEarnB:300000,metcExp:60000,metcDepExp:60000,metcDepNet:150000},{...d,metcNetA:0,metcEarnA:0,metcNetB:0,metcEarnB:0}]){
  assert.ok(validInputs(kind,input));const result=planningResult(kind,input),html=renderResult(result,360);
  assert.equal(result.charts.length,6);assert.equal((html.match(/<svg /g)||[]).length,6);assert.equal((html.match(/<caption>/g)||[]).length,6);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
});
