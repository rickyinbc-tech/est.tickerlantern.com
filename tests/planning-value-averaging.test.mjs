import test from 'node:test';
import assert from 'node:assert/strict';
import { tbillYield, septemberCpi, tbillRows, returnPath, valuePlan } from '../src/planning-value-averaging-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);
const slug='value-averaging-vs-dollar-cost-averaging-cash-pot-after-crash';

test('treasury bill and CPI values match the series retrieved 27 October 2026',()=>{
 assert.equal(tbillYield.length,241);
 assert.equal(tbillYield[0],4.15);assert.equal(tbillYield.at(-1),2.39);
 assert.equal(Math.min(...tbillYield),0.06);assert.equal(Math.max(...tbillYield),5.08);
 assert.equal(septemberCpi[2006],109.2);assert.equal(septemberCpi[2026],170.0);
 const rows=tbillRows(),last=rows.at(-1);
 assert.equal(rows.length,21);assert.equal(last.x,2026);
 near(last.nominal,13934.62768779108,1e-12);near(last.real,8950.949079451683,1e-12);
});

test('default paths match an independent 40-digit Decimal check',()=>{
 const d=defaults('valueAveraging'),c=valuePlan(d),none=valuePlan(d,{},0),late=valuePlan(d,{},9);
 near(c.dcaTotal,84685.71043912854,1e-11);near(c.vaTotal,84071.66268632891,1e-11);near(c.pot,6575.634722207231,1e-10);
 near(c.maxBuy,833.9939666304090,1e-11);assert.equal(c.maxBuyMonth,24);assert.equal(c.shortMonths,1);near(c.maxShort,78.50617025092388,1e-9);
 near(c.dcaAvg,12.08895112566684,1e-12);near(c.vaAvg,12.11468780545344,1e-12);
 near(none.dcaTotal,81336.28159671075,1e-11);near(none.vaTotal,81336.28159671075,1e-11);
 near(late.dcaTotal,83716.65814161642,1e-11);near(late.vaTotal,83892.31004303428,1e-11);assert.equal(late.shortMonths,19);near(late.maxShort,15798.05822590702,1e-9);
 near(valuePlan(d,{vavSell:0}).pot,6579.004852552149,1e-10);
});

test('rules agree when returns equal the target, and the crash pair compounds to two ordinary years',()=>{
 const d=defaults('valueAveraging');
 for(const r of [2,5,8]){const p=valuePlan(d,{vavReturn:r,vavTarget:r},0);near(p.vaTotal,p.dcaTotal,1e-12);assert.equal(p.shortMonths,0);}
 for(const drop of [10,25,50]){const p=returnPath({...d,vavDrop:drop},2);near((1+p[1])*(1+p[2]),1.05**2,1e-12);}
 // every saving is accounted for: VA total equals fund plus pot, and total invested is the same
 const c=valuePlan(d);near(c.invested,60000,1e-12);near(c.vaTotal,c.vaFund+c.pot,1e-12);
});

test('a larger starting buffer removes shortfalls; no selling means no negative trades',()=>{
 const d=defaults('valueAveraging');
 assert.equal(valuePlan(d,{vavBuffer:0}).shortMonths,19);assert.equal(valuePlan(d,{vavBuffer:10000}).shortMonths,0);
 assert.ok(valuePlan(d,{vavSell:0}).months.every(r=>r.trade>=0));
 assert.ok(valuePlan(d).months.some(r=>r.trade<0));
 assert.equal(validInputs('valueAveraging',{...d,vavCrash:10}),false);
 assert.equal(validInputs('valueAveraging',{...d,vavSell:.5}),false);
});

test('guide is registered with four charts, finite metrics and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),g=planningGuides.find(x=>x.slug===slug);
 assert.ok(g);assert.equal(g.planning,'valueAveraging');
 for(const r of g.related)assert.ok(slugs.has(r),r);
 for(const m of g.sections.flatMap(s=>[...s.html.matchAll(/href="\/research\/([^"]+)"/g)].map(x=>x[1])))assert.ok(slugs.has(m),m);
 const res=planningResult('valueAveraging');assert.equal(res.charts.length,4);
 for(const [,v] of res.metrics)assert.ok(Number.isFinite(v));
 for(const ch of res.charts)for(const s of ch.series??[])for(const r of s.rows)assert.ok(Number.isFinite(r.value));
});
