import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {deferredCashValues} from '../src/planning-deferred-cash-models.js';
import {renderResult} from '../src/planning-charts.js';
const kind='deferredCash',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('default present and future comparisons reconcile on the same compounding basis',()=>{
  const input=defaults(kind),p=deferredCashValues(input);let grown=input.cashNow;
  for(let year=0;year<input.deferredYears;year++)grown*=1+input.comparisonRate/100;
  near(p.futureNow,grown);near(p.present,20732.102364755425);near(p.presentDifference,732.1023647554248);
  near(p.futureDifference,847.5);near(p.present*p.factor,input.laterCash);near(p.presentDifference*p.factor,p.futureDifference);
  const bridge=planningResult(kind).charts[2];near(bridge.rows.reduce((s,r)=>s+r.value,0),p.presentDifference);
});
test('break-even rate compounds to the offered later receipt, including zero and negative cases',()=>{
  const base=defaults(kind);
  for(const laterCash of [100,18000,20000,24000,1000000])for(const deferredYears of [1,3,30]){
    const input={...base,laterCash,deferredYears},p=deferredCashValues(input),matched=deferredCashValues(input,p.breakEven*100);
    near(matched.futureNow,laterCash);near(matched.presentDifference,0);
  }
  near(deferredCashValues(base).breakEven,.06265856918261106);
  near(deferredCashValues({...base,laterCash:base.cashNow}).breakEven,0);
  assert.ok(deferredCashValues({...base,laterCash:18000}).breakEven<0);
  assert.ok(deferredCashValues({...base,cashNow:100,laterCash:1000000,deferredYears:1}).breakEven>.2);
});
test('discounting preserves ordering across dates and isolates rate and waiting-time sensitivities',()=>{
  const input=defaults(kind);
  for(const years of [1,3,5,10]){
    const cases=[0,3,6,9,20].map(rate=>deferredCashValues(input,rate,years));
    assert.ok(cases.every((p,i)=>!i||p.present<cases[i-1].present));
    cases.forEach(p=>assert.equal(Math.sign(p.presentDifference),Math.sign(p.futureDifference)));
  }
  near(deferredCashValues(input,0,1).present,deferredCashValues(input,0,30).present);
  assert.ok(deferredCashValues(input,5,30).present<deferredCashValues(input,5,3).present);
  const matrix=planningResult(kind).charts.at(-1);near(matrix.rows[1].values[0],4000);
});
test('supported extrema, very high implied rates and whole-year validation stay finite and inspectable',()=>{
  const base=defaults(kind),fields=definitions[kind].fields,cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
  for(const input of cases){assert.ok(validInputs(kind,input));const result=planningResult(kind,input);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
  assert.equal(validInputs(kind,{...base,deferredYears:1.5}),false);assert.equal(validInputs(kind,{...base,cashNow:0}),false);
});
