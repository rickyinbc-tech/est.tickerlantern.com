import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult,validInputs } from '../src/planning-models.js';
import { simpleMortgageCharge } from '../src/planning-mortgage-charge-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('simple mortgage charge separates the two methods and selects one without adding them',()=>{
  const p=simpleMortgageCharge(defaults('mortgageCharge'));near(p.threeMonth,4812.5);near(p.annualDifference,.015);near(p.simpleIrd,10500);near(p.higherOf,10500);near(p.exitCost,10900);near(p.payoffCash,360900);near(p.crossoverMonths,11);
  assert.notEqual(p.higherOf,p.threeMonth+p.simpleIrd);
});
test('nonpositive rate gaps produce no simple IRD while the declared higher-of floor remains',()=>{
  const input=defaults('mortgageCharge');
  for(const comparisonRate of [input.chargeRate,15]){const p=simpleMortgageCharge({...input,comparisonRate});near(p.annualDifference,0);near(p.simpleIrd,0);near(p.higherOf,p.threeMonth);assert.equal(p.crossoverMonths,null);}
  const zero=simpleMortgageCharge({...input,chargeRate:0});near(zero.higherOf,0);near(zero.exitCost,400);near(zero.payoffCash,350400);
});
test('the charge-method crossover is equality between methods, with independent term scenarios',()=>{
  const input=defaults('mortgageCharge'),before=simpleMortgageCharge({...input,chargeMonths:10}),tie=simpleMortgageCharge({...input,chargeMonths:11}),after=simpleMortgageCharge({...input,chargeMonths:12});
  assert.ok(before.simpleIrd<before.threeMonth);near(tie.simpleIrd,tie.threeMonth);assert.ok(after.simpleIrd>after.threeMonth);
  const chart=planningResult('mortgageCharge').charts[1];assert.equal(chart.series[0].rows.length,60);assert.equal(chart.series[1].rows.length,60);
  for(let i=0;i<60;i++){near(chart.series[0].rows[i].value,4812.5);near(chart.series[1].rows[i].value,350000*.015*(i+1)/12);}
});
test('exit-cost cash and principal settlement reconcile without treating principal as a fee',()=>{
  const input=defaults('mortgageCharge'),base=simpleMortgageCharge(input),changed=simpleMortgageCharge({...input,exitFees:1400});
  near(changed.higherOf,base.higherOf);near(changed.exitCost-base.exitCost,1000);near(changed.payoffCash-base.payoffCash,1000);
  near(planningResult('mortgageCharge').charts[3].rows.reduce((n,r)=>n+r.value,0),base.payoffCash);near(base.payoffCash-base.exitCost,input.chargeBalance);
});
test('balance scenarios scale the simple charge and keep the separately entered other costs fixed',()=>{
  const input=defaults('mortgageCharge'),rows=planningResult('mortgageCharge').charts[4].rows;
  near(rows[0].value,5650);near(rows[1].value,8275);near(rows[2].value,10900);
  near(rows[0].value-input.exitFees,(rows[2].value-input.exitFees)/2);assert.notEqual(rows[0].value,rows[2].value/2);
});
test('comparison-rate matrix retains its three-month floor and excludes other costs',()=>{
  const grid=planningResult('mortgageCharge').charts[2];near(grid.rows[0].values[0],6125);near(grid.rows[0].values[1],4812.5);near(grid.rows[2].values[2],10500);near(grid.rows[3].values[4],4812.5);
  assert.deepEqual(planningResult('mortgageCharge',{...defaults('mortgageCharge'),exitFees:5000}).charts[2],grid);
});
test('an unexpired whole-month term is required and five charts remain finite at input boundaries',()=>{
  const kind='mortgageCharge',d=defaults(kind),fields=definitions[kind].fields;assert.equal(validInputs(kind,{...d,chargeMonths:0}),false);assert.equal(validInputs(kind,{...d,chargeMonths:1.5}),false);
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,5);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
});
