import test from 'node:test';
import assert from 'node:assert/strict';
import {rppStatistics} from '../src/planning-rpp-statistics-data.js';
import {defaults,planningResult,validInputs} from '../src/planning-models.js';
import {renderFigure} from '../src/planning-charts.js';
import {rppStatisticsGuides} from '../src/planning-rpp-statistics-guides.js';
import {planningGuides} from '../src/planning-guides.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('official count snapshot retains its dimensions, release and distinct date clocks',()=>{
 assert.equal(rppStatistics.table,'11-10-0099-01');assert.equal(rppStatistics.released,'2026-07-28');assert.match(rppStatistics.scope,/preceding calendar year/);assert.match(rppStatistics.scope,/1 January/);assert.match(rppStatistics.archiveSha256,/^[0-9a-f]{64}$/);
 assert.deepEqual(rppStatistics.rows.map(r=>r.referenceYear),[2021,2022,2023,2024,2025]);
 assert.deepEqual(rppStatistics.rows.map(r=>r.plans),[16359,16164,16168,16259,15762]);
 assert.deepEqual(rppStatistics.rows.map(r=>r.members),[6593256,6711260,6927094,7220609,7352686]);
});
test('six top-level funding categories reconcile without adding insurance children again',()=>{
 for(const r of rppStatistics.rows){assert.equal(r.funding.length,6);assert.equal(new Set(r.funding.map(x=>x.label)).size,6);assert.equal(r.funding.reduce((s,x)=>s+x.members,0),r.members);assert.ok(r.funding.every(x=>Number.isInteger(x.members)&&x.members>=0));assert.ok(!r.funding.some(x=>x.label==='Insurance company contract fully guaranteed'));}
 const latest=rppStatistics.rows.at(-1);assert.equal(latest.funding.find(x=>x.label==='Trust agreement').members,4276098);
 assert.equal(latest.funding.find(x=>x.label==='Total of insurance company contract').members,1197884);
});
test('index values use the corresponding series denominator',()=>{
 const result=planningResult('rppCountsStudy'),chart=result.charts[0];
 assert.equal(chart.yMin,95);assert.equal(chart.yMax,115);assert.equal(chart.evidence,'Derived from official statistics');assert.equal(chart.series[0].rows[0].value,100);assert.equal(chart.series[1].rows[0].value,100);
 near(chart.series[0].rows.at(-1).value,15762/16359*100);near(chart.series[1].rows.at(-1).value,7352686/6593256*100);
 near(result.metrics[2][1],759430/6593256);
});
test('view changes filter the snapshot while preserving the same baseline',()=>{
 for(const rppEndYear of [2022,2023,2024,2025]){
  const result=planningResult('rppCountsStudy',{rppEndYear}),latest=rppStatistics.rows.find(r=>r.referenceYear===rppEndYear);
  assert.equal(result.charts[0].series[0].rows.length,rppEndYear-2020);assert.equal(result.charts[0].series[0].rows[0].value,100);
  assert.equal(result.metrics[0][1],latest.plans);assert.equal(result.metrics[1][1],latest.members);
  assert.equal(result.charts[3].axisTicks,2);assert.equal(result.charts[3].rows.reduce((s,r)=>s+r.value,0),latest.members);
  assert.ok(result.charts[3].rows.every((r,n,a)=>!n||a[n-1].value>=r.value));
 }
});
test('reading different years never edits the official observations',()=>{
 const before=JSON.stringify(rppStatistics),a=planningResult('rppCountsStudy');planningResult('rppCountsStudy',{rppEndYear:2022});assert.deepEqual(planningResult('rppCountsStudy'),a);assert.equal(JSON.stringify(rppStatistics),before);
});
test('the count displays and data tables preserve count units instead of dollars',()=>{
 for(const rppEndYear of [2022,2025])for(const chart of planningResult('rppCountsStudy',{rppEndYear}).charts){
  const html=renderFigure(chart,300);assert.match(html,/View chart data/);assert.match(html,/role="img"/);assert.doesNotMatch(html,/NaN|Infinity|undefined|Canadian dollars|\$/);assert.ok(chart.source.includes('1110009901'));
 }
});
test('unavailable and fractional reference years are rejected',()=>{
 const d=defaults('rppCountsStudy');assert.equal(d.rppEndYear,2025);
 for(const rppEndYear of [2021,2026,2024.5,NaN]){assert.equal(validInputs('rppCountsStudy',{rppEndYear}),false);assert.throws(()=>planningResult('rppCountsStudy',{rppEndYear}));}
});
test('the article is substantive and connects to existing planning guides',()=>{
 const g=rppStatisticsGuides[0];assert.ok(g.sections.reduce((n,r)=>n+r.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>=700);
 for(const slug of g.related)assert.ok(planningGuides.some(x=>x.slug===slug));assert.match(g.chartScope,/no forecast/);assert.equal(planningResult(g.planning).charts.length,4);
});
