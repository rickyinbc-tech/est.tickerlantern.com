import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {cppShare} from '../src/planning-cpp-sharing-models.js';

const kind='cppSharingMonths';
const close=(a,b,t=.01)=>assert.ok(Math.abs(a-b)<=t,`${a} vs ${b}`);
const p=o=>({baseA:1100,enhA:150,baseB:400,enhB:40,jcp:576,together:420,enhShare:1,...o});
test('section 65.1(9) ratio, symmetry and combined total',()=>{
 const s=cppShare(p());close(s.r,420/576,1e-12);close(s.net,310.21);assert.equal(money(s.afterA+s.afterB),1690);
 const full=cppShare(p({together:576}));close(full.afterA,845);close(full.afterB,845);
 const none=cppShare(p({together:0}));close(none.net,55);
 const zero=cppShare(p({together:0,enhShare:0}));assert.equal(zero.net,0);
 const swap=cppShare(p({baseA:400,enhA:40,baseB:1100,enhB:150}));close(swap.net,-310.21);
 const nonContrib=cppShare(p({baseB:0,enhB:0,jcp:624,together:480}));close(nonContrib.net,498.08);
});
function money(n){return Math.round((n+Number.EPSILON)*100)/100;}
test('default couple reconciles to the worked example',()=>{
 const r=planningResult(kind,defaults(kind));
 assert.deepEqual(r.metrics.map(m=>m[1]),[.7292,310.21,939.79,750.21,695.33]);
 assert.deepEqual(r.charts[1].rows.map(x=>x.value),[401.04,75,-145.83,-20]);
 assert.deepEqual(r.charts[4].rows.map(x=>x.values),[[55091.47,52064.29],[17280,21002.5]]);
});
test('reverse direction costs tax and OAS recovery case saves more',()=>{
 const d=defaults(kind);
 assert.equal(planningResult(kind,{...d,csBaseA:400,csEnhA:40,csBaseB:1100,csEnhB:150}).metrics[4][1],-411.72);
 assert.equal(planningResult(kind,{...d,csOtherA:100000,csPenA:80000}).metrics[4][1],1321.49);
 assert.equal(planningResult(kind,{...d,csTogether:576}).metrics[4][1],878.47);
});
test('input limits, guide wiring and accessible figures remain valid',()=>{
 const d=defaults(kind),guide=planningGuides.find(g=>g.slug==='cpp-pension-sharing-spouses-cohabitation-months');
 assert.ok(guide);assert.ok(guide.sources.length>=6);assert.ok(guide.sections.length>=6);
 assert.equal(guide.related.length,3);assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)));
 for(const bad of [{...d,csTogether:600},{...d,csBaseA:0,csEnhA:0,csBaseB:0,csEnhB:0},{...d,csOasA:9150,csPenA:40000},{...d,csOasB:9150,csPenB:5000},{...d,csJcp:100.5},{...d,csBaseA:-1}])assert.equal(validInputs(kind,bad),false);
 for(const input of [d,{...d,csBaseB:0,csEnhB:0},{...d,csTogether:0,csEnhTogether:0},{...d,csBaseA:1600,csEnhA:800,csBaseB:1600,csEnhB:800,csJcp:624,csTogether:624,csOtherA:300000,csOasA:12000,csPenA:288000,csOtherB:300000,csOasB:12000,csPenB:288000},{...d,csJcp:12,csTogether:12,csOtherA:0,csOasA:0,csPenA:0,csOtherB:0,csOasB:0}]){
  assert.ok(validInputs(kind,input));const result=planningResult(kind,input),html=renderResult(result,360);
  assert.equal(result.charts.length,5);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
});
