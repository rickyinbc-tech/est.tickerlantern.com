import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { jointIncomeProbability, jointIncomeBudget } from '../src/planning-joint-income-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('every tested dependence setting preserves both marginal probabilities and a complete non-negative grid',()=>{
  const d=defaults('jointIncomeRisk');
  for(const lossProbabilityA of [0,1,10,33,70,100])for(const lossProbabilityB of [0,5,10,71,90,100])for(const dependence of [-100,-50,0,50,100]) {
    const p=jointIncomeBudget({...d,lossProbabilityA,lossProbabilityB,dependence}),s=p.states;
    near(s.reduce((n,r)=>n+r.probability,0),1);
    near(s[1].probability+s[3].probability,lossProbabilityA/100);
    near(s[2].probability+s[3].probability,lossProbabilityB/100);
    assert.ok(s.every(r=>r.probability>=0&&r.probability<=1));assert.ok(p.overlap>=p.lower-1e-12&&p.overlap<=p.upper+1e-12);
  }
});
test('independence and the two endpoint controls match independent product and feasibility formulas',()=>{
  const d=defaults('jointIncomeRisk');
  for(const [a,b] of [[.1,.1],[.8,.7],[0,.5],[1,.6],[1,1]]) {
    const input={...d,lossProbabilityA:100*a,lossProbabilityB:100*b};
    near(jointIncomeProbability({...input,dependence:0}).overlap,a*b);
    near(jointIncomeProbability({...input,dependence:-100}).overlap,Math.max(0,a+b-1));
    near(jointIncomeProbability({...input,dependence:100}).overlap,Math.min(a,b));
  }
  near(jointIncomeProbability(d).overlap,.055);
});
test('cash needs use retained receipts, the full window and a capped reserve draw',()=>{
  const d=defaults('jointIncomeRisk'),p=jointIncomeBudget(d);
  assert.deepEqual(p.states.map(s=>s.need),[0,12000,6000,27000]);
  assert.deepEqual(p.states.map(s=>s.funded),[0,12000,6000,15000]);
  assert.deepEqual(p.states.map(s=>s.unfunded),[0,0,0,12000]);
  for(const s of p.states){near(s.funded+s.unfunded,s.need);assert.ok(s.funded<=d.reserve);}
  near(p.inadequate,.055);near(p.expected,660);near(p.worst,12000);
});
test('the no-reserve example has lower event frequency but greater expected unfunded dollars under the selected overlap',()=>{
  const d={...defaults('jointIncomeRisk'),reserve:0},independent=jointIncomeBudget({...d,dependence:0}),selected=jointIncomeBudget(d);
  near(independent.inadequate,.19);near(selected.inadequate,.145);near(independent.expected,1890);near(selected.expected,2295);
  assert.ok(selected.inadequate<independent.inadequate);assert.ok(selected.expected>independent.expected);
});
test('a reserve equal to the worst need funds every state; a basic deficit can exist before either income is lost',()=>{
  const d=defaults('jointIncomeRisk'),covered=jointIncomeBudget({...d,reserve:27000});
  near(covered.inadequate,0);near(covered.expected,0);near(covered.worst,0);
  const deficit=jointIncomeBudget({...d,essentials:10000,reserve:0});assert.ok(deficit.states[0].need>0);near(deficit.inadequate,1);
  const exact=jointIncomeBudget({...d,reserve:12000});near(exact.states[1].unfunded,0);near(exact.inadequate,exact.overlap);
});
test('swapping income identities transposes the scenario probabilities without changing household risk summaries',()=>{
  const d={...defaults('jointIncomeRisk'),lossProbabilityA:23,lossProbabilityB:41},a=jointIncomeBudget(d);
  const b=jointIncomeBudget({...d,incomeA:d.incomeB,incomeB:d.incomeA,lossProbabilityA:d.lossProbabilityB,lossProbabilityB:d.lossProbabilityA});
  near(a.inadequate,b.inadequate);near(a.expected,b.expected);near(a.worst,b.worst);
  near(a.states[1].probability,b.states[2].probability);near(a.states[1].need,b.states[2].need);
});
test('the probability grid is independent of cash inputs and curve zero agrees with the independent case',()=>{
  const d=defaults('jointIncomeRisk'),r=planningResult('jointIncomeRisk',d),edited=planningResult('jointIncomeRisk',{...d,reserve:0,incomeA:0,months:24});
  assert.deepEqual(r.charts[0],edited.charts[0]);
  const independent=jointIncomeBudget({...d,dependence:0});
  near(r.charts[2].series[0].rows.find(x=>x.x===0).value,independent.inadequate);
  near(r.charts[3].series[0].rows.find(x=>x.x===0).value,independent.expected);
  assert.equal(r.charts[2].xMin,-100);
});
test('all boundary inputs retain finite probabilities and four accessible figures while months remain integral',()=>{
  const kind='jointIncomeRisk',d=defaults(kind),variants=[d];
  assert.equal(validInputs(kind,{...d,months:1.5}),false);
  for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
  for(const input of variants){assert.equal(validInputs(kind,input),true);const p=jointIncomeBudget(input);assert.ok(p.inadequate>=0&&p.inadequate<=1);assert.ok(p.expected>=0);const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
});
