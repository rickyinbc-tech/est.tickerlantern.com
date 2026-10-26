import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {riskBand,recoveryYears,stressPath} from '../src/planning-client-risk-models.js';
import {seriesPaths,breakevenAdvice,afterTaxValues,switchBreakeven} from '../src/planning-client-fund-cost-models.js';

const close=(a,b,t=.01)=>assert.ok(Math.abs(a-b)<=t,`${a} vs ${b}`);
const kinds={riskProfileStress:'risk-profile-loss-limit-time-horizon-stress-test',fundRiskBand:'fund-facts-risk-rating-standard-deviation-yearly-range',fundSeriesCost:'mutual-fund-series-advice-included-fee-based-cost-comparison',fundSwitchTax:'non-registered-fund-switch-capital-gains-tax-fee-saving-break-even'};

test('risk profile stress test reproduces the worked example and the lower-of rule',()=>{
 const d=defaults('riskProfileStress'),r=planningResult('riskProfileStress',d);
 assert.deepEqual(r.charts[0].rows.map(x=>x.value),[-5400,-12800,-20200,-27600,-35000]);
 assert.deepEqual([20,40,60,80,100].map(s=>recoveryYears(d,s)),[3,4,6,7,8]);
 assert.deepEqual(r.metrics.slice(0,3).map(m=>m[1]),[40,40,40]);
 close(stressPath(d,60,5)[5].value,99233.56);close(stressPath(d,100,5)[5].value,85201.74);
 const wider=planningResult('riskProfileStress',{...d,rpsMaxLoss:25});assert.deepEqual(wider.metrics.slice(0,3).map(m=>m[1]),[60,40,40]);
 const longer=planningResult('riskProfileStress',{...d,rpsHorizon:10});assert.deepEqual(longer.metrics.slice(0,3).map(m=>m[1]),[40,100,40]);
 const none=planningResult('riskProfileStress',{...d,rpsMaxLoss:3});assert.equal(none.metrics[2][1],0);assert.equal(none.metrics[3][1],null);
});

test('Fund Facts bands follow NI 81-102 Appendix F edges and the dollar example',()=>{
 assert.equal(riskBand(5.99),'Low');assert.equal(riskBand(6),'Low to medium');assert.equal(riskBand(10.9),'Low to medium');assert.equal(riskBand(11),'Medium');assert.equal(riskBand(16),'Medium to high');assert.equal(riskBand(20),'High');
 const r=planningResult('fundRiskBand',defaults('fundRiskBand'));
 assert.equal(r.metrics[0][3],'Low to medium');assert.equal(r.metrics[1][3],'-4% and 14%');assert.equal(r.metrics[2][3],'-13% and 23%');assert.equal(r.metrics[3][1],-6500);
 assert.deepEqual(r.charts[1].rows.map(x=>x.values[0]),[-0.01,-0.12,-0.22,-0.31,-0.43]);
});

test('fund series comparison matches the guide and the break-even fee equalizes values',()=>{
 const d=defaults('fundSeriesCost'),r=planningResult('fundSeriesCost',d);
 assert.deepEqual(r.metrics.slice(0,3).map(m=>m[1]),[221228.81,217508.5,-3720.32]);
 assert.equal(r.metrics[3][3],'1.95% vs 1.98%');assert.equal(r.metrics[4][1],0.0093);
 const even=breakevenAdvice(d),p=seriesPaths(d,even);close(p.f,p.a,0.01);
 assert.deepEqual(r.charts[3].rows.map(x=>x.value),[22536.05,9052.62,-3720.32,-15818.32,-27275.28]);
 const same=seriesPaths({...d,fscMerF:d.fscMerA,fscAdvice:0});close(same.f,same.a,1e-6);
});

test('switch model treats tax as timing and reproduces both worked scenarios',()=>{
 const d=defaults('fundSwitchTax'),r=planningResult('fundSwitchTax',d);
 assert.deepEqual(r.metrics.slice(0,4).map(m=>m[1]),[6000,153974.94,170727.74,16752.8]);assert.equal(r.metrics[4][1],1);
 const zero=afterTaxValues(d,0);close(zero.keep,zero.swap,1e-9);close(zero.keep,94000,1e-9);
 const big={...d,fstAcb:20000};
 assert.deepEqual(planningResult('fundSwitchTax',big).charts[3].rows.map(x=>x.value),[60,60,20,1,1]);
 assert.equal(switchBreakeven({...big,fstNewMer:1.95}),null);
 const loss={...d,fstAcb:150000};assert.equal(afterTaxValues(loss,0).taxNow,0);assert.equal(switchBreakeven(loss),1);
 assert.equal(validInputs('fundSwitchTax',{...d,fstNewMer:2.5}),false);
});

test('guides are wired with resolvable links, sources and accessible finite figures',()=>{
 for(const [kind,slug] of Object.entries(kinds)){
  const guide=planningGuides.find(g=>g.slug===slug);assert.ok(guide,slug);assert.equal(guide.planning,kind);
  assert.ok(guide.sources.length>=1);assert.ok(guide.sections.length>=4);assert.equal(guide.related.length,3);
  assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)),slug);
  const d=defaults(kind),fields=Object.keys(d);
  const lows=Object.fromEntries(fields.map(k=>[k,d[k]]));
  for(const input of [d,lows]){
   assert.ok(validInputs(kind,input),kind);const result=planningResult(kind,input),html=renderResult(result,360);
   assert.equal((html.match(/<svg /g)||[]).length,result.charts.length);assert.equal((html.match(/<caption>/g)||[]).length,result.charts.length);
   assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
  }
 }
 for(const extreme of [{rpsEquityShock:-70,rpsEquityReturn:-5,rpsBondReturn:-5,rpsHorizon:30},{rpsEquityShock:0,rpsBondShock:15}]){
  const html=renderResult(planningResult('riskProfileStress',{...defaults('riskProfileStress'),...extreme}),360);assert.doesNotMatch(html,/NaN|Infinity/);
 }
});
