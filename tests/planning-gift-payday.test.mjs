import test from 'node:test';
import assert from 'node:assert/strict';
import { donateKindPlan, donationCreditRates, frontMinusStaged, tfsaDollarLimits, tfsaPaydayPlan } from '../src/planning-gift-payday-models.js';
import { defaults, planningResult } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('official TFSA limits and donation credit rates match the CRA pages reviewed 27 October 2026',()=>{
 assert.equal(Object.values(tfsaDollarLimits).reduce((a,b)=>a+b,0),109000);assert.equal(tfsaDollarLimits[2015],10000);assert.equal(tfsaDollarLimits[2026],7000);
 const r=Object.fromEntries(donationCreditRates.provinces);assert.equal(donationCreditRates.federal,29);assert.equal(r['British Columbia'],16.8);assert.equal(r.Ontario,11.16);assert.equal(r.Alberta,21);
 assert.equal(donationCreditRates.provinces.length,12);
});

test('default in-kind gift results match an independent 40-digit Decimal check',()=>{
 const p=donateKindPlan(defaults('donateKind'));
 near(p.gain,8000);near(p.credit,9160);near(p.taxNow,1600);near(p.inKindCost,10840);near(p.sellFirstCost,12440);
 near(p.end.grown,35816.95393085708,1e-12);near(p.end.rebuy,32653.56314468567,1e-12);near(p.end.keep,31053.56314468567,1e-12);near(p.end.sellRebuy,29788.20683021710,1e-12);
});

test('in-kind identities: no gain, a loss and the cost-base reset',()=>{
 const base=defaults('donateKind');
 assert.equal(donateKindPlan(base,{dkCost:20000}).saving,0);assert.equal(donateKindPlan(base,{dkCost:30000}).saving,0);
 near(donateKindPlan(base,{dkCost:0,dkRate:50}).saving,5000);
 const p=donateKindPlan(base);for(const r of p.rows)near(r.rebuy-r.keep,1600);
 const grid=planningResult('donateKind').charts.find(c=>c.id==='donate-kind-grid');near(grid.rows[1].values[2],3200);
 const bars=planningResult('donateKind').charts.find(c=>c.id==='donate-kind-routes');near(bars.rows[1].values.reduce((a,b)=>a+b,0),21600);
});

test('default TFSA timing results match an independent 40-digit Decimal check',()=>{
 const p=tfsaPaydayPlan(defaults('tfsaPayday'));
 near(p.frontEnd,7420);near(p.stInEnd,7289.870957617413,1e-12);near(p.stOutEnd,7270.504284406534,1e-12);
 near(p.payEnd,265793.3646791123,1e-12);near(p.saveEnd,259447.6925920724,1e-12);
 near(p.pay[1].value,7225.474866188349,1e-12);near(p.save[1].value,7052.97058178182,1e-12);
});

test('TFSA timing identities: equal rates, half-year stress cells',()=>{
 const base=defaults('tfsaPayday');
 const q=tfsaPaydayPlan(base,{tpReturn:2,tpTax:0});near(q.frontEnd,q.stInEnd,1e-12);near(q.payEnd,q.saveEnd,1e-12);
 near(frontMinusStaged(base,-.2,.2),-937.2220912129205,1e-10);near(frontMinusStaged(base,.2,-.2),458.1822161063346,1e-10);
 assert.ok(frontMinusStaged(base,.1,.1)>0);
});

test('both guides are registered with four charts and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 for(const [slug,kind] of [['donate-fund-units-in-kind-charity-capital-gain-zero-inclusion','donateKind'],['tfsa-january-deposit-or-every-payday-contribution-timing','tfsaPayday']]){
  const g=planningGuides.find(x=>x.slug===slug);assert.ok(g);assert.equal(g.planning,kind);
  for(const r of g.related)assert.ok(slugs.has(r),r);
  assert.equal(planningResult(kind).charts.length,4);
 }
});
