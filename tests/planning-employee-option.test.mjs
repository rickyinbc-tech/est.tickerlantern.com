import test from 'node:test';
import assert from 'node:assert/strict';
import {employeeVestedUnits,employeeOptionLedger} from '../src/planning-employee-option-models.js';
import {employeeOptionGuides} from '../src/planning-employee-option-guides.js';
import {defaults,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderFigure} from '../src/planning-charts.js';
const base=defaults('employeeOptionCash');
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} versus ${b}`);

test('the authored cliff catches up service without treating the grant as vested before month twelve',()=>{
  assert.deepEqual([0,11,12,18,24,36,48].map(m=>employeeVestedUnits(1200,m)),[0,0,300,450,600,900,1200]);
  const p=employeeOptionLedger(base);assert.equal(p.vested,450);assert.equal(p.unvested,750);
  assert.ok(p.milestones.some(r=>r.month===18&&r.vested===450));
  assert.ok(p.milestones.every(r=>r.vested+r.unvested===1200));
  assert.deepEqual(p.milestones.map(r=>r.month),[0,11,12,18,24,36,48]);
});
test('odd grants round cumulative units down and release the full remaining balance at the final month',()=>{
  for(const grant of [1,7,1001,49999]){
    const path=Array.from({length:49},(_,m)=>employeeVestedUnits(grant,m));
    assert.ok(path.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=grant&&(i===0||v>=path[i-1])));
    assert.equal(path[11],0);assert.equal(path[12],Math.floor(grant/4));assert.equal(path[48],grant);
    for(let m=12;m<48;m++){assert.ok(path[m]<=grant*m/48);assert.ok(grant*m/48-path[m]<1);}
  }
});
test('intrinsic spread, gross sale proceeds and strike funding remain separate amounts',()=>{
  const p=employeeOptionLedger(base);assert.equal(p.strikeCash,22500);assert.equal(p.intrinsicSpread,4500);assert.equal(p.fundingGap,17500);
  assert.equal(p.saleGross,27000);assert.equal(p.saleStrikeCost,22500);assert.equal(p.saleSpread,4500);
  const result=planningResult('employeeOptionCash',base);near(result.charts[2].rows.reduce((s,r)=>s+r.value,0),p.intrinsicSpread);
  assert.equal(result.charts[3].rows[0].value,5000);
});
test('underwater or at-strike options have zero intrinsic spread and no assumed sale, without erasing the conditional strike requirement',()=>{
  for(const optionSharePrice of [0,40,50]){
    const p=employeeOptionLedger({...base,optionSharePrice});
    assert.equal(p.intrinsicSpread,0);assert.equal(p.illustrativeExerciseUnits,0);assert.equal(p.saleGross,0);assert.equal(p.saleStrikeCost,0);
    assert.equal(p.strikeCash,22500);assert.equal(p.fundingGap,17500);
  }
});
test('only vested units create an exercise illustration even if the quote is far above strike',()=>{
  const p=employeeOptionLedger({...base,optionServiceMonths:11,optionSharePrice:1000});
  assert.equal(p.vested,0);assert.equal(p.unvested,1200);assert.equal(p.intrinsicSpread,0);assert.equal(p.saleGross,0);assert.equal(p.strikeCash,0);assert.equal(p.fundingGap,0);
  assert.ok(p.payoff.every(r=>r.value===0));
});
test('cash capacity changes the hold-funding gap without changing vesting, option spread or assumed sale components',()=>{
  const a=employeeOptionLedger(base),b=employeeOptionLedger({...base,optionExerciseCash:22500}),c=employeeOptionLedger({...base,optionExerciseCash:1000000});
  for(const key of ['vested','unvested','strikeCash','intrinsicSpread','saleGross','saleStrikeCost','saleSpread'])assert.equal(a[key],b[key]);
  assert.equal(b.fundingGap,0);assert.equal(c.fundingGap,0);
});
test('the price sensitivity includes the exact strike and quote and preserves the payoff kink',()=>{
  const input={...base,optionStrike:53,optionSharePrice:71},p=employeeOptionLedger(input);
  assert.ok(p.payoff.some(r=>r.x===53&&r.value===0));assert.ok(p.payoff.some(r=>r.x===71&&r.value===8100));
  assert.ok(p.payoff.every((r,i)=>Number.isFinite(r.value)&&r.value>=0&&(i===0||r.x>p.payoff[i-1].x)));
  const lo=p.payoff.filter(r=>r.x>53);near((lo.at(-1).value-lo[0].value)/(lo.at(-1).x-lo[0].x),450);
});
test('zero grants and zero strikes are finite arithmetic cases; unsupported fractional units and months are rejected',()=>{
  for(const optionGrant of [0,1,50000])for(const optionServiceMonths of [0,11,12,48])for(const optionStrike of [0,500]){
    const input={...base,optionGrant,optionServiceMonths,optionStrike,optionSharePrice:1000,optionExerciseCash:0};
    assert.equal(validInputs('employeeOptionCash',input),true);const p=employeeOptionLedger(input);
    assert.ok([p.intrinsicSpread,p.strikeCash,p.fundingGap,p.saleSpread].every(Number.isFinite));
    near(p.saleSpread,p.intrinsicSpread);assert.ok(p.vested<=optionGrant);
  }
  for(const change of [{optionGrant:1.5},{optionServiceMonths:12.5},{optionServiceMonths:49},{optionSharePrice:-1},{optionStrike:NaN}]){
    assert.equal(validInputs('employeeOptionCash',{...base,...change}),false);assert.throws(()=>planningResult('employeeOptionCash',{...base,...change}));
  }
});
test('four figure types render accessible charts and tables for both default and degenerate cases',()=>{
  for(const input of [base,{...base,optionGrant:0,optionSharePrice:0},{...base,optionServiceMonths:11},{...base,optionStrike:0}]){
    const result=planningResult('employeeOptionCash',input);assert.equal(new Set(result.charts.map(c=>c.type)).size,4);
    assert.equal(new Set(result.charts.map(c=>c.id)).size,4);
    for(const c of result.charts)for(const width of [300,354,760]){
      const html=renderFigure(c,width);assert.match(html,/role="img"/);assert.match(html,/<table/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
    }
  }
});
test('the English guide explains the authored convention and links valid, distinct planning topics',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const guide of employeeOptionGuides){
    assert.ok(slugs.has(guide.slug));assert.equal(guide.sections.length,6);assert.ok(guide.related.every(s=>slugs.has(s)));
    const prose=guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ');assert.ok(prose.trim().split(/\s+/).length>=900);
    assert.match(prose,/CAD 22,500/);assert.match(prose,/CAD 17,500/);assert.match(prose,/full option fair value/);assert.match(guide.chartScope,/original hypothetical CAD/);
  }
});
