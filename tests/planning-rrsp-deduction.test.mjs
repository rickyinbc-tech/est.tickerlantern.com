import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {deductionTiming} from '../src/planning-rrsp-deduction-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);

test('the same deduction gives two tax savings compared at the later cash date',()=>{
 const p=deductionTiming(defaults('deductionDelay'));
 near(p.immediate,2500);near(p.currentAtLater,3038.765625);near(p.later,3500);near(p.advantage,461.234375);near(p.growth,538.765625);near(p.breakEvenRate,30.38765625);
});
test('the rate hurdle equates cash values and zero opportunity return removes the wait cost',()=>{
 const d=defaults('deductionDelay');
 for(const years of [1,4,10])for(const rate of [-5,0,10]){
  const input={...d,delayYears:years,return:rate},p=deductionTiming(input);
  near(deductionTiming({...input,laterRate:p.breakEvenRate}).advantage,0);
  let expected=p.immediate;for(let year=0;year<years;year++)expected*=1+rate/100;near(p.currentAtLater,expected);
 }
 const zero=deductionTiming({...d,return:0});near(zero.currentAtLater,2500);near(zero.advantage,1000);
 assert.ok(deductionTiming({...d,laterRate:30}).advantage<0);
});
test('zero deduction gives zero dollar outcomes without dividing by the deduction amount',()=>{
 const result=planningResult('deductionDelay',{...defaults('deductionDelay'),deduction:0});
 assert.ok(result.metrics.every(m=>m[1]===0));assert.ok(result.charts[3].rows.every(r=>r.values.every(v=>v===0)));
});
test('the deferred cash is a single receipt and the waterfall reconciles signed opportunity losses',()=>{
 const d=defaults('deductionDelay'),result=planningResult('deductionDelay');
 assert.deepEqual(result.charts[1].series[1].rows,[{x:0,value:0},{x:4,value:0},{x:4,value:3500}]);
 for(const rate of [-5,0,5,10]){
  const input={...d,return:rate},p=deductionTiming(input),r=planningResult('deductionDelay',input);
  near(r.charts[2].rows.reduce((sum,row)=>sum+row.value,0),p.later-p.currentAtLater);
  if(rate<0)assert.ok(r.charts[2].rows[2].value>0);
 }
 assert.match(result.note,/same already-funded, eligible RRSP contribution/);assert.match(result.note,/held identical and excluded/);
});
test('sensitivity cells replace only the future rate and wait and compare each row at its own endpoint',()=>{
 const d=defaults('deductionDelay'),r=planningResult('deductionDelay');
 for(let row=0;row<4;row++)for(let column=0;column<4;column++){
  const years=[1,3,5,10][row],rate=[20,30,40,50][column];
  const expected=d.deduction*rate/100-d.deduction*d.nowRate/100*Math.pow(1+d.return/100,years);
  near(r.charts[3].rows[row].values[column],expected);
 }
});
test('whole waiting years and all input boundaries produce four finite chart/table pairs',()=>{
 const d=defaults('deductionDelay'),fields=definitions.deductionDelay.fields;
 assert.equal(validInputs('deductionDelay',{...d,delayYears:4.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const result=planningResult('deductionDelay',input);assert.equal(result.charts.length,4);
  for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
