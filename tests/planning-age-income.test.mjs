import test from 'node:test';
import assert from 'node:assert/strict';
import {ageIncomeData} from '../src/planning-age-income-data.js';
import {defaults,validInputs,planningResult} from '../src/planning-models.js';
import {ageIncomeGuides} from '../src/planning-age-income-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderFigure} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('curated source has 72 distinct observations, source units and dated provenance',()=>{
 assert.equal(ageIncomeData.table,'11-10-0239-01');assert.equal(ageIncomeData.released,'2026-04-29');assert.match(ageIncomeData.archiveSha256,/^[a-f0-9]{64}$/);assert.match(ageIncomeData.scope,/2024 constant CAD/);assert.match(ageIncomeData.scope,/not after-tax/);
 assert.deepEqual(ageIncomeData.years.map(x=>x.year),[2022,2023,2024]);
 for(const p of ageIncomeData.years){assert.equal(p.rows.length,6);assert.equal(new Set(p.rows.map(x=>x.age)).size,6);for(const r of p.rows)for(const k of ['persons','recipients','mean','median']){assert.ok(Number.isInteger(r[k])&&r[k]>=0);assert.ok(ageIncomeData.qualityCodes[r[k+'Quality']]);}}
 assert.deepEqual(ageIncomeData.years[2].rows.map(x=>x.median),[13400,49400,62800,67500,52700,13200]);
 assert.deepEqual(ageIncomeData.years[2].rows.map(x=>x.mean),[19400,56900,76200,84700,68300,34000]);
});
test('disjoint ages reconcile to their selected population, without aggregate or overlapping groups',()=>{
 for(const p of ageIncomeData.years){assert.ok(!p.rows.some(r=>r.age==='15 years and over'||r.age==='25 to 54 years'));assert.ok(p.rows.every(r=>r.recipients>0&&r.recipients<=r.persons));}
 assert.equal(ageIncomeData.years[2].rows.reduce((n,x)=>n+x.persons,0),34439100);
});
test('count segments conserve each population and income ratios use its matching denominator',()=>{
 for(const p of ageIncomeData.years){const result=planningResult('ageIncomeSnapshot',{incomeAgeYear:p.year});
  p.rows.forEach((r,n)=>{assert.equal(result.charts[1].rows[n].values.reduce((s,x)=>s+x,0),r.persons);assert.equal(result.charts[1].rows[n].values[0],r.recipients);near(result.charts[2].rows[n].value,r.recipients/r.persons);});
  const numerator=p.rows.reduce((n,x)=>n+x.recipients,0),denominator=p.rows.reduce((n,x)=>n+x.persons,0);near(result.metrics[2][1],numerator/denominator);
  assert.notEqual(result.metrics[2][1],result.charts[2].rows.reduce((n,x)=>n+x.value,0)/6);
 }
 near(planningResult('ageIncomeSnapshot').charts[2].rows[1].value,5313300/6081900);
});
test('source quality labels follow each statistic and reference year, including the older-group C',()=>{
 const a=planningResult('ageIncomeSnapshot',{incomeAgeYear:2023}),b=planningResult('ageIncomeSnapshot');assert.equal(a.charts[0].rows[5].label,'65+ · B/C');assert.equal(b.charts[0].rows[5].label,'65+ · B/B');assert.equal(a.charts[3].rows[5].label,'65+ · C');assert.equal(a.charts[1].rows[5].label,'65+ · A/A');
});
test('scatter points pair the same group and year, and render observed-data language',()=>{
 for(const p of ageIncomeData.years){const s=planningResult('ageIncomeSnapshot',{incomeAgeYear:p.year}).charts[3];assert.equal(s.rows.length,6);p.rows.forEach((r,n)=>{near(s.rows[n].x,r.recipients/r.persons);assert.equal(s.rows[n].value,r.median);});
  const html=renderFigure(s,300);assert.match(html,/Age band \/ median quality/);assert.match(html,/one observed age-band estimate/);assert.doesNotMatch(html,/selected allocation|alternative allocations|calculated scenarios|not observed annual returns/);
 }
});
test('all years preserve finite accessible charts with correct count, ratio and price-year units',()=>{
 for(const incomeAgeYear of [2022,2023,2024])for(const c of planningResult('ageIncomeSnapshot',{incomeAgeYear}).charts){const html=renderFigure(c,300);assert.match(html,/View chart data/);assert.match(html,/role="img"/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.ok(c.source.includes('1110023901'));}
 const r=planningResult('ageIncomeSnapshot');assert.equal(r.charts[1].unit,'count');assert.match(renderFigure(r.charts[1],300),/Age band/);assert.doesNotMatch(renderFigure(r.charts[1],300),/\$/);assert.equal(r.charts[2].unit,'percent');assert.match(r.charts[2].evidence,/Derived/);assert.match(r.charts[0].tableUnit,/2024 constant/);
});
test('a year change never mutates the published observations or invents a future reference',()=>{
 const before=JSON.stringify(ageIncomeData),a=planningResult('ageIncomeSnapshot');planningResult('ageIncomeSnapshot',{incomeAgeYear:2022});assert.equal(JSON.stringify(ageIncomeData),before);assert.deepEqual(planningResult('ageIncomeSnapshot'),a);
 assert.equal(defaults('ageIncomeSnapshot').incomeAgeYear,2024);for(const incomeAgeYear of [2021,2025,2023.5,NaN]){assert.equal(validInputs('ageIncomeSnapshot',{incomeAgeYear}),false);assert.throws(()=>planningResult('ageIncomeSnapshot',{incomeAgeYear}));}
});
test('detailed article keeps cross-sectional limits, retirement-income scope and existing related pages',()=>{
 const g=ageIncomeGuides[0];assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>=750);g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug),slug));assert.match(g.sections.map(x=>x.html).join(' '),/entire retirement income/);assert.match(g.chartScope,/No personal earnings projection/);assert.equal(g.sources.length,3);
});
