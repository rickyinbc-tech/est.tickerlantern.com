import test from 'node:test';
import assert from 'node:assert/strict';
import { crashContributionPlan, crashPrice, contributionBlockReturn, fundWithdrawalPlan } from '../src/planning-crash-withdrawal-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('default crash-contribution results match an independent 40-digit Decimal check',()=>{
 const i=defaults('crashContribution'),p=crashContributionPlan(i);
 assert.equal(p.back,60);assert.equal(p.recover,46);assert.equal(p.pauseRecover,53);
 near(crashPrice(i,18),.65);near(crashPrice(i,60),1);
 near(p.end.value,88104.2825139930762,1e-12);near(p.end.paused,81432.3976531859162,1e-12);assert.equal(p.end.invested,68000);
 near(contributionBlockReturn(i,13,24),.467382189377130915,1e-12);near(contributionBlockReturn(i,49,60),.0586968757390859,1e-10);
});

test('crash-contribution identities: no fall, no cash interest and a recovery beyond the horizon',()=>{
 const i=defaults('crashContribution');
 const flat=crashContributionPlan(i,{ccDrop:5,ccAfter:0,ccCash:0});assert.ok(flat.end.value>=flat.end.invested);
 const zero=crashContributionPlan(i,{ccCash:0});near(zero.end.paused,79172.1678148547,1e-9);
 const slow=crashContributionPlan(i,{ccStart:200000,ccDrop:60,ccRiseMonths:120,ccHorizon:24});assert.equal(slow.extended,true);
 const r=planningResult('crashContribution',{...i,ccMonthly:0,ccStart:20000,ccDrop:70,ccRiseMonths:120});assert.ok(r.metrics.length>=5);
 assert.equal(validInputs('crashContribution',{...i,ccStart:0,ccMonthly:0}),false);
 assert.equal(validInputs('crashContribution',{...i,ccFallMonths:2.5}),false);
});

test('default fund-withdrawal results match an independent 40-digit Decimal check',()=>{
 const p=fundWithdrawalPlan(defaults('fundWithdrawalTax'));
 near(p.years[0].costOut,12000);near(p.years[0].gainTax,889.5);near(p.years[0].distTax,1254.195);
 near(p.end,98467.9986971489276,1e-12);near(p.rows.at(-1).cost,40149.5104473783439,1e-12);near(p.endDeferredTax,8645.71588302848903,1e-10);
 near(p.withdrawn,437352.656380518908,1e-12);near(p.taxTotal,50674.3540818532921,1e-12);near(p.average,.115866117062666344,1e-12);assert.equal(p.lasted,20);
 assert.equal(fundWithdrawalPlan(defaults('fundWithdrawalTax'),{fwYears:25}).lasted,23);
});

test('fund-withdrawal identities: cost equal to value, zero tax and the account comparison',()=>{
 const i=defaults('fundWithdrawalTax');
 const even=fundWithdrawalPlan(i,{fwCost:i.fwValue,fwGrowth:0,fwDist:0});near(even.taxTotal,0);
 const free=fundWithdrawalPlan(i,{fwFedRate:0,fwProvRate:0});near(free.taxTotal,0);
 const bars=planningResult('fundWithdrawalTax').charts.find(c=>c.id==='fund-withdrawal-wrappers').rows.map(r=>r.value);
 near(bars[2],889.5);near(bars[3],2668.5);near(bars[4],5337);
 const parts=planningResult('fundWithdrawalTax').charts.find(c=>c.id==='fund-withdrawal-parts');for(const r of parts.rows)assert.ok(r.values.every(v=>v>=0));
});

test('both guides have four finite figure/table pairs and resolvable related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 for(const kind of ['crashContribution','fundWithdrawalTax']){
  const g=planningGuides.find(x=>x.planning===kind);assert.ok(g,kind);
  for(const s of g.related)assert.ok(slugs.has(s),`${kind} related ${s}`);
  for(const m of g.sections.flatMap(s=>[...s.html.matchAll(/href="\/research\/([^"]+)"/g)].map(x=>x[1])))assert.ok(slugs.has(m),`${kind} link ${m}`);
  const r=planningResult(kind);assert.equal(r.charts.length,4);assert.ok(r.metrics.length>=6);
  for(const c of r.charts){const vals=c.series?c.series.flatMap(s=>s.rows.map(x=>x.value)):c.rows.flatMap(x=>x.values??[x.value]);assert.ok(vals.every(v=>v==null||Number.isFinite(v)),c.id);}
 }
});
