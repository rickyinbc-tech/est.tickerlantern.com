import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, BOUNDS, project, sensitivity, sensitivityAxes, validate, annualCSV } from '../src/model.js';
import { scenarioInputs, switchScenario, restoreSourceLocks, presetScenario, fieldBasis } from '../src/scenario-state.js';
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-10, `${a} != ${b}`);
const em = { id:'em', historicalCompatibility:{outcome:'compatible',allowComparison:true,allowExitDefault:true,reasons:['Synthetic compatible fixture']}, forwardPE:8.9, mean10YearForwardPE:12.25, dividendYield:2.02 };

test('low-multiple benchmarks get lower, unchanged and higher exit valuations', () => {
  const axes = sensitivityAxes({...DEFAULTS, entryPE:8.9});
  assert.deepEqual(axes.multiples,[5.34,7.12,8.9,10.68,12.46]);
  assert.deepEqual(axes.growths,[-2,2,6,10,14]);
});
test('sensitivity axes remain unique and supported at every boundary', () => {
  for(const entryPE of [1,1.000001,8.9,25,99.99999,100]) for(const growth of [BOUNDS.growth[0],BOUNDS.growth[0]+.00001,0,BOUNDS.growth[1]-.00001,BOUNDS.growth[1]]) {
    const axes=sensitivityAxes({...DEFAULTS,entryPE,growth});
    for(const [axis,min,max,anchor] of [[axes.multiples,1,100,entryPE],[axes.growths,...BOUNDS.growth,growth]]) {
      assert.equal(new Set(axis).size,5); assert.ok(axis.includes(anchor));
      assert.ok(axis.every(v=>v>=min && v<=max));
      assert.deepEqual(axis,[...axis].sort((a,b)=>a-b));
    }
  }
});
test('every sensitivity cell uses the same engine in both dividend modes', () => {
  for(const dividendMode of ['yield','payout']) {
    const input={...DEFAULTS,entryPE:8.9,years:12,growth:-3,dividendMode,dividendYield:2.02,payout:43};
    const grid=sensitivity(input);
    grid.rows.forEach((row,i)=>row.forEach((value,j)=>close(value,project({...input,growth:grid.growths[i],exitPE:grid.multiples[j]}).cashIRR)));
  }
});
test('selecting a cell preserves the explicit grid and reproduces its return', () => {
  const input={...DEFAULTS,entryPE:8.9}; const axes=sensitivityAxes(input), grid=sensitivity(input,axes);
  const selected={...input,growth:axes.growths[0],exitPE:axes.multiples[4]};
  const next=sensitivity(selected,axes);
  assert.deepEqual(next.growths,grid.growths); assert.deepEqual(next.multiples,grid.multiples);
  close(next.rows[0][4],project(selected).cashIRR);
});
test('source refresh updates unlocked inputs and protects edits', () => {
  const custom={...DEFAULTS,entryPE:17,exitPE:19,growth:9,years:8,dividendYield:3};
  const next=scenarioInputs(em,custom,{entryPE:true,dividendYield:true,growth:true,years:true});
  assert.equal(next.entryPE,17);assert.equal(next.exitPE,12.25);assert.equal(next.dividendYield,3);
  assert.equal(next.growth,9);assert.equal(next.years,5);
  assert.deepEqual(scenarioInputs(em,custom,{},false),{...custom,years:5,payout:34.34,dividendPolicyVersion:'benchmark-dividend-anchor-v1'});
});
test('a new missing benchmark gets labelled defaults, never prior valuations', () => {
  const next=switchScenario({},undefined);
  assert.equal(next.entryPE,DEFAULTS.entryPE);assert.equal(next.exitPE,DEFAULTS.entryPE);
  assert.equal(next.dividendYield,DEFAULTS.dividendYield);assert.equal(next.dividendMode,'payout');
  assert.equal(next.growth,6); assert.equal(next.years,5);
  assert.equal(fieldBasis('entryPE',{}),'default');assert.equal(fieldBasis('exitPE',{}),'fallback');
});
test('saved benchmark edits restore with its own growth and horizon', () => {
  const next=switchScenario(em,{...DEFAULTS,entryPE:17,exitPE:19,growth:2,years:4},{entryPE:true,exitPE:true,growth:true,years:true});
  assert.equal(next.entryPE,17);assert.equal(next.exitPE,19);assert.equal(next.growth,2);assert.equal(next.years,5);
});
test('restore source clears only source fields and keeps payout edits', () => {
  const locks=restoreSourceLocks({entryPE:true,exitPE:true,dividendMode:true,dividendYield:true,payout:true});
  assert.deepEqual(locks,{payout:true});
  const next=scenarioInputs(em,{...DEFAULTS,payout:44,growth:9,years:8},{...locks,growth:true,years:true});
  assert.equal(next.entryPE,8.9);assert.equal(next.exitPE,12.25);assert.equal(next.payout,44);
  assert.equal(next.growth,9);assert.equal(next.years,5);
});
test('presets change only their declared active assumptions', () => {
  const input=scenarioInputs(em,{...DEFAULTS,growth:9,years:8},{growth:true,years:true});
  assert.deepEqual(presetScenario(input,'compression'),{values:{...input,exitPE:7.12},locks:['exitPE']});
  assert.equal(presetScenario(input,'constant').values.exitPE,8.9);
  for(const dividendMode of ['yield','payout']) {
    const original={...input,dividendMode};const result=presetScenario(original,'zero');
    const key=dividendMode==='yield'?'dividendYield':'payout';
    assert.deepEqual(result.values,{...original,[key]:0});
    const m=project(result.values);close(m.priceCAGR,m.cashIRR);close(m.priceCAGR,m.reinvestedCAGR);
  }
  assert.equal(presetScenario({...input,entryPE:1},'compression').values.exitPE,1);
});
test('provenance distinguishes source, historical, fallback, default and custom', () => {
  assert.equal(fieldBasis('entryPE',em),'source');assert.equal(fieldBasis('exitPE',em),'reference');
  assert.equal(fieldBasis('exitPE',{forwardPE:8.9}),'fallback');assert.equal(fieldBasis('growth',em),'default');
  assert.equal(fieldBasis('entryPE',em,{entryPE:true}),'custom');assert.equal(fieldBasis('growth',em,{growth:true}),'custom');
  assert.equal(fieldBasis('entryPE',em,{},false),'manual');
});
test('compression reference, constant price CAGR and exported endpoints agree', () => {
  const m=project(DEFAULTS);close(m.priceCAGR,1.06*(20/25)**.2-1);
  assert.equal((m.priceCAGR*100).toFixed(2),'1.37');assert.equal((m.cashIRR*100).toFixed(2),'2.69');
  for(const growth of [-15,0,20]) close(project({...DEFAULTS,growth,exitPE:25}).priceCAGR,growth/100);
  const last=annualCSV(m).split('\n').at(-1).split(',').map(Number);
  for(const [i,key] of [[3,'price'],[6,'cashWealth'],[7,'reinvestedWealth']])assert.ok(Math.abs(last[i]-m.last[key])<1e-7);
});
test('non-finite, missing and boundary inputs fail before rendering', () => {
  for(const patch of [{growth:Infinity},{growth:''},{entryPE:0},{exitPE:101},{years:1.5},{dividendMode:'yield',dividendYield:NaN},{dividendMode:'yield',dividendYield:16}]) {
    assert.ok(Object.keys(validate({...DEFAULTS,...patch})).length);assert.throws(()=>project({...DEFAULTS,...patch}));
  }
});
