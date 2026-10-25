import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {shareAwardValue} from '../src/planning-share-vesting-models.js';
import {renderResult} from '../src/planning-charts.js';
const kind='shareVesting',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('one award reconciles units and gross value under both schedules at every service date',()=>{
  const input=defaults(kind);
  for(const years of Array.from({length:11},(_,i)=>i))for(const mode of ['cliff','gradual']){
    const p=shareAwardValue(input,years,mode);
    near(p.vestedUnits+p.unvestedUnits,input.awardUnits);near(p.vested+p.unvested,p.total);
    near(p.vested,p.vestedUnits*input.awardPrice);assert.ok(p.fraction>=0&&p.fraction<=1);
  }
  const gradual=shareAwardValue(input),cliff=shareAwardValue(input,2,'cliff');
  near(gradual.vestedUnits,240);near(gradual.unvestedUnits,360);near(gradual.vested,12000);near(gradual.unvested,18000);near(cliff.vested,0);
  assert.throws(()=>shareAwardValue(input,2,'unknown'),/Unknown vesting/);
});
test('schedule ranking reverses at the cliff date and both schedules eventually fully vest',()=>{
  const input=defaults(kind);
  assert.ok(shareAwardValue(input,2).vested>shareAwardValue(input,2,'cliff').vested);
  near(shareAwardValue(input,3,'cliff').vested,30000);near(shareAwardValue(input,3).vested,18000);
  for(const mode of ['cliff','gradual']){near(shareAwardValue(input,5,mode).vested,30000);near(shareAwardValue(input,10,mode).unvested,0);}
  const chart=planningResult(kind).charts[0];assert.ok(chart.series.every(s=>s.step));assert.equal(chart.series[0].rows[2].value,0);assert.equal(chart.series[0].rows[3].value,1);
});
test('valuation price scales dollars independently of vesting percentages and unit counts',()=>{
  const input=defaults(kind),p=shareAwardValue(input),lower=shareAwardValue({...input,awardPrice:30}),zero=shareAwardValue({...input,awardPrice:0});
  near(lower.vestedUnits,p.vestedUnits);near(lower.fraction,p.fraction);near(lower.vested,7200);near(lower.unvested,10800);
  near(zero.total,0);near(zero.vestedUnits,240);near(shareAwardValue({...input,awardUnits:0}).total,0);
  const bridge=planningResult(kind).charts[2];near(bridge.rows.reduce((s,r)=>s+r.value,0),p.vested);
});
test('gradual-only matrix is isolated from the cliff milestone and selected service date',()=>{
  const base=defaults(kind),a=planningResult(kind),b=planningResult(kind,{...base,completedVestingYears:7,awardCliffYears:8});
  assert.deepEqual(a.charts[3],b.charts[3]);near(a.charts[3].rows[1].values[0],0);near(a.charts[3].rows[1].values[2],18000);
  const fractional=shareAwardValue({...base,awardUnits:601},1,'gradual',7);near(fractional.vestedUnits,601/7);near(fractional.vested+fractional.unvested,fractional.total);
});
test('whole-unit and whole-year constraints, zero awards and supported extrema render finite charts',()=>{
  const base=defaults(kind),fields=definitions[kind].fields,cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
  for(const input of cases){assert.ok(validInputs(kind,input));const result=planningResult(kind,input);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
  for(const key of ['awardUnits','completedVestingYears','awardCliffYears','awardGradualYears'])assert.equal(validInputs(kind,{...base,[key]:base[key]+.5}),false);
});
