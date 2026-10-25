import test from 'node:test';
import assert from 'node:assert/strict';
import {disabilityOffsetLedger} from '../src/planning-disability-offset-models.js';
import {disabilityOffsetGuides} from '../src/planning-disability-offset-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {defaults,validInputs,planningResult} from '../src/planning-models.js';
import {renderFigure} from '../src/planning-charts.js';
const base=defaults('disabilityOffset');
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} versus ${b}`);

test('the default offset preserves a 4000 monthly total and matches the 7200 retro award with a repayment',()=>{
  const p=disabilityOffsetLedger(base);
  assert.equal(p.reduction,1200);assert.equal(p.planAfter,2800);assert.equal(p.ongoingTotal,4000);
  assert.equal(p.originalPlanPaid,24000);assert.equal(p.revisedPlanEntitlement,16800);
  assert.equal(p.retroAward,7200);assert.equal(p.repayment,7200);assert.equal(p.residual,0);
  assert.equal(p.overlapMonths,6);assert.equal(p.outsideMonths,0);
});
test('only shared trailing months produce an overpayment, even when the two histories differ',()=>{
  const shorterA=disabilityOffsetLedger({...base,coordPlanMonths:3});
  assert.equal(shorterA.overlapMonths,3);assert.equal(shorterA.repayment,3600);assert.equal(shorterA.residual,3600);assert.equal(shorterA.revisedPlanEntitlement,8400);
  const longerA=disabilityOffsetLedger({...base,coordPlanMonths:12,coordRetroMonths:3});
  assert.equal(longerA.overlapMonths,3);assert.equal(longerA.outsideMonths,9);assert.equal(longerA.repayment,3600);assert.equal(longerA.originalPlanPaid,48000);assert.equal(longerA.revisedPlanEntitlement,44400);
  const rows=planningResult('disabilityOffset',{...base,coordPlanMonths:12,coordRetroMonths:3}).charts[1].rows;
  assert.deepEqual(rows.map(r=>r.values),[[8400,3600],[36000,0]]);
  near(rows.flatMap(r=>r.values).reduce((a,b)=>a+b,0),longerA.originalPlanPaid);
});
test('zero and partial offsets are independent scenarios rather than extra full benefits',()=>{
  const half=disabilityOffsetLedger({...base,coordOffsetPercent:50}),none=disabilityOffsetLedger({...base,coordOffsetPercent:0});
  assert.equal(half.reduction,600);assert.equal(half.ongoingTotal,4600);assert.equal(half.repayment,3600);assert.equal(half.residual,3600);
  assert.equal(none.reduction,0);assert.equal(none.ongoingTotal,5200);assert.equal(none.repayment,0);assert.equal(none.residual,7200);
});
test('the cap prevents a negative Plan A and repayment never exceeds what A paid or B awarded',()=>{
  const p=disabilityOffsetLedger({...base,coordPlanMonthly:500,coordOtherMonthly:1200});
  assert.equal(p.reduction,500);assert.equal(p.planAfter,0);assert.equal(p.ongoingTotal,1200);
  assert.equal(p.repayment,3000);assert.equal(p.residual,4200);
  for(const coordPlanMonthly of [0,500,15000])for(const coordOtherMonthly of [0,100,10000])for(const coordRetroMonths of [0,3,24])for(const coordPlanMonths of [0,12,24]){
    const r=disabilityOffsetLedger({...base,coordPlanMonthly,coordOtherMonthly,coordRetroMonths,coordPlanMonths});
    assert.ok(r.planAfter>=0&&r.residual>=0&&r.repayment<=r.originalPlanPaid&&r.repayment<=r.retroAward);
    near(r.revisedPlanEntitlement+r.repayment,r.originalPlanPaid);near(r.residual+r.repayment,r.retroAward);
  }
});
test('cash and its unpaid earmark fall together at settlement without deducting repayment twice',()=>{
  const p=disabilityOffsetLedger({...base,coordOffsetPercent:50,coordRepayLagDays:10});
  assert.deepEqual(p.calendar[0],{x:0,bankCash:7200,earmark:3600,residual:3600});
  assert.deepEqual(p.calendar[9],{x:9,bankCash:7200,earmark:3600,residual:3600});
  assert.deepEqual(p.calendar[10],{x:10,bankCash:3600,earmark:0,residual:3600});
  assert.ok(p.calendar.every(r=>r.bankCash-r.earmark===r.residual));
});
test('same-day settlement shows the post-settlement balance without an artificial temporary windfall',()=>{
  const p=disabilityOffsetLedger({...base,coordRepayLagDays:0});
  assert.ok(p.calendar.every(r=>r.bankCash===0&&r.earmark===0&&r.residual===0));
  const noPastB=disabilityOffsetLedger({...base,coordRetroMonths:0});assert.equal(noPastB.retroAward,0);assert.equal(noPastB.repayment,0);assert.equal(noPastB.ongoingTotal,4000);
  const noPastA=disabilityOffsetLedger({...base,coordPlanMonths:0});assert.equal(noPastA.repayment,0);assert.equal(noPastA.residual,7200);
});
test('repayment timing changes only the isolated cash calendar, not entitlements or the residual matrix',()=>{
  const a=planningResult('disabilityOffset',{...base,coordRepayLagDays:0}),b=planningResult('disabilityOffset',{...base,coordRepayLagDays:90});
  assert.deepEqual(a.metrics,b.metrics);assert.deepEqual(a.charts[0],b.charts[0]);assert.deepEqual(a.charts[1],b.charts[1]);assert.deepEqual(a.charts[3],b.charts[3]);assert.notDeepEqual(a.charts[2],b.charts[2]);
  assert.deepEqual(b.charts[3].rows.map(r=>r.values),[[3600,7200,14400,28800],[1800,3600,10800,25200],[0,0,7200,21600]]);
});
test('the monthly waterfall reconciles adjusted A plus B while past totals remain separate',()=>{
  const p=disabilityOffsetLedger(base),result=planningResult('disabilityOffset',base);
  near(result.charts[0].rows.reduce((sum,r)=>sum+r.value,0),p.planAfter+base.coordOtherMonthly);
  near(result.charts[1].rows.flatMap(r=>r.values).reduce((sum,v)=>sum+v,0),p.originalPlanPaid);
  assert.ok(result.charts[2].series.every(s=>s.step));assert.equal(result.charts[2].series.length,3);
});
test('unsupported whole-month/day values are rejected and permitted extremes remain finite',()=>{
  for(const key of ['coordRetroMonths','coordPlanMonths','coordRepayLagDays']){
    const input={...base,[key]:1.5};assert.equal(validInputs('disabilityOffset',input),false);assert.throws(()=>planningResult('disabilityOffset',input));
  }
  for(const change of [{coordOffsetPercent:101},{coordOtherMonthly:-1},{coordPlanMonthly:NaN},{coordRepayLagDays:91}])assert.throws(()=>planningResult('disabilityOffset',{...base,...change}));
  const p=disabilityOffsetLedger({...base,coordPlanMonthly:15000,coordOtherMonthly:10000,coordRetroMonths:24,coordPlanMonths:24,coordRepayLagDays:90});
  assert.equal(p.calendar.length,92);assert.ok(p.calendar.every(r=>[r.bankCash,r.earmark,r.residual].every(Number.isFinite)));
});
test('all four distinct charts render accessible before-tax illustrations, including zero-payment cases',()=>{
  for(const input of [base,{...base,coordPlanMonthly:0,coordOtherMonthly:0},{...base,coordRetroMonths:0,coordPlanMonths:0,coordRepayLagDays:0}]){
    const result=planningResult('disabilityOffset',input);assert.equal(new Set(result.charts.map(c=>c.type)).size,4);
    for(const c of result.charts)for(const width of [300,354,760]){
      const html=renderFigure(c,width);assert.match(html,/role="img"/);assert.match(html,/<table/);assert.match(html,/Hypothetical scenario/);assert.doesNotMatch(html,/NaN|Infinity|undefined|Official statistics/);
    }
  }
});
test('the detailed English guide labels gross arithmetic and the federal plan exception without a universal claim',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const guide of disabilityOffsetGuides){assert.ok(slugs.has(guide.slug));assert.equal(guide.sections.length,6);assert.ok(guide.related.every(s=>slugs.has(s)));
    const prose=guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ');assert.ok(prose.trim().split(/\s+/).length>=850);
    assert.match(prose,/CAD 16,800/);assert.match(prose,/particular plan/);assert.match(prose,/private individual disability plan/);assert.match(prose,/no tax liability/);
  }
});
