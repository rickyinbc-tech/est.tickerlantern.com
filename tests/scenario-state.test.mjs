import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS } from '../src/model.js';
import { scenarioInputs, switchScenario, restoreSourceLocks, loadScenarios, saveScenarios, STORAGE_KEY } from '../src/scenario-state.js';
import { GROWTH_POLICY } from '../src/five-year-growth.js';

const row = { forwardPE: 18, mean10YearForwardPE: 16, dividendYield: 2 };
test('a different benchmark starts with its own defaults rather than the previous growth and horizon', () => {
  const next = switchScenario(row, undefined, {});
  assert.equal(next.growth, 6);
  assert.equal(next.years, 5);
  assert.equal(next.entryPE, 18);
});
test('revisiting a benchmark restores its own complete annual schedule and horizon', () => {
  const saved = { ...DEFAULTS, growth: 9, years: 3, growthMode: 'annual', annualGrowth: [10, -5, 20] };
  const next = switchScenario(row, saved, { growthMode: true, annualGrowth: true, years: true });
  assert.deepEqual(next.annualGrowth, [10, -5, 20, 9, 9]);
  assert.equal(next.growthMode, 'annual');
  assert.equal(next.years, 5);
});
test('source refresh and source restore protect the annual schedule and custom payout', () => {
  const saved = { ...DEFAULTS, growthMode: 'annual', annualGrowth: [10, -5, 20], payout: 40 };
  const locks = restoreSourceLocks({ entryPE: true, growth: true, annualGrowth: true, payout: true });
  assert.deepEqual(locks, { growth: true, annualGrowth: true, payout: true });
  const next = scenarioInputs(row, saved, locks);
  assert.deepEqual(next.annualGrowth, [10, -5, 20, 6, 6]);
  assert.equal(next.payout, 40);
  assert.equal(next.entryPE, 18);
});

test('saved browser settings restore distinct benchmark schedules and protected source fields', () => {
  let json;
  const storage = { getItem: key => key === STORAGE_KEY ? json : null, setItem: (key, value) => { assert.equal(key, STORAGE_KEY); json = value; } };
  const state = { scenarios: new Map([['sp500', { ...DEFAULTS, years: 3, growthMode: 'annual', annualGrowth: [10, -5, 20] }], ['nasdaq100', { ...DEFAULTS, growth: 8 }]]), overrides: new Map([['sp500', { annualGrowth: true, entryPE: true }]]), selectedIndexId: 'sp500', following: true };
  assert.equal(saveScenarios(storage, state), true);
  const restored = loadScenarios(storage);
  assert.deepEqual(restored.scenarios.get('sp500').annualGrowth, [10, -5, 20]);
  assert.equal(restored.scenarios.get('nasdaq100').growth, 8);
  assert.deepEqual(restored.overrides.get('sp500'), { annualGrowth: true, entryPE: true });
  const edited = switchScenario(row, restored.scenarios.get('sp500'), restored.overrides.get('sp500'));
  edited.annualGrowth[0] = 99;
  assert.equal(restored.scenarios.get('sp500').annualGrowth[0], 10);
});

test('unavailable and malformed browser storage leave the calculator usable', () => {
  assert.equal(loadScenarios(undefined).scenarios.size, 0);
  assert.equal(loadScenarios({ getItem: () => 'invalid JSON' }).scenarios.size, 0);
  assert.equal(saveScenarios({ setItem: () => { throw new Error('Quota exhausted'); } }, { scenarios: new Map(), overrides: new Map() }), false);
});

test('legacy paused source paths migrate once and preserve only named yearly reader overrides',()=>{
  const source={id:'nasdaq100',asOf:'2025-09-30',forwardPE:20,dividendYield:1,growthForecast:{periodBasis:'publisher-year',forecastType:'consensus',asOf:'2025-09-30',source:{publisher:'Fixture',url:'https://example.com/source'},estimates:[{year:2026,growth:28},{year:2027,growth:18}]}};
  const legacy={...DEFAULTS,growthMode:'source',growthStartYear:2027,annualGrowth:[28,18],growthOverrides:{2027:9},years:2,growthPolicyVersion:'tickerlantern-five-year-fade-v1'};
  const migrated=scenarioInputs(source,legacy,{},false,new Date('2026-10-23T12:00:00Z'));
  assert.equal(migrated.years,5);assert.equal(migrated.growthPolicyVersion,GROWTH_POLICY.version);
  assert.equal(migrated.growthStartYear,2026);assert.deepEqual(migrated.annualGrowth,[8.04,9,8.04,8.04,8.04]);
  assert.deepEqual(migrated.growthOverrides,{2027:9});assert.deepEqual(migrated.growthPlan,[]);
  const changed={...source,asOf:'2027-01-15',growthForecast:{...source.growthForecast,estimates:[{year:2028,growth:45}]}};
  const frozen=scenarioInputs(changed,migrated,{},false,new Date('2028-01-01'));
  assert.equal(frozen.growthStartYear,2026);assert.deepEqual(frozen.annualGrowth,[8.04,9,8.04,8.04,8.04]);
});

test('timing-policy migration never rewrites custom constant or annual scenarios',()=>{
  for(const following of [true,false]){
    const constant=scenarioInputs({...row,id:'nasdaq100'}, {...DEFAULTS,growth:3,growthMode:'constant',growthPolicyVersion:'old'}, {growth:true,growthMode:true}, following);
    assert.equal(constant.growthMode,'constant');assert.equal(constant.growth,3);assert.equal(constant.years,5);
    const annual=scenarioInputs({...row,id:'nasdaq100'}, {...DEFAULTS,growth:3,growthMode:'annual',annualGrowth:[-5,4,8,2,1],growthPolicyVersion:'old'}, {growthMode:true,annualGrowth:true}, following);
    assert.equal(annual.growthMode,'annual');assert.deepEqual(annual.annualGrowth,[-5,4,8,2,1]);
  }
});

test('growth timing-policy version survives storage and legacy storage stays distinguishable',()=>{
  let value;const storage={getItem:()=>value,setItem:(_,v)=>value=v};
  saveScenarios(storage,{scenarios:new Map([['sp500',{...DEFAULTS,growthPolicyVersion:GROWTH_POLICY.version}],['nasdaq100',{...DEFAULTS}]]),overrides:new Map(),following:false});
  const restored=loadScenarios(storage);
  assert.equal(restored.scenarios.get('sp500').growthPolicyVersion,GROWTH_POLICY.version);
  assert.equal(restored.scenarios.get('nasdaq100').growthPolicyVersion,'');
});
