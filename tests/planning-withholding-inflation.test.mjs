import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults,definitions} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {usWithholdingPlan,withholdingBreakEven,inflationGainPlan,cpiSeptember} from '../src/planning-withholding-inflation-models.js';

const near=(a,b,tol=.005)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);

test('US withholding defaults match 40-digit Decimal arithmetic',()=>{
 const p=usWithholdingPlan(defaults('usWithholding'));
 near(p.D,1500);near(p.lost,225);near(p.credited,225);near(p.extra,219.75);near(p.lostNonReg,0);
 near(p.end.bench,482769.910813615,1e-6);near(p.end.fund,457907.588722408,1e-6);
 near(p.end.tfsaUs,448795.227706832,1e-6);near(p.end.rrspUs,473162.789588424,1e-6);
 assert.equal(p.breakEven,10);
 assert.equal(withholdingBreakEven(.015,.0025,.05,.15),3);assert.equal(withholdingBreakEven(.005,.02,.05,.15),57);
 assert.equal(withholdingBreakEven(0,.01,.05,.15),null);assert.equal(withholdingBreakEven(.02,0,.05,.15),0);
 const low=usWithholdingPlan({...defaults('usWithholding'),fwRate:10});near(low.lostNonReg,75);near(low.credited,150);
});
test('inflation-taxed gain defaults match 40-digit Decimal arithmetic',()=>{
 const p=inflationGainPlan(defaults('inflationGainTax'));
 near(p.n,.066,1e-12);near(p.V,35904.104048753,1e-6);near(p.G,25904.104048753,1e-6);near(p.infl,6386.164402904,1e-6);
 near(p.tax,3840.283425228,1e-6);near(p.taxInfl,946.748872731,1e-6);near(p.taxReal,2893.534552497,1e-6);
 near(p.eff,.196756599052,1e-9);near(p.effInterest,.569619065301,1e-9);near(p.statutory,.14825,1e-12);
 // No inflation: effective rate equals the statutory rate
 near(inflationGainPlan(defaults('inflationGainTax'),{igInflation:0}).eff,.14825,1e-9);
 near(inflationGainPlan(defaults('inflationGainTax'),{igReal:1,igInflation:4}).eff,.5143,1e-4);
 assert.equal(inflationGainPlan(defaults('inflationGainTax'),{igReal:0}).eff,null);
 near(10000*(cpiSeptember[2026]/cpiSeptember[2006]-1),5567.765568,1e-5);
});
test('random valid inputs render finite charts',()=>{
 let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(const kind of ['usWithholding','inflationGainTax']){
  const def=defaults(kind);
  for(let n=0;n<400;n++){
   const input={...def};
   for(const [key,,,min,max,step] of definitions[kind].fields){const k=Math.round((min+rnd()*(max-min))/step)*step;input[key]=Math.min(max,Math.max(min,+k.toFixed(6)));}
   assert.ok(validInputs(kind,input),JSON.stringify(input));
   const r=planningResult(kind,input);
   for(const m of r.metrics)assert.ok(m[3]||Number.isFinite(m[1]),m[0]);
   assert.doesNotThrow(()=>renderResult(r,720));assert.doesNotThrow(()=>renderResult(r,360));
  }
 }
});
test('guides are registered with four charts each',()=>{
 for(const slug of ['us-dividend-withholding-tax-rrsp-tfsa-non-registered-fund-structure','capital-gains-tax-on-inflation-real-after-tax-return-fund-non-registered-tfsa']){
  const g=planningGuides.find(x=>x.slug===slug);assert.ok(g,slug);assert.equal(planningResult(g.planning,defaults(g.planning)).charts.length,4);
  for(const rel of g.related)assert.ok(planningGuides.some(x=>x.slug===rel),rel);
 }
});
