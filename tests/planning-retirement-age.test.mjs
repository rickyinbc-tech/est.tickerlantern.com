import test from 'node:test';
import assert from 'node:assert/strict';
import {retirementAgeData as data} from '../src/planning-retirement-age-data.js';
import {retirementAgeYear} from '../src/planning-retirement-age-models.js';
import {retirementAgeGuides} from '../src/planning-retirement-age-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {defaults,validInputs,planningResult} from '../src/planning-models.js';
import {renderFigure,renderPlanningExplorer} from '../src/planning-charts.js';

test('the dated public extract retains reported total and class values with the source population and correction',()=>{
  assert.deepEqual(data.years,[2021,2022,2023,2024,2025]);assert.equal(data.correctionDate,'2025-11-17');
  assert.equal(data.geography,'Canada, excluding territories');assert.match(data.population,/not working/);assert.match(data.genderScope,/Total - Gender/);
  assert.deepEqual(data.national['2025'],{mean:65.4,median:65.3});assert.deepEqual(data.national['2021'],{mean:64.3,median:64.4});
  assert.deepEqual(data.classes.map(r=>r['2025']),[{mean:62.6,median:61.8},{mean:66,median:65.4},{mean:68.4,median:67.4}]);
  assert.equal(data.classes.length,3);assert.match(data.sourceSHA256,/^[a-f0-9]{64}$/);
});
test('snapshot-year selection updates the reported measures while fixed historical comparisons remain fixed',()=>{
  const before=JSON.stringify(data),a=planningResult('retirementAgeStatistics',{retirementSourceYear:2025}),b=planningResult('retirementAgeStatistics',{retirementSourceYear:2021});
  assert.notDeepEqual(a.metrics,b.metrics);assert.equal(a.metrics[2][1],.1);assert.equal(b.metrics[2][1],-.1);
  assert.notDeepEqual(a.charts[1].rows,b.charts[1].rows);assert.notDeepEqual(a.charts[2].rows,b.charts[2].rows);
  assert.deepEqual(a.charts[0],b.charts[0]);assert.deepEqual(a.charts[3],b.charts[3]);assert.equal(JSON.stringify(data),before);
});
test('the all-retirees aggregate stays outside worker-class bars and differences preserve their sign',()=>{
  const result=planningResult('retirementAgeStatistics',{retirementSourceYear:2024});
  assert.equal(result.charts[1].rows.length,3);assert.ok(result.charts[1].rows.every(r=>r.label!==data.national.label));
  assert.deepEqual(result.charts[2].rows.map(r=>r.value),[-.3,0,1.2]);
  assert.deepEqual(result.charts[3].rows[0].values,[0,1.2,1.1,-2.3]);
  assert.deepEqual(result.charts[3].rows[1].values,[.2,.2,0,.3]);
  assert.deepEqual(result.charts[3].rows[2].values,[2.1,0,-1.1,.7]);
});
test('derived comparisons use the same class and rounded annual estimates, without recovering a national median from parts',()=>{
  for(const year of data.years){const p=retirementAgeYear(year),result=planningResult('retirementAgeStatistics',{retirementSourceYear:year});
    assert.equal(result.charts[1].rows.length,p.classes.length);
    p.classes.forEach((r,i)=>{assert.deepEqual(result.charts[1].rows[i].values,[r.mean,r.median]);assert.ok(Math.abs(result.charts[2].rows[i].value-(r.mean-r.median))<1e-10);});
  }
  const simpleClassMean=data.classes.reduce((s,r)=>s+r['2025'].mean,0)/3;
  assert.ok(Math.abs(simpleClassMean-data.national['2025'].mean)>.2);
});
test('source years must be present and whole; no forecast or fractional interpolation is accepted',()=>{
  assert.equal(defaults('retirementAgeStatistics').retirementSourceYear,2025);
  for(const retirementSourceYear of [2020,2024.5,2026,NaN]){
    assert.equal(validInputs('retirementAgeStatistics',{retirementSourceYear}),false);
    assert.throws(()=>planningResult('retirementAgeStatistics',{retirementSourceYear}));assert.throws(()=>retirementAgeYear(retirementSourceYear));
  }
  assert.match(renderPlanningExplorer('retirementAgeStatistics'),/Interactive data explorer/);
  assert.match(renderPlanningExplorer('retirementAgeStatistics'),/Restore source year/);
});
test('source figures identify real units and row groups while the truncated line axis includes every observation',()=>{
  const result=planningResult('retirementAgeStatistics',{retirementSourceYear:2025});
  assert.equal(new Set(result.charts.map(c=>c.type)).size,4);
  const history=result.charts[0];assert.equal(history.yMin,64);assert.equal(history.yMax,66);assert.match(history.unitLabel,/zero omitted/);
  assert.ok(history.series.flatMap(s=>s.rows).every(r=>r.value>=64&&r.value<=66));
  for(const chart of result.charts)for(const width of [300,354,760]){
    const html=renderFigure(chart,width);assert.match(html,/role="img"/);assert.match(html,/<table/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
    if(chart.type==='line')assert.match(html,/Values in years of age/);
    else {assert.match(html,/<th scope="col">Class of worker<\/th>/);assert.doesNotMatch(html,/<th scope="col">Assumption<\/th>|<th scope="col">Scenario<\/th>/);}
  }
});
test('small derived-age axes retain distinct, numerically exact tick labels',()=>{
  const r=planningResult('retirementAgeStatistics',{retirementSourceYear:2023});
  const html=renderFigure(r.charts[2],300);assert.match(html,/>0\.05<\/text>/);assert.match(html,/>0\.15<\/text>/);
  const earlier=renderFigure(planningResult('retirementAgeStatistics',{retirementSourceYear:2021}).charts[2],300);
  assert.match(earlier,/>1\.375<\/text>/);
});
test('optional chart labels retain existing CAD and scenario defaults on other pages',()=>{
  const line={id:'default-cad',type:'line',title:'Existing money chart',unit:'money',xLabel:'Year',series:[{name:'Cash',rows:[{x:0,value:1},{x:1,value:2}]}]};
  assert.match(renderFigure(line),/Values in CAD/);
  const heat={id:'default-heat',type:'heatmap',title:'Existing matrix',unit:'money',columns:['A'],rows:[{label:'B',values:[1]}]};
  assert.match(renderFigure(heat),/<th scope="col">Assumption<\/th>/);
});
test('the English guide is substantial, links existing planning pages and labels its independent household example',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const guide of retirementAgeGuides){assert.ok(slugs.has(guide.slug));assert.equal(guide.sections.length,6);assert.ok(guide.related.every(s=>slugs.has(s)));
    const prose=guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ');assert.ok(prose.trim().split(/\s+/).length>=850);
    assert.match(prose,/CAD 210,000/);assert.match(prose,/authored numbers do not come from the retirement-age table/);assert.match(prose,/correction dated 17 November 2025/);
  }
});
