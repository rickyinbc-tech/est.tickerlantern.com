import test from 'node:test';
import assert from 'node:assert/strict';
import { brackets2026, combinedBands, rrspDollarLimits, rrspPayrollPlan, tSeriesSwpPlan, yearsToZeroAcb } from '../src/planning-refund-payout-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('official 2026 brackets and RRSP limits match the CRA pages reviewed 27 October 2026',()=>{
 assert.deepEqual(brackets2026.federal.map(([,r])=>r),[14,20.5,26,29,33]);assert.equal(brackets2026.federal[0][0],58523);assert.equal(brackets2026.federal[3][0],258482);
 assert.deepEqual(brackets2026.bc.map(([,r])=>r),[5.6,7.7,10.5,12.29,14.7,16.8,20.5]);assert.equal(brackets2026.bc[1][0],100728);
 assert.equal(rrspDollarLimits[2026],33810);assert.equal(rrspDollarLimits[2027],35390);
 const b=combinedBands();assert.equal(b.length,11);near(b[0].rate,19.6);near(b[2].rate,28.2);near(b.at(-1).rate,53.5);
});

test('default RRSP payroll results match an independent 40-digit Decimal check',()=>{
 const p=rrspPayrollPlan(defaults('rrspPayroll'));
 near(p.first[11].atSource,8625.716115624770,1e-12);near(p.first[11].spring,6193.264171018585,1e-12);
 near(p.end.atSource,473245.7052974112,1e-12);near(p.end.spring,463969.5826881944,1e-12);near(p.end.spent,339790.4164035412,1e-12);
 near(p.gap,9276.122609216826,1e-9);near(p.annualRefundFirst,1692);
});

test('RRSP payroll identities: zero return and zero tax rate',()=>{
 const base=defaults('rrspPayroll');
 assert.ok(Math.abs(rrspPayrollPlan(base,{rpReturn:0}).gap)<1e-6);
 const z=rrspPayrollPlan(base,{rpRate:0});near(z.end.atSource,z.end.spent,1e-12);near(z.end.spring,z.end.spent,1e-12);
 for(const g of [3,6,9])assert.ok(rrspPayrollPlan(base,{rpReturn:g}).gap>0);
});

test('default T-series and withdrawal plan results match an independent 40-digit Decimal check',()=>{
 const p=tSeriesSwpPlan(defaults('tSeriesSwp'));
 assert.equal(p.zeroYear,20);near(p.firstTenT,0);near(p.firstTenS,6590.535702211578,1e-12);
 near(p.end.acbS,85969.00246709870,1e-12);near(p.end.value,300000,1e-12);near(p.end.cumS,19645.35037006481,1e-12);near(p.end.cumT,6750,1e-12);
 near(p.totalT,51750,1e-12);near(p.totalS,51750,1e-12);
 const later=tSeriesSwpPlan(defaults('tSeriesSwp'),{tsLaterRate:20});near(later.totalT,36750,1e-12);near(later.totalS,41048.45012335494,1e-12);
});

test('T-series identities: deferral only, cost base floor and heatmap',()=>{
 const base=defaults('tSeriesSwp');
 for(const o of [{tsReturn:2},{tsReturn:8,tsPayout:7},{tsCost:300000},{tsCost:0}]){const p=tSeriesSwpPlan(base,o);near(p.totalT,p.totalS,1e-9);for(const r of p.rows)assert.ok(r.acbT>=0&&r.acbS>=0);}
 assert.equal(yearsToZeroAcb(base,8,4),13);assert.equal(yearsToZeroAcb(base,4,0),60);
 assert.equal(validInputs('tSeriesSwp',{...base,tsIncome:6,tsPayout:5}),false);
});

test('both guides are registered with four charts, finite values and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 for(const [slug,kind] of [['rrsp-refund-every-payday-reduce-tax-at-source-t1213','rrspPayroll'],['t-series-fund-return-of-capital-or-systematic-withdrawal-plan','tSeriesSwp']]){
  const g=planningGuides.find(x=>x.slug===slug);assert.ok(g);assert.equal(g.planning,kind);
  for(const r of g.related)assert.ok(slugs.has(r),r);
  const res=planningResult(kind);assert.equal(res.charts.length,4);
  for(const [,v] of res.metrics)assert.ok(Number.isFinite(v));
 }
});
