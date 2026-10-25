import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { lifeSource } from '../src/planning-life-data.js';
import { jointSurvivalBounds, jointLifeRows, survivorBudget } from '../src/planning-joint-longevity-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('the retained source has complete age/sex grain, valid counts and two separate age-65 denominators',()=>{
  assert.equal(lifeSource.preliminary,true);assert.equal(lifeSource.period,'2022/2024');assert.equal(lifeSource.rows.length,36);
  assert.deepEqual(lifeSource.rows.map(r=>r[0]),Array.from({length:36},(_,i)=>65+i));
  for(const index of [1,2]){
    const values=lifeSource.rows.map(row=>row[index]);assert.ok(values.every(v=>Number.isInteger(v)&&v>=0&&v<=100000));assert.ok(values[0]>0);
    assert.ok(values.slice(1).every((v,i)=>v<=values[i]));
  }
  const p=jointLifeRows();near(p[0].male,1);near(p[0].female,1);near(p[0].independent,1);
  const age90=p.find(r=>r.age===90);near(age90.male,25102/86136);near(age90.female,38423/91475);near(age90.independent,.5890523738266488);
  assert.ok(p.at(-1).male>0&&p.at(-1).female>0&&p.at(-1).independent>0);
});
test('independent state probabilities partition the outcome and stay within the marginal-only union bounds',()=>{
  for(const a of [0,.1,.25,.5,.75,.9,1])for(const b of [0,.1,.25,.5,.75,.9,1]){
    const p=jointSurvivalBounds(a,b);near(p.both+p.oneOnly+p.neither,1);near(p.independent,a+b-a*b);near(p.independent,p.both+p.oneOnly);
    assert.ok(p.lower<=p.independent+1e-12&&p.independent<=p.upper+1e-12);assert.ok(p.both<=Math.min(a,b)+1e-12);
  }
  for(const a of [-.1,1.1,NaN,Infinity])assert.throws(()=>jointSurvivalBounds(a,.5));
});
test('two-phase funding agrees with an independent pair of deferred annuity present values',()=>{
  const d=defaults('jointLongevity'),factor=(r,n)=>r===0?n:(1-(1+r)**(-n))/r;
  for(const real of [-2,0,2,5])for(const oneYear of [1,15,35])for(const years of [10,30,35]){
    const p=survivorBudget({...d,real,oneYear,years}),n=Math.min(years,oneYear-1),r=real/100;
    const expected=d.bothGap*factor(r,n)+d.oneGap*(1+r)**(-n)*factor(r,years-n);
    near(p.presentValue,expected);near(p.undiscounted,d.bothGap*n+d.oneGap*(years-n));
  }
  const p=survivorBudget(d);near(p.undiscounted,624000);near(p.presentValue,475773.6925415924);near(p.capitalGap,75773.6925415924);
});
test('the selected transition includes that year and is not inferred from a survival probability',()=>{
  const d=defaults('jointLongevity'),p=survivorBudget(d);assert.equal(p.rows[13].gap,24000);assert.equal(p.rows[14].gap,18000);
  const beyond=survivorBudget({...d,oneYear:35});assert.ok(beyond.rows.every(r=>r.gap===d.bothGap));
  const immediate=survivorBudget({...d,oneYear:1});assert.ok(immediate.rows.every(r=>r.gap===d.oneGap));
  const zero=survivorBudget({...d,bothGap:0,oneGap:0});near(zero.presentValue,0);near(zero.capitalGap,0);
});
test('budget edits leave both source-derived figures and the independence metric unchanged',()=>{
  const d=defaults('jointLongevity'),base=planningResult('jointLongevity'),edited=planningResult('jointLongevity',{...d,bothGap:50000,oneGap:60000,oneYear:1,years:35,real:-2,capital:0});
  assert.deepEqual(edited.charts[0],base.charts[0]);assert.deepEqual(edited.charts[1],base.charts[1]);assert.deepEqual(edited.metrics[0],base.metrics[0]);assert.notEqual(edited.metrics[1][1],base.metrics[1][1]);
  assert.equal(validInputs('jointLongevity',{...d,oneYear:15.5}),false);
});
test('all input boundaries render four finite charts and four accessible data tables',()=>{
  const d=defaults('jointLongevity'),fields=definitions.jointLongevity.fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const input of inputs){const result=planningResult('jointLongevity',input);finite(result);assert.equal(result.charts.length,4);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
