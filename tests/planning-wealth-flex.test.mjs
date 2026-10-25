import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,planningResult,validInputs} from '../src/planning-models.js';
import {wealthSource,wealthFlexDefinitions,liquiditySnapshot,guardrailPlan,guardrailReturns,giftPlan} from '../src/planning-wealth-flex-models.js';
import {wealthFlexGuides} from '../src/planning-wealth-flex-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderFigure} from '../src/planning-charts.js';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-6,`${actual} != ${expected}`);
test('official public observations retain their own units, population and dates',()=>{
 assert.deepEqual(wealthSource.younger.map(r=>r.value),[457100,44000]);
 assert.deepEqual(wealthSource.older.map(r=>r.value),[1400000,914000,359000,11900]);
 assert.equal(wealthSource.released,'2024-10-29');assert.match(wealthSource.scope,/2023 constant CAD/);
 const a=planningResult('wealthHousing'),b=planningResult('wealthHousing',{...defaults('wealthHousing'),cash:40000});
 assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));
});
test('the balance sheet and income-interruption cash requirement reconcile independently',()=>{
 const d=defaults('wealthHousing'),p=liquiditySnapshot(d);near(p.netWorth,970000);near(p.needed,32000);near(p.extra,12000);near(p.ending,-12000);
 near(liquiditySnapshot({...d,homeEquity:d.homeEquity+100000}).extra,p.extra);
 near(liquiditySnapshot({...d,cash:32000}).extra,0);
});
test('zero cash and zero bills have a finite zero stress',()=>{
 const i=Object.fromEntries(wealthFlexDefinitions.wealthHousing.fields.map(([key])=>[key,0]));assert.deepEqual(liquiditySnapshot(i),{netWorth:0,needed:0,extra:0,ending:0});
});
test('the first guardrail decisions match an independent two-year calculation',()=>{
 const i=defaults('spendingGuardrail'),p=guardrailPlan(i);near(p.rows[1].value,(600000-30000)*.82);
 near(p.rows[2].request,30000*1.02*.9);near(p.rows[2].value,((600000-30000)*.82-30000*1.02*.9)*.92);
 near(p.rows[2].floor,22500*1.02);assert.equal(p.rows[2].cutApplied,true);
});
test('a zero cut or zero flexible share reproduces full indexation',()=>{
 for(const overrides of [{cut:0},{flexible:0}]){
  const i={...defaults('spendingGuardrail'),...overrides};const p=guardrailPlan(i),fixed=guardrailPlan(i,false);
  assert.equal(p.reduction,0);near(p.balance,fixed.balance);near(p.paidTotal,fixed.paidTotal);assert.equal(p.cuts,0);
 }
});
test('the trigger is relative and strict, not a percentage-point addition',()=>{
 const i={initial:100,withdrawal:10,inflation:0,flexible:100,trigger:25,cut:10};
 // Year 1 leaves 80; next request/opening is exactly 12.5%, matching the threshold.
 const p=guardrailPlan(i,true,[-1/9,0]);near(p.rows[1].value,80);near(p.rows[2].request,10);assert.equal(p.rows[2].cutApplied,false);
 const q=guardrailPlan(i,true,[-.12,0]);near(q.rows[2].request,9);assert.equal(q.rows[2].cutApplied,true);
});
test('a guardrail cuts at most once per year and respects the indexed floor',()=>{
 for(const flexible of [0,25,100])for(const cut of [0,10,30]){
  const i={...defaults('spendingGuardrail'),flexible,cut},p=guardrailPlan(i);let prior=i.withdrawal;
  for(const r of p.rows.slice(1)){
   assert.ok(r.request>=r.floor-1e-6);assert.ok(r.request<=r.uncut+1e-6);assert.ok(r.value>=0);near(r.paid+r.shortfall,r.request);
   if(r.cutApplied)near(r.request,Math.max(r.floor,prior*(1+i.inflation/100)*(1-cut/100)));
   prior=r.request;
  }
  near(p.paidTotal+p.unmet+p.reduction,p.rows.slice(1).reduce((s,r)=>s+r.uncut,0));
  near(i.initial-p.paidTotal+p.rows.slice(1).reduce((s,r)=>s+r.gain,0),p.balance);
 }
});
test('zero withdrawals stay zero even through severe losses',()=>{
 const p=guardrailPlan({...defaults('spendingGuardrail'),withdrawal:0});near(p.reduction,0);near(p.unmet,0);assert.equal(p.cuts,0);
 near(p.balance,600000*guardrailReturns.reduce((s,r)=>s*(1+r),1));
});
test('a protected request floor does not promise the money exists',()=>{
 const p=guardrailPlan({...defaults('spendingGuardrail'),initial:10000,withdrawal:150000,flexible:0});near(p.rows[1].paid,10000);near(p.rows[1].shortfall,140000);assert.ok(p.unmet>0);near(p.balance,0);
});
test('gift priority, withdrawal timing and growth match the first year by hand',()=>{
 const i=defaults('familyGift'),now=giftPlan(i,1),none=giftPlan(i,0);near(now.rows[1].value,391400);near(none.rows[1].value,494400);
});
test('zero-return fully funded gift schedules reconcile at the same endpoint',()=>{
 const i={...defaults('familyGift'),initial:100000,gift:20000,withdrawal:10000,inflation:0,rate:0,years:5};
 for(const giftYear of [1,3,5]){const p=giftPlan(i,giftYear);near(p.balance,30000);near(p.delivered,20000);near(p.paidTotal,50000);near(p.unmet,0);}
});
test('a zero gift makes all comparison paths identical',()=>{
 const i={...defaults('familyGift'),gift:0};const a=giftPlan(i,0),b=giftPlan(i,1),c=giftPlan(i,6);assert.deepEqual(a.rows,b.rows);assert.deepEqual(a.rows,c.rows);
});
test('an out-of-horizon gift is excluded explicitly, never counted as funded',()=>{
 const i={...defaults('familyGift'),years:5,giftYear:6},p=giftPlan(i);assert.equal(p.giftInHorizon,false);near(p.delivered,0);near(p.unfundedGift,0);assert.deepEqual(p.rows,giftPlan(i,0).rows);
});
test('an oversized gift is capped and does not create negative assets',()=>{
 const i={...defaults('familyGift'),initial:50000,gift:100000,giftYear:1,years:5};const p=giftPlan(i);near(p.delivered,50000);near(p.unfundedGift,50000);near(p.paidTotal,0);assert.ok(p.unmet>0);assert.ok(p.rows.every(r=>r.value>=0));
});
test('gift accounting conserves cash through gains, losses and depletion',()=>{
 for(const rate of [-5,0,3,8])for(const giftYear of [0,1,6,25]){
  const i={...defaults('familyGift'),rate},p=giftPlan(i,giftYear);near(i.initial-p.delivered-p.paidTotal+p.growth,p.balance);
  near(p.paidTotal+p.unmet,i.withdrawal*Array.from({length:i.years},(_,n)=>(1+i.inflation/100)**n).reduce((a,b)=>a+b,0));
  near(p.delivered+p.unfundedGift,p.giftInHorizon?i.gift:0);
 }
});
test('new guides have resolvable links and four accessible charts each',()=>{
 for(const g of wealthFlexGuides){assert.ok(g.sections.length>=5);for(const slug of g.related)assert.ok(planningGuides.some(p=>p.slug===slug));
  const p=planningResult(g.planning);assert.equal(p.charts.length,4);
  for(const c of p.charts){const html=renderFigure(c,300);assert.match(html,/View chart data/);assert.match(html,/role="img"/);assert.doesNotMatch(html,/NaN|Infinity/);}
 }
});
test('range validation rejects fractional gift years and non-finite values',()=>{
 assert.equal(validInputs('familyGift',{...defaults('familyGift'),giftYear:1.5}),false);
 assert.equal(validInputs('familyGift',{...defaults('familyGift'),rate:Infinity}),false);
 assert.throws(()=>planningResult('familyGift',{...defaults('familyGift'),initial:-1}));
});
test('all field boundaries render finite chart values',()=>{
 for(const kind of Object.keys(wealthFlexDefinitions))for(const [key,,,min,max] of wealthFlexDefinitions[kind].fields)for(const value of [min,max]){
  const i={...defaults(kind),[key]:value};assert.equal(validInputs(kind,i),true);
  for(const chart of planningResult(kind,i).charts)assert.doesNotMatch(renderFigure(chart,300),/NaN|Infinity|undefined/);
 }
});
