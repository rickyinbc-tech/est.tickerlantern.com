import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sourceGrowthPath, validateGrowthForecast, growthIsStale, growthCoverage } from '../src/growth-data.js';
import { DEFAULTS, project, validate } from '../src/model.js';
import { scenarioInputs, switchScenario } from '../src/scenario-state.js';
import { GROWTH_ANCHORS, GROWTH_POLICY } from '../src/five-year-growth.js';
const now = new Date('2026-10-22T20:00:00Z');
const row = { id:'sp500', asOf:'2026-10-15', dividendYield:1.2, historicalCompatibility:{outcome:'compatible',allowComparison:true,allowExitDefault:true,reasons:['Synthetic compatible fixture']}, forwardPE: 20, mean10YearForwardPE: 18, metricDefinitions:{forwardPE:{economic:{horizon:'rolling-12m'},evidence:{dateBasis:'explicit-observation-date'}},growthForecast:{permittedUse:['display','approximate-scenario-growth']}}, growthForecast: { asOf: '2026-10-15', forecastType: 'consensus', periodBasis: 'calendar-year', source: { url: 'https://example.com/forecasts', publisher: 'Test publisher' }, estimates: [{ year: 2026, growth: 32.8 }, { year: 2027, growth: 28 }, { year: 2028, growth: 12 }] } };
const close = (actual, expected) => assert.ok(Math.abs(actual-expected)<1e-10,`${actual} != ${expected}`);
const closeRates = (actual, expected) => { assert.equal(actual.length,expected.length); actual.forEach((v,i)=>close(v,expected[i])); };
// Independently calculated with w=287/365 and CY rates [28,12,10,8,6,6].
const projectedRates = [28,12,8.04,8.04,8.04];

test('published growth begins with the next year and never repeats missing estimates', () => {
  const path = sourceGrowthPath(row, 5, now);
  assert.equal(path.startYear, 2027);
  assert.equal(path.coveredYears, 2);
  assert.deepEqual(path.rates, [28, 12, '', '', '']);
  assert.deepEqual(path.missingYears, [2029, 2030, 2031]);
  assert.equal(sourceGrowthPath(row, 1, new Date('2028-10-01')).coveredYears, 0);
});

test('source-following scenarios use published years and a sourced long-term projection', () => {
  const input = switchScenario(row, undefined, {}, true, now);
  assert.equal(input.growthMode,'source');assert.equal(input.years,5);
  assert.deepEqual(input.annualGrowth,projectedRates);assert.equal(input.growthStartYear,2027);
  assert.equal(input.growthPolicyVersion,GROWTH_POLICY.version);
  assert.equal(input.growthPlan[0].sourceEvidence.asOf,'2026-10-15');
  assert.equal(input.growthPlan[2].sourceEvidence.asOf,'2025-12-31');
  close(project(input).last.price,100*1.28*1.12*1.0804**3*.9);
  assert.deepEqual(switchScenario(row,undefined,{},true,new Date('2028-10-01')).annualGrowth,projectedRates);
});

test('a source refresh flows into linked rates while custom growth stays protected at five years', () => {
  const linked = switchScenario(row, undefined, {}, true, now);
  const changed = { ...row, growthForecast: { ...row.growthForecast, estimates: [{ year: 2027, growth: 30 }, { year: 2028, growth: 10 }] } };
  closeRates(scenarioInputs(changed,linked,{},true,now).annualGrowth,[30,10,8.04,8.04,8.04]);
  assert.deepEqual(sourceGrowthPath(changed,2,now).rates,[30,10]);
  const custom = { ...DEFAULTS, growthMode: 'annual', annualGrowth: [7, 8, 9], years: 3 };
  assert.deepEqual(scenarioInputs(changed, custom, { growthMode: true, annualGrowth: true, years: true }, true, now).annualGrowth, [7, 8, 9, 6, 6]);
  const extended = scenarioInputs(row, { ...linked, years: 5 }, { years: true }, true, now);
  closeRates(extended.annualGrowth,projectedRates);
  assert.equal(validate(extended).annualGrowth, undefined);
});

test('publisher periods preserve forecasts while unsupported periods use long-term projections',()=>{
  for(const basis of ['calendar-year','publisher-year','fiscal-year']) {
    const input=scenarioInputs({...row,growthForecast:{...row.growthForecast,periodBasis:basis}},undefined,{},true,now);
    assert.deepEqual(input.annualGrowth,projectedRates);assert.equal(input.growthPlan[0].sourceEvidence.periodBasis,basis);
  }
  for(const patch of [{asOf:undefined},{growthForecast:{...row.growthForecast,periodBasis:'quarterly'}},{metricDefinitions:{...row.metricDefinitions,growthForecast:{permittedUse:['display']}}}]){
    const input=scenarioInputs({...row,...patch},undefined,{},true,now);
    assert.deepEqual(input.annualGrowth,Array(5).fill(8.04));assert.ok(input.growthPlan.every(point=>point.basis==='long-term EPS projection'));
  }
});

test('missing growth evidence never becomes a universal 6 percent forecast', () => {
  const input = switchScenario({ ...row, id:'unknown', growthForecast: undefined }, undefined, {}, true, now);
  assert.equal(input.growthMode, 'source');
  assert.ok(input.annualGrowth.every(rate => rate === ''));
  assert.throws(() => project(input));
});

test('explicit manual annual rates above 20 percent remain supported without clamping', () => {
  const input = { ...DEFAULTS, growthMode: 'source', growthStartYear: 2027, years: 2, annualGrowth: [85, 44] };
  const model = project(input);
  assert.deepEqual(model.input.annualGrowth, [85, 44]);
  assert.ok(Number.isFinite(model.cashIRR));
});

test('growth evidence rejects duplicate years, missing provenance and implausible source rates', () => {
  assert.doesNotThrow(() => validateGrowthForecast(row.growthForecast));
  for (const change of [{ source: null }, { asOf: null }, { asOf: '2026-99-99' }, { periodBasis: 'forecast-horizon' }, { periodBasis: 'quarterly' }, { estimates: [{ year: 2027, growth: -1000001 }] }, { estimates: [{ year: 2027, growth: 12 }, { year: 2027, growth: 13 }] }]) assert.throws(() => validateGrowthForecast({ ...row.growthForecast, ...change }));
  assert.equal(growthIsStale(row, now), false);
  assert.equal(growthIsStale({ ...row, growthForecast: { ...row.growthForecast, asOf: '2026-01-01' } }, now), true);
  assert.equal(growthCoverage({ indices: [row, {}] }, now), '1 of 2 benchmarks have published 2027 growth inputs');
});

test('explicit source growth outside calculator bounds remains visible and blocks model output',()=>{
  for(const growth of [-100,1001]) {
    const forecast={...row.growthForecast,estimates:[{year:2027,growth}]};
    assert.doesNotThrow(()=>validateGrowthForecast(forecast));
    assert.deepEqual(sourceGrowthPath({...row,growthForecast:forecast},1,now).rates,[growth]);
    assert.ok(validate({...DEFAULTS,growthMode:'source',years:1,annualGrowth:[growth]}).annualGrowth);
  }
});
