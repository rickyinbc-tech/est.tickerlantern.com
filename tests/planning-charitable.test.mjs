import test from 'node:test';
import assert from 'node:assert/strict';
import {charitableDonationsData as data} from '../src/planning-charitable-data.js';
import {charitableYearRows} from '../src/planning-charitable-models.js';
import {charitableGuides as guides} from '../src/planning-charitable-guides.js';
import {defaults,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {format,renderFigure,renderPlanningExplorer} from '../src/planning-charts.js';

test('fixed claimant statistics retain their units, source years and observed national values',()=>{
  assert.deepEqual(data.years,[2022,2023]);assert.equal(data.jurisdictions.length,13);assert.equal(data.ages.length,7);
  assert.deepEqual(data.national['2023'],{claimants:5048780,totalThousandsCAD:12782690,medianCAD:390});
  assert.deepEqual(data.national['2022'],{claimants:4953370,totalThousandsCAD:11432695,medianCAD:380});
  assert.match(data.population,/Tax filers/);assert.equal(data.ageScope,'Both sexes, with all-age aggregate stored separately');
});
test('Canada stays outside jurisdiction bars and every source year updates the complete extract',()=>{
  const before=JSON.stringify(data),a=planningResult('charitableStatistics',{donationTaxYear:2023}),b=planningResult('charitableStatistics',{donationTaxYear:2022});
  assert.notDeepEqual(a.metrics,b.metrics);assert.equal(a.metrics[1][1],12.78269);
  for(let i=0;i<3;i++){assert.equal(a.charts[i].rows.length,13);assert.ok(a.charts[i].rows.every(r=>r.label!=='Canada'));assert.notDeepEqual(a.charts[i].rows,b.charts[i].rows);}
  assert.equal(a.charts[0].rows.find(r=>r.label==='Ontario').value,1996640);
  assert.equal(a.charts[2].rows.find(r=>r.label==='Ontario').value,5621620000);
  assert.equal(a.charts[1].rows[0].label,'Nunavut');assert.equal(a.charts[1].rows[0].value,910);
  assert.equal(before,JSON.stringify(data));
});
test('derived means use claimant counts and thousands-to-dollar conversion within the Both sexes age group',()=>{
  for(const year of data.years){const p=charitableYearRows(year),result=planningResult('charitableStatistics',{donationTaxYear:year});
    for(const row of p.ages){const expected=row.totalThousandsCAD*1000/row.claimants;assert.ok(Math.abs(row.approximateMeanCAD-expected)<=.5);}
    assert.deepEqual(result.charts[3].rows,p.ages.map(r=>({label:r.label,values:[r.medianCAD,r.approximateMeanCAD]})));
    assert.match(result.charts[3].unitLabel,/both sexes/);assert.match(result.charts[3].evidence,/derived/);
  }
  assert.equal(Math.round(data.national['2023'].totalThousandsCAD*1000/data.national['2023'].claimants),2532);
  assert.equal(Math.round(data.national['2022'].totalThousandsCAD*1000/data.national['2022'].claimants),2308);
});
test('unsupported and fractional source years are rejected rather than interpolated or invented',()=>{
  assert.equal(defaults('charitableStatistics').donationTaxYear,2023);
  for(const donationTaxYear of [2021,2022.5,2024,NaN]){assert.equal(validInputs('charitableStatistics',{donationTaxYear}),false);assert.throws(()=>planningResult('charitableStatistics',{donationTaxYear}));assert.throws(()=>charitableYearRows(donationTaxYear));}
});
test('count and billion-dollar ticks compact while tables retain full published values',()=>{
  assert.equal(format(1996640,'count'), '1,996,640');assert.equal(format(1996640,'count',true),'2m');assert.equal(format(12500,'count',true),'12.5k');
  assert.equal(format(5621620000,'money'), '$5,621,620,000');assert.equal(format(2500000000,'money',true),'$2.5b');assert.equal(format(10000000000,'money',true),'$10b');
  assert.equal(format(2023,'integer',true),'2,023');
  const p=planningResult('charitableStatistics',{donationTaxYear:2023});assert.match(renderFigure(p.charts[0],300),/1,996,640/);assert.match(renderFigure(p.charts[2],300),/\$5,621,620,000/);
});
test('source-year controls identify a data explorer and all observations render accessible charts',()=>{
  const controls=renderPlanningExplorer('charitableStatistics');assert.match(controls,/Interactive data explorer/);assert.match(controls,/Restore source year/);assert.match(controls,/Range 2022 to 2023/);assert.doesNotMatch(controls,/Change an assumption/);
  for(const donationTaxYear of data.years){const p=planningResult('charitableStatistics',{donationTaxYear});assert.equal(p.charts.length,4);assert.equal(new Set(p.charts.map(c=>c.id)).size,4);
    for(const c of p.charts)for(const width of [300,354,760]){const html=renderFigure(c,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/role="img"/);assert.match(html,/<table/);assert.ok(c.source.startsWith('https://www150.statcan.gc.ca/'));}
  }
});
test('statistics guide has six substantial English sections, distinct scope and valid related destinations',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const g of guides){assert.equal(g.sections.length,6);assert.ok(g.related.every(s=>slugs.has(s)));const words=g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').trim().split(/\s+/).length;assert.ok(words>=750,`${words} words`);assert.match(g.chartScope,/fixed 2022\/2023 official/);assert.ok(slugs.has(g.slug));}
});
