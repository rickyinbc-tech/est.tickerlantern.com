import test from 'node:test';
import assert from 'node:assert/strict';
import { allocate, strategies, homeRenoRules, metcThreshold } from '../src/planning-home-reno-models.js';
import { hatcClaimsSource } from '../src/planning-home-reno-data.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);
const base=defaults('homeRenoCredit');

test('worked cases match the independent Decimal grid check',()=>{
 const d=strategies(base);near(d.best.total,8400);near(d.best.mhrtc,6300);near(d.best.hatc,2100);near(d.allIn.total,7000);near(d.keepOut.total,8400);
 const y25=strategies({...base,hrcYear:2025});near(y25.best.total,9526.5);near(y25.best.metc,826.5);near(y25.allIn.total,7250);
 const low=strategies({...base,hrcTax:1000});near(low.best.total,8000);near(low.keepOut.total,7300);near(low.best.lost,260);
 near(strategies({...base,hrcSecondary:0,hrcAccess:25000,hrcMedical:10000}).best.total,3458);
 near(strategies({...base,hrcSecondary:0,hrcAccess:25000,hrcMedical:10000,hrcYear:2025}).best.total,4306.5);
 const small=strategies({...base,hrcUnit:20000,hrcAccess:40000,hrcMedical:10000,hrcTax:9000});near(small.best.total,8400);near(small.keepOut.total,6958);
});

test('limits, thresholds and maximum credits follow the published rules',()=>{
 near(metcThreshold(2026,60000),1800);near(metcThreshold(2026,200000),2890);near(metcThreshold(2025,200000),2834);
 const max26=strategies({...base,hrcUnit:150000,hrcAccess:60000,hrcMedical:0,hrcTax:40000}).best;near(max26.mhrtc,7000);near(max26.hatc,2800);
 const max25=strategies({...base,hrcYear:2025,hrcUnit:150000,hrcAccess:60000,hrcMedical:0,hrcTax:40000}).best;near(max25.mhrtc,7250);near(max25.hatc,2900);
 assert.deepEqual(homeRenoRules.hatcHistory.map(([y,c,r])=>Math.round(c*r)),[1500,1500,1500,1500,1500,1500,3000,3000,3000,2900,2800]);
 near(allocate({...base,hrcTax:0},0,0).total,6300);
});

test('best split never trails the simple rules, stays within caps and every dollar is credited at most once',()=>{
 for(const year of [2025,2026])for(const sec of [0,1])for(const U of [0,30000,60000])for(const A of [0,8000,25000,50000])for(const f of [0,.4,1])for(const tax of [0,1500,9000]){
  const i={...base,hrcYear:year,hrcSecondary:sec,hrcUnit:U,hrcAccess:A,hrcMedical:A*f,hrcTax:tax},s=strategies(i),b=s.best,r=year===2025?.145:.14;
  assert.ok(b.total>=s.allIn.total-1e-9&&b.total>=s.keepOut.total-1e-9);
  assert.ok(b.mhrtcBase<=50000&&b.hatcBase<=20000&&b.nonref<=tax+1e-9&&b.lost>=-1e-9);
  const credited=b.mhrtcBase+b.hatcBase+b.metcBase,cost=(sec?U:0)+A;
  assert.ok(credited<=cost+(year===2025?A*f:0)+1e-6,'credited more than spent');
  if(!sec)near(b.mhrtc,0);
  assert.ok(b.total<=r*(cost+(year===2025?A*f:0))+1e-6);
 }
});

test('official statistics are as printed and the result renders six finite charts',()=>{
 assert.deepEqual(hatcClaimsSource.years.map(y=>y.returns),[25550,27330,29880,42560,47130,37410]);
 near(hatcClaimsSource.years.at(-1).thousands*1000/37410,6129.3,1e-4);near(hatcClaimsSource.mhrtc2023.thousands*1000/6040,3647.68,1e-5);
 const r=planningResult('homeRenoCredit',base);assert.equal(r.charts.length,6);assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));near(r.metrics[7][1],8400/60000);
 for(const c of r.charts){for(const s of c.series??[])for(const row of s.rows)assert.ok(Number.isFinite(row.value));for(const row of c.rows??[])for(const v of row.values??[row.value])assert.ok(Number.isFinite(v));}
 assert.equal(validInputs('homeRenoCredit',{...base,hrcMedical:20000}),false);assert.equal(validInputs('homeRenoCredit',base),true);
 assert.ok(planningGuides.some(g=>g.slug==='home-accessibility-multigenerational-renovation-tax-credit-limits-medical-double-claim'&&g.planning==='homeRenoCredit'));
});
