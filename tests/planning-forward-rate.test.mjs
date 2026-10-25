import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {forwardRateComparison} from '../src/planning-forward-rate-models.js';
import {renderResult} from '../src/planning-charts.js';
const kind='forwardRate',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('forward rate equalizes a common two-year value and the default selected rate falls short',()=>{
  const p=forwardRateComparison(defaults(kind));
  near(p.firstYear,10400);near(p.locked,11025);near(p.rolled,10920);near(p.implied,.060096153846153744);
  near(p.firstInterest,400);near(p.secondInterest,520);near(p.difference,-105);
});
test('growth-factor identity and independently derived dollar shortfall hold across supported spot rates',()=>{
  const base=defaults(kind);
  for(const forwardCapital of [0,10000,1000000])for(const forwardOneYearSpot of [0,4,8,12])for(const forwardTwoYearSpot of [0,2,5,12]){
    const input={...base,forwardCapital,forwardOneYearSpot,forwardTwoYearSpot},p=forwardRateComparison(input);
    near((1+forwardOneYearSpot/100)*(1+p.implied),(1+forwardTwoYearSpot/100)**2);
    assert.ok(p.implied>=-.15 && p.implied<=.30);
    near(forwardRateComparison(input,p.implied*100).difference,0);
    for(const actual of [-15,0,5,30]){
      const result=forwardRateComparison(input,actual);
      near(result.difference,p.firstYear*(actual/100-p.implied));
      near(forwardCapital+result.firstInterest+result.secondInterest,result.rolled);
    }
  }
});
test('inverted positive spot rates preserve a negative forward and negative year-two growth subtracts value',()=>{
  const input={...defaults(kind),forwardOneYearSpot:8,forwardTwoYearSpot:2,forwardReinvest:-5},p=forwardRateComparison(input);
  near(p.implied,-.036666666666666625);near(p.firstYear,10800);near(p.secondInterest,-540);near(p.rolled,10260);
  const result=planningResult(kind,input);assert.ok(result.charts[0].rows[2].value<0);assert.ok(result.charts[2].rows[2].value<0);
});
test('terminal curve uses the unknown year-two rate and marks the selected assumption at its computed value',()=>{
  const input={...defaults(kind),forwardReinvest:7.25},result=planningResult(kind,input),curve=result.charts[1];
  assert.equal(curve.xMin,-15);assert.equal(curve.series[0].rows[0].x,-15);assert.equal(curve.series[0].rows.at(-1).x,30);
  assert.ok(curve.series[0].rows.every((r,i,rows)=>!i||r.value>rows[i-1].value));
  assert.deepEqual(curve.series[2].rows,[{x:7.25,value:forwardRateComparison(input).rolled}]);
  const zero=planningResult(kind,{...input,forwardCapital:0});assert.match(zero.charts[1].title,/zero at every rate/);
  assert.ok(zero.charts[1].series.every(s=>s.rows.every(r=>r.value===0)));
});
test('matrix overrides only its two axes and uses the common two-year date',()=>{
  const input=defaults(kind),grid=planningResult(kind,input).charts[3];
  assert.deepEqual(grid,planningResult(kind,{...input,forwardReinvest:30,forwardTwoYearSpot:0}).charts[3]);
  for(const [i,two] of [2,4,6,8].entries())for(const [j,second] of [-5,0,5,10].entries()){
    near(grid.rows[i].values[j],10000*(1.04*(1+second/100)-(1+two/100)**2));
  }
});
test('all field extremes remain finite with four accessible figures and tables',()=>{
  const base=defaults(kind),fields=definitions[kind].fields;
  const cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
  for(const input of cases){assert.ok(validInputs(kind,input));for(const width of [300,760]){
    const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
    assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);
  }}
  assert.equal(validInputs(kind,{...base,forwardReinvest:-16}),false);
});
