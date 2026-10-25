import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';

const kind='oasDeferralBridge';
test('dated OAS table and simple deferral cash bridge reconcile independently',()=>{
 const r=planningResult(kind,defaults(kind));
 assert.deepEqual(r.charts[0].rows.map(x=>x.value),[762.5,817.4,872.3,927.2,982.1,1037]);
 assert.equal(r.metrics[2][1],45750);
 assert.equal(r.metrics[1][1],1037);
 assert.ok(Math.abs(r.metrics[3][1]-83.92)<.01);
 assert.equal(r.metrics[4][1],20130);
});
test('starting at 65 makes both paths equal and zero-delay bridge is zero',()=>{
 const d=defaults(kind),r=planningResult(kind,{...d,oasStartAge:65});
 assert.equal(r.metrics[2][1],0);assert.equal(r.metrics[4][1],0);
 assert.deepEqual(r.charts[1].series[0].rows,r.charts[1].series[1].rows);
});
test('share scaling preserves percentages and projection before later start has no later payments',()=>{
 const d=defaults(kind),half=planningResult(kind,{...d,oasPensionShare:50});
 assert.equal(half.metrics[0][1],381.25);assert.equal(half.metrics[2][1],22875);
 const before=planningResult(kind,{...d,oasProjectionAge:70});
 assert.equal(before.metrics[4][1],-45750);
});
test('input limits, English guide sources, relationships and accessible figures remain valid',()=>{
 const d=defaults(kind),guide=planningGuides.find(g=>g.slug==='oas-deferral-cash-bridge-lifetime-uplift');
 assert.ok(guide);assert.ok(guide.sources.length>=4);assert.ok(guide.sections.length>=5);
 assert.equal(guide.related.length,3);assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)));
 for(const bad of [{...d,oasStartAge:64},{...d,oasStartAge:70.5},{...d,oasPensionShare:0},{...d,oasProjectionAge:101}])assert.equal(validInputs(kind,bad),false);
 for(const input of [d,{...d,oasStartAge:65,oasPensionShare:25,oasProjectionAge:70},{...d,oasStartAge:70,oasPensionShare:100,oasProjectionAge:100}]){
  assert.ok(validInputs(kind,input));const result=planningResult(kind,input),html=renderResult(result,360);
  assert.equal(result.charts.length,4);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
});
