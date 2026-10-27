import test from 'node:test';
import assert from 'node:assert/strict';
import { cpiSums1914, yearlyInflation, windows, keptShare, inflationWindowStats, cpiSeptember } from '../src/planning-inflation-windows-models.js';
import { defaults, planningResult } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('CPI annual sums cover 1914 to 2025 and match retrieved anchors',()=>{
 assert.equal(Object.keys(cpiSums1914).length,112);
 near(cpiSums1914[1914],72.1);near(cpiSums1914[2025],1970.2);near(cpiSeptember[2026]/cpiSeptember[2025]-1,170/164.9-1);
 const y=yearlyInflation();assert.equal(y.length,111);assert.equal(y.filter(r=>r.value<0).length,10);
 near(y.find(r=>r.x===2022).value,1814.9/1699.3-1);
});

test('defaults match an independent 40-digit Decimal check',()=>{
 const d=defaults('inflationWindows'),s=inflationWindowStats(d);
 assert.equal(s.count,92);near(s.median,0.028171748509238281,1e-12);
 assert.equal(s.hi.start,1971);near(s.hi.annual,0.071279470095151933,1e-12);
 assert.equal(s.lo.start,1920);near(s.lo.annual,-0.017526592745031122,1e-12);
 near(s.above,51/92);near(s.goalAssume,81930.822014519858,1e-12);near(s.goalHigh,198164.40542697526,1e-12);
 near(s.kept,.75);near(keptShare(.04,30,1914),51/82);
 assert.equal(windows(10).length,102);assert.equal(windows(30).length,82);assert.equal(windows(20,1991).length,15);
});

test('result renders four charts and handles a window that does not fit',()=>{
 const r=planningResult('inflationWindows',defaults('inflationWindows'));
 assert.equal(r.charts.length,4);assert.equal(r.charts[2].rows.reduce((a,b)=>a+b.value,0),92);
 const none=planningResult('inflationWindows',{...defaults('inflationWindows'),ivwYears:60,ivwFrom:2000});
 assert.equal(none.charts.length,1);
 assert.ok(planningGuides.some(g=>g.slug==='inflation-every-20-year-window-since-1914-purchasing-power-range'));
});
