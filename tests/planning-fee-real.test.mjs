import test from 'node:test';
import assert from 'node:assert/strict';
import { cpiYearSums, cpiRows, feeRates, feePath } from '../src/planning-fee-real-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);
const slug='fund-fee-share-of-real-return-after-inflation';

test('CPI values match the series retrieved 27 October 2026',()=>{
 assert.equal(Object.keys(cpiYearSums).length,31);
 assert.equal(cpiYearSums[1995],1050.6);assert.equal(cpiYearSums[2025],1970.2);
 const rows=cpiRows();assert.equal(rows.length,30);assert.equal(rows[0].x,1996);assert.equal(rows.at(-1).x,2025);
 near(rows.find(r=>r.x===2022).inflation,0.068028011534161125,1e-12);near(rows.find(r=>r.x===2009).inflation,0.0029946680300927617,1e-10);
 near(rows.at(-1).tenYear,0.026362964858460530,1e-12);
 assert.equal(rows.filter(r=>r.tenYear!=null).length,21);
});

test('annual rates and fee shares match an independent 40-digit Decimal check',()=>{
 const b=feeRates(.06,.025,.02),a=feeRates(.06,.025,.005);
 near(b.net,.0388,1e-12);near(b.realBefore,.034146341463414634,1e-12);near(b.realAfter,.013463414634146341,1e-12);
 near(b.realShare,.60571428571428571,1e-12);near(b.nominalShare,.35333333333333333,1e-12);
 near(a.realAfter,.028975609756097561,1e-12);near(a.realShare,.15142857142857143,1e-12);
 // the waterfall steps add up exactly to the return before fees
 near(b.feePoints+b.inflationPoints+b.realAfter,.06,1e-14);
 assert.equal(feeRates(.02,.03,.01).realShare,null);
});

test('default plan matches the Decimal check',()=>{
 const d=defaults('feeRealReturn');
 const none=feePath(d,0),a=feePath(d,d.frrFeeA),b=feePath(d,d.frrFeeB);
 near(none.real,254711.649061302029,1e-11);near(a.real,236224.585915052821,1e-11);near(b.real,189635.137115994534,1e-11);
 near(a.paid,158010.816803292269,1e-11);near(a.feesReal,13744.6418749107072,1e-10);near(b.feesReal,47839.9192231935750,1e-10);
 near(b.nominal,351572.943290710864,1e-11);
 near(feePath({...d,frrIndex:0},2).real,148935.180580793371,1e-11);
 near(feePath({...d,frrStart:100000,frrMonthly:0},.5).real,204233.516668796142,1e-11);
 near(feePath({...d,frrStart:100000,frrMonthly:0},2).real,139701.763741416942,1e-11);
 // with no fee and no inflation-adjusted gain, money in equals money out
 near(feePath({...d,frrGross:2.5},0).real,feePath({...d,frrGross:2.5},0).paid,1e-11);
 assert.equal(validInputs('feeRealReturn',{...d,frrIndex:.5}),false);
});

test('guide is registered with four charts, finite metrics and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),g=planningGuides.find(x=>x.slug===slug);
 assert.ok(g);assert.equal(g.planning,'feeRealReturn');
 for(const r of g.related)assert.ok(slugs.has(r),r);
 for(const m of g.sections.flatMap(s=>[...s.html.matchAll(/href="\/research\/([^"]+)"/g)].map(x=>x[1])))assert.ok(slugs.has(m),m);
 const res=planningResult('feeRealReturn');assert.equal(res.charts.length,4);
 for(const [,v] of res.metrics)assert.ok(Number.isFinite(v));
 for(const ch of res.charts){for(const s of ch.series??[])for(const r of s.rows)assert.ok(Number.isFinite(r.value));for(const r of ch.rows??[])for(const v of r.values??[r.value])assert.ok(Number.isFinite(v));}
 const grid=res.charts[3].rows;near(grid[3].values[4],-.0011538461538461,1e-9);near(grid[0].values[4],.028514851485148515,1e-12);
});
