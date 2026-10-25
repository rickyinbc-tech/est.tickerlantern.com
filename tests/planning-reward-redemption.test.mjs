import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { rewardRedemptionCost } from '../src/planning-reward-redemption-models.js';
import { format, renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('the default separates point shortfall, mandatory cash, cash avoided and existing-point other use',()=>{
 const d=defaults('rewardRedemption'),p=rewardRedemptionCost(d);near(p.ownedUsed,15000);near(p.missing,15000);near(p.pointPurchase,225);near(p.cashOutlay,325);near(p.cashSaved,275);near(p.ownedValue,150);near(p.netComparison,125);near(p.impliedCents,5/3);near(p.pointsLeft,0);
});
test('using a lower matched cash price changes the comparison without changing the redemption cash or point quantities',()=>{
 const d=defaults('rewardRedemption'),p=rewardRedemptionCost({...d,cashPrice:420});near(p.cashOutlay,325);near(p.ownedUsed,15000);near(p.missing,15000);near(p.cashSaved,95);near(p.netComparison,-55);near(p.impliedCents,16/15);
});
test('no owned points and a fully funded point balance each count acquired or consumed resources only once',()=>{
 const d=defaults('rewardRedemption'),none=rewardRedemptionCost({...d,ownedPoints:0}),full=rewardRedemptionCost({...d,ownedPoints:30000}),extra=rewardRedemptionCost({...d,ownedPoints:90000});
 near(none.pointPurchase,450);near(none.cashOutlay,550);near(none.netComparison,50);near(none.ownedValue,0);
 near(full.pointPurchase,0);near(full.cashOutlay,100);near(full.cashSaved,500);near(full.ownedValue,300);near(full.netComparison,200);
 near(extra.pointsLeft,60000);near(extra.ownedUsed,30000);near(extra.netComparison,full.netComparison);
});
test('cash and opportunity differences agree with an independent total-resource cost comparison',()=>{
 const d=defaults('rewardRedemption');for(const ownedPoints of [0,15000,30000,90000])for(const purchaseCents of [0,1.5,10])for(const alternativeCents of [0,1,10]){
  const i={...d,ownedPoints,purchaseCents,alternativeCents},p=rewardRedemptionCost(i),buy=Math.max(0,30000-ownedPoints)*purchaseCents/100,used=Math.min(30000,ownedPoints),rewardEconomicCost=100+buy+used*alternativeCents/100;
  near(p.netComparison,600-rewardEconomicCost);near(p.ownedUsed+p.missing,30000);assert.ok(p.pointPurchase>=0&&p.ownedValue>=0);
 }
});
test('chart outlays and the comparison bridge reconcile while cents have their own precise native format',()=>{
 const d=defaults('rewardRedemption'),p=rewardRedemptionCost(d),r=planningResult('rewardRedemption',d);near(r.charts[0].rows[1].values.reduce((a,b)=>a+b,0),p.cashOutlay);near(r.charts[1].rows.reduce((n,row)=>n+row.value,0),p.netComparison);
 assert.equal(format(5/3,'cents'),'1.67¢');assert.equal(format(-.5,'cents'),'-0.50¢');assert.equal(format(2,'cents',true),'2.0¢');
 for(const row of r.charts[2].series[0].rows)near(row.value,(row.x-d.redemptionCash)/d.requiredPoints*100);
});
test('purchase-cost or other-use sensitivities disappear when no corresponding points are acquired or consumed',()=>{
 const d=defaults('rewardRedemption'),full=planningResult('rewardRedemption',{...d,ownedPoints:30000}),none=planningResult('rewardRedemption',{...d,ownedPoints:0});
 for(const row of full.charts[3].rows)assert.deepEqual(row.values,full.charts[3].rows[0].values);
 for(const row of none.charts[3].rows)assert.ok(row.values.every(v=>v===row.values[0]));
});
test('point counts are whole units and every supported input bound produces four finite accessible figures',()=>{
 const kind='rewardRedemption',d=defaults(kind),variants=[d];for(const key of ['requiredPoints','ownedPoints'])assert.equal(validInputs(kind,{...d,[key]:1000.5}),false);
 for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs(kind,input),true);const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/¢/);}
});
