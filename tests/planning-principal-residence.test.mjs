import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';

const kind='principalResidenceYears';
test('formula numerator, one-year addition and hypothetical gain split reconcile',()=>{
 const r=planningResult(kind,defaults(kind));
 assert.equal(r.metrics[0][1],16);assert.equal(r.metrics[1][1],240000);
 assert.equal(r.metrics[2][1],60000);assert.equal(r.metrics[3][1],.8);
 assert.equal(r.charts[0].series[0].rows.at(-1).value,1);
 assert.equal(r.charts[3].rows[0].values.at(-1),1);
 assert.equal(r.charts[1].rows[0].values[0]+r.charts[1].rows[0].values[1],300000);
});
test('acquisition-year residence controls the plus-one and a full fraction never creates a loss',()=>{
 const d=defaults(kind),noBonus=planningResult(kind,{...d,prAcquisitionResident:0});
 assert.equal(noBonus.metrics[0][1],15);assert.equal(noBonus.metrics[1][1],225000);
 const full=planningResult(kind,{...d,prOwnedYears:5,prDesignatedYears:5,prGain:10000});
 assert.equal(full.metrics[1][1],10000);assert.equal(full.metrics[2][1],0);
});
test('year and gain boundaries stay finite, while inconsistent designation counts are rejected',()=>{
 const d=defaults(kind);
 assert.equal(validInputs(kind,{...d,prDesignatedYears:21}),false);
 for(const input of [
  {...d,prGain:0,prDesignatedYears:0,prAcquisitionResident:0},
  {...d,prOwnedYears:5,prDesignatedYears:0,prAcquisitionResident:1},
  {...d,prOwnedYears:60,prDesignatedYears:60,prGain:5000000,prAcquisitionResident:1}
 ]){
  assert.ok(validInputs(kind,input));const r=planningResult(kind,input),html=renderResult(r,360);
  assert.equal(r.charts.length,4);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
});
test('English article uses primary CRA sources and existing related topics',()=>{
 const g=planningGuides.find(x=>x.slug==='principal-residence-designation-years-sale-reporting');
 assert.ok(g);assert.equal(g.planning,kind);assert.ok(g.sections.length>=5);assert.equal(g.related.length,3);
 assert.ok(g.related.every(s=>planningGuides.some(x=>x.slug===s)));
 assert.ok(g.sources.some(s=>s.url.includes('principal-residence-other-real-estate')));
 assert.ok(g.sources.some(s=>s.url.includes('income-tax-folio-s1-f3-c2-principal-residence')));
});
