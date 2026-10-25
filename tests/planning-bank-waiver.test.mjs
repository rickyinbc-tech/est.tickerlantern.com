import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {bankWaiverPlan} from '../src/planning-bank-waiver-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);

test('the default comparison counts the incremental balance and reconciles fees, opportunity cost and ending resources',()=>{
 const p=bankWaiverPlan(defaults('bankWaiver'));
 assert.equal(p.extra,2500);assert.equal(p.feesWithoutExtra,180);assert.equal(p.interest,75);assert.equal(p.advantage,105);
 assert.equal(p.withExtra,2680);assert.equal(p.withoutExtra,2575);near(p.withExtra-p.withoutExtra,p.advantage);
});
test('an independent monthly ledger matches the annual result with equal starting resources and equal household deposits',()=>{
 for(const minimumBalance of [500,4000,10000])for(const workingFloor of [0,1500,10000])for(const monthlyFee of [0,15,40])for(const alternativeRate of [0,3,10]){
  const input={minimumBalance,workingFloor,monthlyFee,alternativeRate},p=bankWaiverPlan(input),startingCash=Math.max(0,minimumBalance-workingFloor);
  let alternativeCash=startingCash,waiverSavedBudget=0,paySavedBudget=0;
  const monthlyReturn=Math.pow(1+alternativeRate/100,1/12)-1;
  for(let month=1;month<=12;month++){
   alternativeCash*=1+monthlyReturn;
   waiverSavedBudget+=monthlyFee;
   paySavedBudget+=monthlyFee-(workingFloor<minimumBalance?monthlyFee:0);
  }
  near(p.withExtra,startingCash+waiverSavedBudget);near(p.withoutExtra,alternativeCash+paySavedBudget);
  near(p.advantage,startingCash+waiverSavedBudget-alternativeCash-paySavedBudget);
 }
});
test('an existing qualifying working floor gives both choices the waiver and creates no incremental return',()=>{
 const d=defaults('bankWaiver');
 for(const workingFloor of [4000,5000,10000]){
  const p=bankWaiverPlan({...d,workingFloor});assert.equal(p.extra,0);assert.equal(p.feesWithoutExtra,0);assert.equal(p.interest,0);assert.equal(p.advantage,0);
  assert.equal(p.withExtra,180);assert.equal(p.withoutExtra,180);
  const r=planningResult('bankWaiver',{...d,workingFloor});assert.deepEqual(r.charts[0].rows[0].values,r.charts[0].rows[1].values);
  assert.ok(r.charts[2].series[0].rows.every(row=>row.value===0));
 }
});
test('the cash-return hurdle reverses the comparison and zero fees do not generate a waiver benefit',()=>{
 const d=defaults('bankWaiver');
 near(bankWaiverPlan({...d,alternativeRate:7.2}).advantage,0);
 assert.ok(bankWaiverPlan({...d,alternativeRate:10}).advantage<0);
 assert.equal(bankWaiverPlan({...d,alternativeRate:0}).advantage,180);
 assert.equal(bankWaiverPlan({...d,monthlyFee:0}).advantage,-75);
 // Shared working cash changes the incremental requirement, not the full threshold.
 assert.equal(bankWaiverPlan({...d,workingFloor:0}).interest,120);
});
test('the four figures reconcile both resource choices and label the positive-extra sensitivity assumptions',()=>{
 const d=defaults('bankWaiver'),p=bankWaiverPlan(d),r=planningResult('bankWaiver');
 near(r.charts[0].rows[0].values.reduce((a,b)=>a+b,0),p.withExtra);near(r.charts[0].rows[1].values.reduce((a,b)=>a+b,0),p.withoutExtra);
 near(r.charts[1].rows.reduce((a,b)=>a+b.value,0),p.advantage);assert.equal(r.metrics[2][1],p.advantage);
 assert.equal(r.charts[3].signed,true);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const model=bankWaiverPlan({...d,workingFloor:0,minimumBalance:[1000,2500,4000,6000][col],monthlyFee:[10,15,20,30][row]});
  near(r.charts[3].rows[row].values[col],model.advantage);
 }
});
test('all field boundaries produce four finite charts and data tables, including zero-extra cases',()=>{
 const d=defaults('bankWaiver'),fields=definitions.bankWaiver.fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const r=planningResult('bankWaiver',input);assert.equal(new Set(r.charts.map(c=>c.id)).size,4);
  for(const width of [300,1000]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
