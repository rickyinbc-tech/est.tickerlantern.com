import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult,format} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {cdb} from '../src/planning-cdb-income-models.js';

const kind='cdbIncomeTest';
test('regulation formula reproduces ESDC’s four 2025–26 worked examples and the 2026–27 published amounts',()=>{
 const y25={factor:1};
 assert.equal(cdb({...y25,afni:16000}).monthly,200);
 assert.equal(cdb({...y25,afni:35000,work:35000}).monthly,166.67);
 assert.equal(cdb({...y25,family:1,afni:45000,work:45000}).monthly,200);
 assert.equal(cdb({...y25,family:2,afni:45000,work:5000}).monthly,137.5);
 const z=cdb({});assert.equal(z.monthly,204.2);assert.equal(z.annual,2450.4);assert.equal(z.cap,10210);assert.equal(cdb({family:1}).cap,14294);
 assert.equal(z.threshold,23483);assert.equal(cdb({family:2}).threshold,33182.5);
 assert.equal(cdb({afni:35000,work:35000}).monthly,182.42);assert.equal(cdb({family:2,afni:45000,work:5000}).monthly,147.39);
 // unrounded CPI index levels 164.2 / 160.9 would give CAD 204.10 and a CAD 10,205 exemption
 const raw=cdb({factor:Math.round(164.2/160.9*1e4)/1e4});assert.equal(raw.monthly,204.1);assert.equal(Math.round(raw.cap),10205);
});
test('thresholds, exemption cap, zero points and the CAD 20 lump-sum rule',()=>{
 assert.equal(cdb({afni:23483}).monthly,204.2);assert.equal(cdb({afni:23488}).monthly,204.12);
 assert.equal(cdb({afni:33693,work:10210}).monthly,204.2);assert.equal(cdb({afni:33693,work:20000}).monthly,204.2);
 for(const [o,zero] of [[{},35735],[{work:99999},45945],[{family:1},45434.5],[{family:1,work:99999},59728.5],[{family:2},57686.5],[{family:2,work:99999},71980.5]]){
  const r=cdb(o);assert.equal(r.zero,zero);assert.equal(cdb({...o,afni:zero}).monthly,0);assert.ok(cdb({...o,afni:zero-100}).monthly>0);
 }
 const small=cdb({afni:43000,work:8000});assert.equal(small.monthly,12.25);assert.ok(small.lump);assert.deepEqual(small.payments,[147,0,0,0,0,0,0,0,0,0,0,0]);
 // CAD 20.00 a month needs 0.2 × excess = 2,210.40, i.e. AFNI 23,483 + 11,052 = 34,535
 const at=cdb({afni:34535});assert.equal(at.monthly,20);assert.equal(at.lump,true);
 const above=cdb({afni:34534.4});assert.equal(above.monthly,20.01);assert.equal(above.lump,false);
 assert.equal(cdb({family:2,afni:0}).household,4900.8);
});
test('default household reconciles to the worked example',()=>{
 const d=defaults(kind),r=planningResult(kind,d);
 assert.deepEqual(r.metrics.map(m=>m[1]),[128.92,1547.04,1389,-158.04,43735]);
 assert.match(r.metrics[3][4],/^5\.3 cents per dollar of working income added$/);
 assert.deepEqual(r.charts[1].rows.map(x=>x.value),[36000,-8000,-23483]);
 assert.deepEqual(r.charts[2].rows[0].values,[128.92,115.75]);assert.equal(r.charts[2].rows.length,12);assert.equal(r.charts[2].rows[0].label,'16 Jul 2026');
 assert.deepEqual(r.charts[3].rows.map(x=>x.values),[[128.92,128.92],[204.2,204.2],[204.2,408.4]]);
 const lost=r.charts[4].series;assert.equal(lost[0].rows.find(x=>x.x===3000).value,158.04);assert.equal(lost[1].rows.find(x=>x.x===3000).value,600);
 const other=planningResult(kind,{...d,cdbChangeWork:0});assert.equal(other.metrics[2][1],947.04);assert.equal(other.metrics[3][1],-600);
});
test('input limits, guide wiring and accessible figures remain valid',()=>{
 const d=defaults(kind),guide=planningGuides.find(g=>g.slug==='canada-disability-benefit-2026-27-income-test-working-income-exemption');
 assert.ok(guide);assert.ok(guide.sources.length>=8);assert.ok(guide.sections.length>=7);
 assert.equal(guide.related.length,3);assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)));
 for(const bad of [{...d,cdbFamily:3},{...d,cdbFamily:.5},{...d,cdbAfni:2000,cdbChange:-3000},{...d,cdbWork:1000,cdbChange:-3000},{...d,cdbFactor:.99},{...d,cdbChangeWork:2}])assert.equal(validInputs(kind,bad),false);
 for(const input of [d,{...d,cdbAfni:0,cdbWork:0,cdbChange:0},{...d,cdbFamily:2,cdbAfni:150000,cdbWork:150000,cdbChange:60000,cdbFactor:1.1},{...d,cdbFamily:1,cdbAfni:60000,cdbChange:-60000,cdbChangeWork:0},{...d,cdbAfni:43000}]){
  assert.ok(validInputs(kind,input));const result=planningResult(kind,input),html=renderResult(result,360);
  assert.equal(result.charts.length,5);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
});
test('metric detail text is shown under the value instead of replacing it',()=>{
 for(const k of ['cdbIncomeTest','cgebBenefitYear','cwbPhaseWorkers','cppSharingMonths']){
  const r=planningResult(k,defaults(k)),html=renderResult(r,360);
  for(const m of r.metrics)assert.ok(html.includes(`<strong>${format(m[1],m[2])}`),`${k}: ${m[0]}`);
 }
 assert.ok(renderResult(planningResult('cppSharingMonths',defaults('cppSharingMonths')),360).includes('<strong>72.92%'));
});
