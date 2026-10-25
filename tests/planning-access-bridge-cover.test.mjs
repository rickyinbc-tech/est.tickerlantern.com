import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,planningResult,validInputs,definitions} from '../src/planning-models.js';
import {accessBridgeCoverDefinitions,rdspSinglePayment,bridgeEndCash,rebuildingGap} from '../src/planning-access-bridge-cover-models.js';
import {accessBridgeCoverGuides} from '../src/planning-access-bridge-cover-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderFigure} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('ordinary RDSP payment has separate beneficiary and government outflows',()=>{
 const p=rdspSinglePayment(defaults('rdspRepaymentCash'));
 assert.equal(p.payment,5000);assert.equal(p.repayment,15000);assert.equal(p.remaining,80000);assert.equal(p.remainingHoldback,6000);assert.equal(p.unpaid,0);
});
test('RDSP proportional repayment stops at the confirmed AHA',()=>{
 const i=defaults('rdspRepaymentCash');
 for(const payment of [1000,7000,10000]){
  const p=rdspSinglePayment({...i,rdspRequest:payment});assert.equal(p.repayment,Math.min(3*payment,21000));near(p.remaining,100000-payment-p.repayment);
 }
 const p=rdspSinglePayment({...i,rdspHoldback:0,rdspRequest:10000});assert.equal(p.repayment,0);assert.equal(p.remaining,90000);
});
test('issuer capacity and assets above opening AHA independently cap the illustration',()=>{
 const i=defaults('rdspRepaymentCash');
 const annual=rdspSinglePayment({...i,rdspCap:1000});assert.equal(annual.payment,1000);assert.equal(annual.unpaid,4000);
 const assets=rdspSinglePayment({...i,rdspValue:25000});assert.equal(assets.payment,4000);assert.equal(assets.repayment,12000);assert.equal(assets.remaining,9000);assert.equal(assets.remainingHoldback,9000);
});
test('insufficient assets for the entered AHA produce no beneficiary payment',()=>{
 const p=rdspSinglePayment({...defaults('rdspRepaymentCash'),rdspValue:10000});assert.equal(p.payment,0);assert.equal(p.repayment,0);assert.equal(p.remaining,10000);assert.equal(p.holdbackGap,11000);
});
test('RDSP cash conservation and remaining holdback hold across request sizes',()=>{
 for(const value of [0,25000,100000])for(const aha of [0,5000,21000,30000])for(const request of [0,1000,7000,100000]){
  const i={...defaults('rdspRepaymentCash'),rdspValue:value,rdspHoldback:aha,rdspRequest:request},p=rdspSinglePayment(i);
  near(p.remaining+p.payment+p.repayment,value);near(p.remainingHoldback+p.repayment,aha);assert.ok(p.remaining>=0);assert.ok(p.payment<=p.roomAboveHoldback);assert.ok(p.payment<=i.rdspCap);
  if(aha<=value)assert.ok(p.remaining>=p.remainingHoldback);
 }
});
test('RDSP curve points are independent alternatives from one snapshot',()=>{
 const i=defaults('rdspRepaymentCash'),chart=planningResult('rdspRepaymentCash',i).charts[1];
 for(let n=0;n<21;n++){
  const repay=chart.series[0].rows[n],draw=chart.series[1].rows[n];near(repay.value,Math.min(3*repay.x,i.rdspHoldback));near(draw.value,repay.x+repay.value);
 }
});
test('pension bridge ceases in the selected age band without extending to later income',()=>{
 const i={...defaults('pensionBridgeEnd'),pensionStartAge:60,bridgeStopAge:62,laterStartAge:70,pensionYears:5,lifetimeNet:30000,bridgeNet:10000,laterNet:10000,pensionSpend:40000,pensionInflation:0,bridgeCash:25000};
 const p=bridgeEndCash(i);assert.deepEqual(p.rows.slice(1).map(r=>r.bridge),[10000,10000,0,0,0]);assert.equal(p.required,30000);assert.equal(p.additional,5000);assert.equal(p.cash,-5000);
});
test('matching transition ages can remove the calendar gap with the entered amounts',()=>{
 const i={...defaults('pensionBridgeEnd'),pensionStartAge:60,bridgeStopAge:62,laterStartAge:62,pensionYears:5,lifetimeNet:30000,bridgeNet:10000,laterNet:10000,pensionSpend:40000,pensionInflation:0,bridgeCash:0};
 const p=bridgeEndCash(i);assert.equal(p.required,0);assert.equal(p.cash,0);assert.ok(p.rows.slice(1).every(r=>r.income===40000));
});
test('the pension reserve measures the deepest annual gap rather than only the endpoint',()=>{
 const i=defaults('pensionBridgeEnd'),p=bridgeEndCash(i);near(p.required,55013.362692032);near(p.additional,25013.362692032);near(p.cash,-15154.229158289512);
 assert.ok(p.required>Math.max(0,i.bridgeCash-p.cash));
 const funded=bridgeEndCash({...i,bridgeCash:p.required});assert.ok(funded.rows.every(r=>r.value>=-1e-6));near(funded.additional,0);
});
test('pension ledger saves surpluses, conserves cash and handles out-of-horizon changes',()=>{
 for(const inflation of [0,2,6]){
  const i={...defaults('pensionBridgeEnd'),pensionInflation:inflation},p=bridgeEndCash(i);near(p.cash,i.bridgeCash+p.totalIncome-p.totalSpend);
 }
 const i={...defaults('pensionBridgeEnd'),pensionStartAge:50,bridgeStopAge:80,laterStartAge:85,pensionYears:5},p=bridgeEndCash(i);
 assert.ok(p.rows.slice(1).every(r=>r.bridge>0&&r.later===0));
 const years=planningResult('pensionBridgeEnd',i).charts[0].rows.map(r=>Number(r.label.replace('Age ','')));assert.deepEqual(years,[50,54]);
});
test('rebuilding payout and cash need match the disclosed contract by hand',()=>{
 const i=defaults('rebuildingCashGap'),p=rebuildingGap(i);
 near(p.cost,650000*1.05**5);near(p.limit,600000*1.02**5);near(p.payout,600000*1.02**5-2500);
 near(p.owner,p.cost-p.payout);near(p.extra,p.owner-50000);
 const today=rebuildingGap(i,0);near(today.payout,597500);near(today.owner,52500);near(today.extra,2500);
});
test('market value has no mathematical role in the rebuilding result',()=>{
 const i=defaults('rebuildingCashGap');assert.deepEqual(rebuildingGap(i),rebuildingGap({...i,homeMarket:0}));assert.deepEqual(rebuildingGap(i),rebuildingGap({...i,homeMarket:5000000}));
});
test('deductibles and limits never create a negative payout or overpayment',()=>{
 const i=defaults('rebuildingCashGap');
 for(const rebuildNow of [0,1000,650000])for(const buildingLimit of [0,1000,1000000])for(const buildingDeductible of [0,2500,50000]){
  const p=rebuildingGap({...i,rebuildNow,buildingLimit,buildingDeductible},0);assert.ok(p.payout>=0&&p.payout<=p.cost);near(p.payout+p.owner,p.cost);
 }
 const p=rebuildingGap({...i,buildingLimit:1000000},0);near(p.owner,2500);
});
test('assigned cash changes the funding gap without changing the insurance calculation',()=>{
 const i=defaults('rebuildingCashGap'),a=rebuildingGap(i),b=rebuildingGap({...i,rebuildCash:500000});near(a.payout,b.payout);near(b.extra,0);assert.ok(b.cashLeft>0);
});
test('new guides have distinct identifiers, detailed prose and linked source scope',()=>{
 const kinds=new Set();
 for(const g of accessBridgeCoverGuides){assert.ok(!kinds.has(g.planning));kinds.add(g.planning);assert.ok(accessBridgeCoverDefinitions[g.planning]);
  assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>=700);
  for(const slug of g.related)assert.ok(planningGuides.some(row=>row.slug===slug));
  assert.equal(planningResult(g.planning).charts.length,4);assert.ok(g.sources.every(s=>s.url.startsWith('https://')));
 }
});
test('new whole-year inputs reject fractions and non-finite values',()=>{
 for(const key of ['pensionStartAge','bridgeStopAge','laterStartAge','pensionYears'])assert.equal(validInputs('pensionBridgeEnd',{...defaults('pensionBridgeEnd'),[key]:60.5}),false);
 assert.equal(validInputs('rebuildingCashGap',{...defaults('rebuildingCashGap'),lossYear:1.5}),false);
 assert.equal(validInputs('rdspRepaymentCash',{...defaults('rdspRepaymentCash'),rdspRequest:NaN}),false);
});
test('every new field boundary renders finite accessible charts at narrow width',()=>{
 for(const kind of Object.keys(accessBridgeCoverDefinitions)){
  assert.equal(definitions[kind],accessBridgeCoverDefinitions[kind]);
  for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max]){
   const i={...defaults(kind),[key]:value};assert.ok(validInputs(kind,i));
   for(const c of planningResult(kind,i).charts){const html=renderFigure(c,300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/View chart data/);assert.match(html,/role="img"/);}
  }
 }
});
