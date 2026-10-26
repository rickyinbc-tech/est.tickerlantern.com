import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {bracketTax,basicPersonal,ageAmount,household} from '../src/planning-pension-split-models.js';

const kind='pensionSplitElection';
const close=(a,b,t=.01)=>assert.ok(Math.abs(a-b)<=t,`${a} vs ${b}`);
test('2026 federal anchors match hand-checked CRA arithmetic and boundaries',()=>{
 close(bracketTax(58523),8193.22);close(bracketTax(95000),15671.005);
 close(bracketTax(117045),8193.22+58522*.205);
 assert.equal(basicPersonal(181440),16452);assert.equal(basicPersonal(258482),14829);close(basicPersonal(219961),15640.5,.01);
 assert.equal(ageAmount(46432),9208);close(ageAmount(95000),1922.8);assert.equal(ageAmount(107819),0);assert.equal(ageAmount(200000),0);
});
test('default couple reconciles to the worked example in the guide',()=>{
 const r=planningResult(kind,defaults(kind));
 assert.deepEqual(r.metrics.slice(0,4).map(m=>m[1]),[35000,12818.53,8272.06,4546.47]);
 assert.equal(r.metrics[4][1],50);
 assert.deepEqual(r.charts[2].rows.map(x=>x.value),[12818.53,-2275,-639.07,-280,-1352.4,0]);
 close(r.charts[2].rows.reduce((a,x)=>a+x.value,0),8272.06);
 assert.deepEqual(r.charts[1].rows[0].values,[95000,16000]);assert.deepEqual(r.charts[1].rows[1].values,[60000,51000]);
});
test('OAS recovery, flat optimum and harmful split scenarios behave as described',()=>{
 const d=defaults(kind);
 const claw=planningResult(kind,{...d,pspPensionA:100000});
 assert.equal(claw.metrics[4][1],43);assert.equal(claw.metrics[3][1],9563.73);assert.equal(claw.charts[2].rows[5].value,-4451.55);
 assert.equal(household({...d,pspPensionA:100000},30).a.recovery,0);
 const flat=planningResult(kind,{...d,pspPensionA:60000,pspPensionB:20000,pspOtherB:30000,pspSplit:50});
 assert.equal(flat.metrics[4][1],15);assert.equal(flat.metrics[3][1],325);
 const worse=planningResult(kind,{...d,pspPensionA:40000,pspOtherA:20000,pspPensionB:30000,pspOtherB:30000});
 assert.equal(worse.metrics[3][1],-1339.07);assert.equal(worse.metrics[4][1],0);
 const zero=planningResult(kind,{...d,pspSplit:0});assert.equal(zero.metrics[3][1],0);assert.equal(zero.metrics[0][1],0);
 const noPension=planningResult(kind,{...d,pspPensionA:0});assert.equal(noPension.metrics[3][1],0);
});
test('recovery tax is capped at OAS received and household net income never changes',()=>{
 const d={...defaults(kind),pspPensionA:300000,pspOtherA:300000,pspOasA:9150};
 for(const p of [0,25,50]){const h=household(d,p);assert.ok(h.a.recovery<=9150+1e-9);close(h.a.ni+h.b.ni,600000+16000);}
});
test('input limits, guide wiring and accessible figures remain valid',()=>{
 const d=defaults(kind),guide=planningGuides.find(g=>g.slug==='pension-income-splitting-eligible-pension-50-percent-election');
 assert.ok(guide);assert.ok(guide.sources.length>=6);assert.ok(guide.sections.length>=6);
 assert.equal(guide.related.length,3);assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)));
 for(const bad of [{...d,pspSplit:51},{...d,pspSplit:12.5},{...d,pspPensionA:-1},{...d,pspOasA:30000,pspOtherA:20000},{...d,pspOasB:20000}])assert.equal(validInputs(kind,bad),false);
 for(const input of [d,{...d,pspPensionA:0,pspOtherA:0,pspOasA:0,pspOtherB:0,pspOasB:0,pspSplit:0},{...d,pspPensionA:300000,pspOtherA:300000,pspPensionB:300000,pspOtherB:300000,pspOasA:12000,pspOasB:12000}]){
  assert.ok(validInputs(kind,input));const result=planningResult(kind,input),html=renderResult(result,360);
  assert.equal(result.charts.length,5);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
});
