import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, validInputs, planningResult } from '../src/planning-models.js';
import { warrantyComparison } from '../src/planning-warranty-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('the eligible repair probability conditions on a repair and the three states sum to one',()=>{
  const d=defaults('extendedWarranty');
  for(const eventProbability of [0,1,40,99,100])for(const eligibleShare of [0,1,70,100]){
    const p=warrantyComparison({...d,eventProbability,eligibleShare}),s=p.states;
    near(s.reduce((n,r)=>n+r.probability,0),1);near(s[1].probability,eventProbability*eligibleShare/10000);
    near(s[1].probability+s[2].probability,eventProbability/100);assert.ok(s.every(r=>r.probability>=0&&r.probability<=1));
  }
  assert.deepEqual(warrantyComparison(d).states.map(s=>s.probability).map(x=>Math.round(x*100)),[60,28,12]);
});
test('the payment limit is applied after the deductible and never exceeds repair cost',()=>{
  const d=defaults('extendedWarranty');near(warrantyComparison(d).payment,500);
  near(warrantyComparison({...d,payoutCap:1000}).payment,750);
  near(warrantyComparison({...d,deductible:800}).payment,0);
  near(warrantyComparison({...d,deductible:1000}).payment,0);
  near(warrantyComparison({...d,payoutCap:0}).payment,0);
  for(const repairCost of [0,50,800,10000])for(const deductible of [0,50,3000])for(const payoutCap of [0,500,10000]){
    const p=warrantyComparison({...d,repairCost,deductible,payoutCap});assert.ok(p.payment>=0&&p.payment<=repairCost&&p.payment<=payoutCap);
  }
});
test('default state costs include the initial price exactly once and reconcile independent weighted sums',()=>{
  const d=defaults('extendedWarranty'),p=warrantyComparison(d);
  assert.deepEqual(p.states.map(s=>s.without),[0,800,800]);assert.deepEqual(p.states.map(s=>s.with),[180,480,980]);
  near(p.without,p.states.reduce((n,s)=>n+s.probability*s.without,0));
  near(p.withContract,p.states.reduce((n,s)=>n+s.probability*s.with,0));
  near(p.expectedPayment,p.states.reduce((n,s)=>n+s.probability*s.provider,0));
  near(p.without,320);near(p.expectedPayment,140);near(p.withContract,360);near(p.extra,40);
});
test('the cost-equality probability is an algebraic threshold with explicit infeasible and no-payment cases',()=>{
  const d=defaults('extendedWarranty'),p=warrantyComparison(d);near(p.breakEven,180/350);
  const equal=warrantyComparison({...d,eventProbability:p.breakEven*100});near(equal.withContract,equal.without);
  assert.ok(warrantyComparison({...d,contractPrice:500}).breakEven>1);
  for(const edit of [{eligibleShare:0},{payoutCap:0},{repairCost:0},{deductible:1000}]){
    const v=warrantyComparison({...d,...edit});assert.equal(v.breakEven,null);near(v.extra,d.contractPrice);
  }
  assert.match(planningResult('extendedWarranty',{...d,eligibleShare:0}).note,/no event probability can recover/);
  assert.match(planningResult('extendedWarranty',{...d,contractPrice:0,eligibleShare:0}).note,/tie at every event probability/);
});
test('the endpoints preserve no-event and certain-event costs without invented claims or refunds',()=>{
  const d=defaults('extendedWarranty'),zero=warrantyComparison({...d,eventProbability:0});near(zero.without,0);near(zero.withContract,d.contractPrice);
  const certain=warrantyComparison({...d,eventProbability:100,eligibleShare:100});near(certain.without,800);near(certain.withContract,480);
  const excluded=warrantyComparison({...d,eventProbability:100,eligibleShare:0});near(excluded.withContract,980);
  const free=warrantyComparison({...d,contractPrice:0});near(free.extra,-140);near(free.breakEven,0);
});
test('charts reconcile the same model and only the appropriate curves change with selected event probability',()=>{
  const d=defaults('extendedWarranty'),p=warrantyComparison(d),r=planningResult('extendedWarranty',d);
  near(r.charts[2].rows.reduce((n,row)=>n+row.value,0),p.withContract);
  const forty=r.charts[3].series.map(s=>s.rows.find(row=>row.x===40).value);near(forty[0],p.without);near(forty[1],p.withContract);
  const edited=planningResult('extendedWarranty',{...d,eventProbability:0});assert.deepEqual(edited.charts[3],r.charts[3]);assert.notDeepEqual(edited.charts[0],r.charts[0]);
  near(r.charts[4].rows[2].values[2],180-.4*.75*500);assert.equal(r.charts[4].signed,true);
});
test('all input limits render five finite figures and accessible data tables',()=>{
  const kind='extendedWarranty',d=defaults(kind),variants=[d];
  for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
  for(const input of variants){assert.equal(validInputs(kind,input),true);const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
  assert.equal(validInputs(kind,{...d,eventProbability:101}),false);assert.equal(validInputs(kind,{...d,repairCost:-1}),false);
});
