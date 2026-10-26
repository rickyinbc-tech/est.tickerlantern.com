import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {cgeb} from '../src/planning-cgeb-year-models.js';

const kind='cgebBenefitYear';
// CRA payments chart, July 2026–June 2027 (2025 base year), page dated 8 June 2026: columns 0–4+ children.
const single={11000:[445,1124,1358,1592,1826],14000:[493.72,1124,1358,1592,1826],15000:[513.72,1124,1358,1592,1826],20000:[613.72,1124,1358,1592,1826],25000:[679,1124,1358,1592,1826],30000:[679,1124,1358,1592,1826],35000:[679,1124,1358,1592,1826],40000:[679,1124,1358,1592,1826],45000:[679,1124,1358,1592,1826],50000:[500.6,945.6,1179.6,1413.6,1647.6],55000:[250.6,695.6,929.6,1163.6,1397.6],60000:[.6,445.6,679.6,913.6,1147.6],65000:[0,195.6,429.6,663.6,897.6],70000:[0,0,179.6,413.6,647.6],75000:[0,0,0,163.6,397.6],80000:[0,0,0,0,147.6],85000:[0,0,0,0,0]};
const couple={46000:[890,1124,1358,1592,1826],48000:[811.6,1045.6,1279.6,1513.6,1747.6],50000:[711.6,945.6,1179.6,1413.6,1647.6],55000:[461.6,695.6,929.6,1163.6,1397.6],60000:[211.6,445.6,679.6,913.6,1147.6],65000:[0,195.6,429.6,663.6,897.6],70000:[0,0,179.6,413.6,647.6],75000:[0,0,0,163.6,397.6],80000:[0,0,0,0,147.6],85000:[0,0,0,0,0]};
test('derived parameters reproduce all 135 cells of the CRA 2026–27 payments chart',()=>{
 let cells=0;
 for(const [married,table] of [[0,single],[1,couple]])for(const [afni,row] of Object.entries(table))row.forEach((value,children)=>{cells++;assert.equal(cgeb({married,children,afni:+afni}).annual,value,`${married}/${children}/${afni}`);});
 assert.equal(cells,135);
});
test('boundaries, zero points and the lump-sum rule',()=>{
 assert.equal(cgeb({afni:11564}).annual,445);assert.equal(cgeb({afni:23264}).annual,679);assert.equal(cgeb({afni:46432}).annual,679);
 assert.equal(cgeb({afni:60012}).annual,0);assert.equal(cgeb({afni:60012}).zero,60012);
 assert.equal(cgeb({married:1}).zero,64232);assert.equal(cgeb({children:1}).zero,68912);assert.equal(cgeb({married:1,children:2}).zero,73592);assert.equal(cgeb({married:1,children:4}).zero,82952);
 assert.equal(cgeb({children:1,afni:0}).annual,cgeb({married:1,children:1,afni:0}).annual);
 assert.deepEqual(cgeb({afni:57000}).quarters,[150.6,0,0,0]);assert.deepEqual(cgeb({afni:56000}).quarters,[50.15,50.15,50.15,50.15]);
 assert.deepEqual(cgeb({married:1,children:2,afni:40000}).quarters,[339.5,339.5,339.5,339.5]);
});
test('default single household reconciles to the worked example',()=>{
 const r=planningResult(kind,defaults(kind));
 assert.deepEqual(r.metrics.map(m=>m[1]),[400.6,100.15,550.6,150,60012]);
 assert.deepEqual(r.charts[1].rows.map(x=>x.value),[445,234,-278.4]);
 assert.deepEqual(r.charts[2].rows.map(x=>x.values),[[100.15,137.65],[100.15,137.65],[100.15,137.65],[100.15,137.65]]);
 const m=r.charts[3].series[0].rows;assert.equal(m.find(x=>x.x===15000).value,.02);assert.equal(m.find(x=>x.x===30000).value,0);assert.equal(m.find(x=>x.x===50000).value,-.05);assert.equal(m.find(x=>x.x===70000).value,0);
 assert.equal(r.charts[4].rows.reduce((s,x)=>s+x.values[0],0).toFixed(6),'9.846224');
 const low=planningResult(kind,{...defaults(kind),cgebAfni:15000,cgebChange:1000});assert.equal(low.metrics[0][1],513.72);assert.equal(low.metrics[3][1],20);
});
test('input limits, guide wiring and accessible figures remain valid',()=>{
 const d=defaults(kind),guide=planningGuides.find(g=>g.slug==='canada-groceries-essentials-benefit-2026-27-phase-out-quarterly-payments');
 assert.ok(guide);assert.ok(guide.sources.length>=6);assert.ok(guide.sections.length>=6);
 assert.equal(guide.related.length,3);assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)));
 for(const bad of [{...d,cgebChildren:5},{...d,cgebMarried:.5},{...d,cgebAfni:2000,cgebChange:-3000},{...d,cgebAfni:-1},{...d,cgebChange:70000}])assert.equal(validInputs(kind,bad),false);
 for(const input of [d,{...d,cgebAfni:0,cgebChange:0},{...d,cgebMarried:1,cgebChildren:4,cgebAfni:120000,cgebChange:60000},{...d,cgebChildren:1,cgebAfni:60000,cgebChange:-60000}]){
  assert.ok(validInputs(kind,input));const result=planningResult(kind,input),html=renderResult(result,360);
  assert.equal(result.charts.length,5);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
 }
});
