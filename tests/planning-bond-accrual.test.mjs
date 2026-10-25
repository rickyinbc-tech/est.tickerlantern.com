import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {bondAccrualPlan} from '../src/planning-bond-accrual-models.js';
import {bondAccrualGuides} from '../src/planning-bond-accrual-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('an independent dated cash ledger reconciles purchased interest, full coupon and sale proceeds',()=>{
 const d=defaults('bondAccruedCash'),p=bondAccrualPlan(d);
 near(p.clean,9850);near(p.accrued,100);near(p.dirty,9950);near(p.purchaseCash,9960);near(p.coupon,200);near(p.saleCash,9840);near(p.netResult,80);assert.equal(p.remainingDays,90);
 near(bondAccrualPlan({...d,accrualExitQuote:96}).netResult,-170);
 for(const accrualFace of [1000,10000,1000000])for(const accrualCoupon of [0,4,10])for(const accrualElapsedDay of [0,90,179])for(const accrualExitQuote of [50,98.5,130]){
  const q=bondAccrualPlan({...d,accrualFace,accrualCoupon,accrualElapsedDay,accrualExitQuote}),annualCouponCash=accrualFace*accrualCoupon/100,C=annualCouponCash/2;
  const events=[-accrualFace*98.5/100-C*accrualElapsedDay/180-10,C,accrualFace*accrualExitQuote/100-10];
  near(q.netResult,events.reduce((s,x)=>s+x,0));near(q.holdingCoupon,C*(180-accrualElapsedDay)/180);
  near(q.netResult,q.holdingCoupon+q.priceChange-20);
 }
});
test('coupon payment transfers value into cash and both waterfall ledgers reconcile without double counting',()=>{
 const d=defaults('bondAccruedCash');
 for(const accrualElapsedDay of [0,90,179])for(const accrualCoupon of [0,4]){
  const q=bondAccrualPlan({...d,accrualElapsedDay,accrualCoupon}),before=q.rows.at(-2),after=q.rows.at(-1);
  assert.equal(before.x,180);assert.equal(after.x,180);near(before.bondChange-after.bondChange,q.coupon);near(after.couponCash-before.couponCash,q.coupon);near(before.combinedChange,after.combinedChange);
  q.rows.forEach(r=>near(r.bondChange+r.couponCash,r.combinedChange));near(q.rows[0].bondChange,0);
  const charts=planningResult('bondAccruedCash',{...d,accrualElapsedDay,accrualCoupon}).charts;
  near(charts[0].rows.reduce((s,r)=>s+r.value,0),q.purchaseCash);near(charts[2].rows.reduce((s,r)=>s+r.value,0),q.netResult);
 }
 const lastDay=bondAccrualPlan({...d,accrualElapsedDay:179});assert.equal(lastDay.remainingDays,1);near(lastDay.holdingCoupon,200/180);
});
test('bond-accrual guide retains substantial English prose, resolvable links and finite accessible figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of bondAccrualGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
 assert.equal(validInputs('bondAccruedCash',{...defaults('bondAccruedCash'),accrualElapsedDay:1.5}),false);
});
