import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {coordinatedBenefit} from '../src/planning-benefit-coordination-models.js';
import {renderResult} from '../src/planning-charts.js';
const kind='benefitCoordination',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('two hypothetical plan amounts reconcile one eligible expense and the complete invoice',()=>{
  const input=defaults(kind),p=coordinatedBenefit(input);
  near(p.primaryPotential,1000);near(p.secondaryPotential,900);near(p.primary,1000);near(p.secondary,500);
  near(p.uncoveredEligible,0);near(p.invoice,1700);near(p.household,200);near(p.primaryOnly,700);
  near(p.primary+p.secondary+p.household,p.invoice);
  const reduced=coordinatedBenefit({...input,secondaryCapLeft:200});near(reduced.secondary,200);near(reduced.household,500);
});
test('combined payments obey a separately derived common-expense ceiling across rates and maximums',()=>{
  const base=defaults(kind);
  for(const commonEligible of [0,50,1500,30000])for(const primaryRate of [0,70,100])for(const secondaryRate of [0,60,100])for(const cap of [0,500,10000]){
    const input={...base,commonEligible,primaryRate,secondaryRate,primaryCapLeft:cap,secondaryCapLeft:1000},p=coordinatedBenefit(input);
    const expected=Math.min(commonEligible,Math.min(commonEligible*primaryRate/100,cap)+Math.min(commonEligible*secondaryRate/100,1000));
    near(p.primary+p.secondary,expected);assert.ok(p.primary+p.secondary<=commonEligible+1e-8);
    near(p.primary+p.secondary+p.household,p.invoice);assert.ok(p.household>=input.outsideEligibility);assert.ok(p.household<=p.primaryOnly);
  }
});
test('amounts outside both plans never change either reimbursement and cannot disappear from the household share',()=>{
  const input=defaults(kind),a=coordinatedBenefit({...input,outsideEligibility:0}),b=coordinatedBenefit({...input,outsideEligibility:1000});
  near(a.primary,b.primary);near(a.secondary,b.secondary);near(b.household-a.household,1000);near(b.invoice-a.invoice,1000);
  const none=coordinatedBenefit({...input,commonEligible:0});near(none.primary,0);near(none.secondary,0);near(none.household,200);
  const lowRates=coordinatedBenefit({...input,primaryRate:20,secondaryRate:30});near(lowRates.household,950);
});
test('unused-maximum grid overrides both selected maximums and larger maximums cannot increase household cost',()=>{
  const input=defaults(kind),a=planningResult(kind),b=planningResult(kind,{...input,primaryCapLeft:0,secondaryCapLeft:0});
  assert.deepEqual(a.charts[3],b.charts[3]);near(a.charts[3].rows[2].values[3],200);near(a.charts[3].rows[0].values[0],1700);
  const values=[0,100,500,1000,10000].map(secondaryCapLeft=>coordinatedBenefit({...input,secondaryCapLeft}).household);
  assert.ok(values.every((v,i)=>!i||v<=values[i-1]));
});
test('zero expenses, exhausted plans and all supported field extremes remain finite and tabulated',()=>{
  const base=defaults(kind),fields=definitions[kind].fields,cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
  for(const input of cases){assert.ok(validInputs(kind,input));const result=planningResult(kind,input);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
  assert.equal(validInputs(kind,{...base,primaryRate:101}),false);
});
