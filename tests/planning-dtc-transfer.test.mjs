import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {disabilityAmount,line98,transferable,caregiver,dtcSplit,zeroPoint,DTC_2026,DTC_2025,DTC_STATS} from '../src/planning-dtc-transfer-models.js';

const kind='dtcTransfer';
test('2026 disability, supplement and caregiver parameters match CRA',()=>{
 assert.equal(disabilityAmount(false),10341);assert.equal(disabilityAmount(true,0),16373);assert.equal(disabilityAmount(true,3533),16373);
 assert.equal(disabilityAmount(true,5000),14906);assert.equal(disabilityAmount(true,9565),10341);assert.equal(disabilityAmount(true,20000),10341);
 // 2025 parameters reproduce the CAD 16,052 and CAD 28,798 printed on the 2025 forms
 assert.equal(DTC_2025.base+DTC_2025.supp,DTC_2025.maxChild);assert.equal(DTC_2025.cgMax+DTC_2025.cgFrom,DTC_2025.cgEnd);
 assert.equal(DTC_2026.cgMax+DTC_2026.cgFrom,29374);
 assert.equal(caregiver(0),8773);assert.equal(caregiver(20601),8773);assert.equal(caregiver(24000),5374);assert.equal(caregiver(29374),0);assert.equal(caregiver(29373),1);
 assert.equal(line98(24000,18000),18964.15);assert.equal(line98(0,0),16452);
 assert.equal(transferable(10341,24000,18000),5305.15);assert.equal(transferable(10341,18000,18000),10341);assert.equal(transferable(10341,40000,18000),0);
 assert.equal(zeroPoint(10341,18000),29305);
});
test('default household and the article’s worked cases reconcile',()=>{
 const d=defaults(kind),r=planningResult(kind,d);
 assert.deepEqual(r.metrics.map(m=>m[1]),[5305.15,1495.08,5374,2200.1,29305]);
 const s=dtcSplit({under18:false,care:0,depNet:24000,depEarn:18000,supNet:85000,supEarn:85000});
 assert.equal(s.own,5035.85);assert.equal(s.ownValue,705.02);assert.equal(s.depTax,705.02);assert.equal(s.room,10457.64);assert.equal(s.claimed,10679.15);
 assert.deepEqual(r.charts[1].rows.map(x=>x.value),[10341,-5035.85,5374,0,-9184.07,0]);
 assert.deepEqual(r.charts[2].rows.map(x=>x.values),[[705.02,1495.08,0],[0,2675.96,0],[705.02,126.59,1368.49]]);
 const half=planningResult(kind,{...d,dtcShare:50});assert.equal(half.metrics[1][1],747.54);
 const child=planningResult(kind,{...d,dtcUnder18:1,dtcDepNet:0,dtcDepEarn:0});assert.deepEqual(child.metrics.slice(0,3).map(m=>m[1]),[16373,2292.22,0]);
 const care=planningResult(kind,{...d,dtcUnder18:1,dtcDepNet:0,dtcDepEarn:0,dtcCare:5000});assert.deepEqual(care.metrics.slice(0,2).map(m=>m[1]),[14906,2086.84]);
 assert.equal(child.charts[0].series.length,2);
 const line=r.charts[0].series[0].rows;assert.equal(line[0].value,10341);assert.equal(line.at(-1).value,0);
 for(let k=1;k<line.length;k++)assert.ok(line[k].value<=line[k-1].value);
});
test('CRA 2024 statistics are internally consistent',()=>{
 const s=DTC_STATS.rows.reduce((a,r)=>[a[0]+r[1],a[1]+r[2],a[2]+r[3]],[0,0,0]);
 assert.ok(Math.abs(s[0]-DTC_STATS.total[0])<=50);assert.equal(s[1],DTC_STATS.total[1]);assert.equal(s[2],DTC_STATS.total[2]);
 assert.equal(Math.round(DTC_STATS.total[2]*1000/DTC_STATS.total[1]),13867);assert.equal(Math.round(DTC_STATS.self[1]*1000/DTC_STATS.self[0]),9888);assert.equal(Math.round(DTC_STATS.caregiver[1]*1000/DTC_STATS.caregiver[0]),6524);
});
test('input limits, guide wiring and accessible figures remain valid',()=>{
 const d=defaults(kind),guide=planningGuides.find(g=>g.slug==='disability-tax-credit-transfer-supporting-person-caregiver-amount');
 assert.ok(guide);assert.ok(guide.sources.length>=8);assert.ok(guide.sections.length>=7);
 assert.equal(guide.related.length,3);assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)));
 for(const bad of [{...d,dtcUnder18:2},{...d,dtcCaregiver:.5},{...d,dtcDepEarn:30000},{...d,dtcCare:1000},{...d,dtcShare:101},{...d,dtcSupNet:0}])assert.equal(validInputs(kind,bad),false);
 for(const input of [d,{...d,dtcDepNet:0,dtcDepEarn:0},{...d,dtcUnder18:1,dtcDepNet:0,dtcDepEarn:0,dtcCare:30000},{...d,dtcShare:0},{...d,dtcSupNet:0,dtcSupEarn:0},{...d,dtcDepNet:100000,dtcDepEarn:100000,dtcSupNet:300000,dtcSupEarn:300000,dtcCaregiver:0}]){
  assert.ok(validInputs(kind,input));const result=planningResult(kind,input),html=renderResult(result,360);
  assert.equal(result.charts.length,6);assert.equal((html.match(/<svg /g)||[]).length,6);assert.equal((html.match(/<caption>/g)||[]).length,6);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
});
