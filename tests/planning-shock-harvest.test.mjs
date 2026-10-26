import test from 'node:test';
import assert from 'node:assert/strict';
import { jointDeclinePlan, lossHarvestPlan, observedMonthLabel, ratesInflationObserved, realRecoveryYear } from '../src/planning-shock-harvest-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('dated rate and inflation observations cover December 2021 to September 2026',()=>{
 const o=ratesInflationObserved;for(const k of ['cpi','policy','tenYear'])assert.equal(o[k].length,58,k);
 assert.equal(observedMonthLabel(0),'Dec 2021');assert.equal(observedMonthLabel(57),'Sep 2026');
 assert.equal(Math.max(...o.cpi),8.1);assert.equal(o.cpi[6],8.1);assert.equal(o.cpi[57],3.1);
 assert.equal(o.tenYear[0],1.42);assert.equal(o.tenYear[12],3.3);assert.equal(o.policy[12],4.25);assert.equal(o.policy[57],2.25);
});

test('default joint-decline results match an independent 40-digit Decimal check',()=>{
 const p=jointDeclinePlan(defaults('jointDecline'));
 near(p.bondShock,-.125);near(p.shock,-.122);near(p.rows[1].value,87800);near(p.rows[1].flat,93400);
 near(p.realShock,.878/1.063-1,1e-12);near(p.value,87800*1.05**14,1e-12);near(p.flat,93400*1.042**14,1e-12);
 near(p.real,115738.359656661166,1e-12);assert.equal(p.recovery,9);
 assert.equal(p.rows.find(r=>r.x>0&&r.value>=r.flat).x,10);assert.equal(p.rows.find(r=>r.x>0&&r.value>=100000).x,4);
});

test('joint-decline identities: no shock, all bonds and waterfall reconciliation',()=>{
 const base=defaults('jointDecline');
 const calm=jointDeclinePlan(base,{jdStockFall:0,jdRise:0,jdInflShock:0,jdInflLater:0});
 near(calm.value,calm.flat);near(calm.real,calm.value);
 const bonds=jointDeclinePlan(base,{jdEquity:0});near(bonds.shock,.015-.14);
 const r=planningResult('jointDecline'),wf=r.charts.find(c=>c.id==='joint-decline-shock-year');
 near(wf.rows.reduce((a,x)=>a+x.value,0),82596.4252116651,1e-12);
 assert.equal(realRecoveryYear(base,{jdEquity:100,jdStockFall:0}),3);
});

test('default loss-harvest results match an independent 40-digit Decimal check',()=>{
 const p=lossHarvestPlan(defaults('lossHarvest'));
 assert.equal(p.loss,25000);assert.equal(p.used,20000);assert.equal(p.carried,5000);near(p.saving,4000);
 near(p.end.holdAfter,127450.861792571217,1e-12);near(p.end.swAfter,129675.447267026921,1e-12);
 near(p.end.sameAfter,127144.734638089789,1e-12);near(p.advantage,2224.58547445570,1e-10);
 near(p.bridge.saving,7163.39078617141,1e-12);near(p.bridge.tax,-4603.02136861393,1e-10);
 near(p.end.holdAfter+p.bridge.saving+p.bridge.switchCost+p.bridge.gap+p.bridge.tax,p.end.swAfter,1e-12);
});

test('loss-harvest edge cases: no gains, no tax, superficial rebuy and invalid inputs',()=>{
 const base=defaults('lossHarvest');
 near(lossHarvestPlan(base,{lhGains:0}).advantage,-306.127154481437,1e-9);
 const free=lossHarvestPlan(base,{lhRateNow:0,lhRateLater:0,lhSwitch:0});near(free.advantage,0);
 const same=lossHarvestPlan(base,{lhSwitch:0});near(same.end.sameAfter,same.end.holdAfter);
 near(lossHarvestPlan(base,{lhYears:5,lhRateLater:50}).advantage,-220.38623905,1e-6);
 assert.equal(validInputs('lossHarvest',{...base,lhValue:100000}),false);
 assert.equal(validInputs('lossHarvest',{...base,lhYears:2.5}),false);
 assert.equal(validInputs('lossHarvest',base),true);assert.equal(validInputs('jointDecline',defaults('jointDecline')),true);
});

test('both guides have four finite figure/table pairs and resolvable related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 for(const kind of ['jointDecline','lossHarvest']){
  const g=planningGuides.find(x=>x.planning===kind);assert.ok(g,kind);
  for(const s of g.related)assert.ok(slugs.has(s),`${kind} related ${s}`);
  for(const m of g.sections.flatMap(s=>[...s.html.matchAll(/href="\/research\/([^"]+)"/g)].map(x=>x[1])))assert.ok(slugs.has(m),`${kind} link ${m}`);
  const r=planningResult(kind);assert.equal(r.charts.length,4);assert.ok(r.metrics.length>=6);
  for(const c of r.charts){const vals=c.series?c.series.flatMap(s=>s.rows.map(x=>x.value)):c.rows.flatMap(x=>x.values??[x.value]);assert.ok(vals.every(v=>v==null||Number.isFinite(v)),c.id);}
 }
});
