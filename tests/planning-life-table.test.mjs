import test from 'node:test';import assert from 'node:assert/strict';
import {lifeTableData} from '../src/planning-life-table-data.js';import {periodSurvival} from '../src/planning-life-table-models.js';
import {defaults,planningResult,validInputs} from '../src/planning-models.js';import {lifeTableGuides} from '../src/planning-life-table-guides.js';import {planningGuides} from '../src/planning-guides.js';import {renderFigure} from '../src/planning-charts.js';
const input=o=>({...defaults('periodLifeCash'),...o}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('the dated preliminary period and source margins remain explicit despite blank row flags',()=>{
 assert.equal(lifeTableData.table,'13-10-0114-01');assert.equal(lifeTableData.period,'2022/2024');assert.equal(lifeTableData.released,'2026-01-13');assert.equal(lifeTableData.preliminary,true);assert.match(lifeTableData.preliminaryBasis,/STATUS cells are blank/);assert.match(lifeTableData.archiveSha256,/^[a-f0-9]{64}$/);
 assert.deepEqual(lifeTableData.groups.map(g=>g.sex),['Both sexes','Males','Females']);assert.equal(lifeTableData.groups.reduce((n,g)=>n+g.survivors.length+g.expectations.length*2,0),294);
});
test('survivors are positive, monotone radix values and expectations retain their own margins',()=>{
 for(const g of lifeTableData.groups){assert.equal(g.survivors.length,46);assert.deepEqual(g.survivors.map(r=>r.age),Array.from({length:46},(_,n)=>n+55));assert.equal(g.expectations.length,26);
  g.survivors.forEach((r,n,a)=>{assert.ok(Number.isInteger(r.value)&&r.value>0&&r.value<=100000);if(n)assert.ok(r.value<=a[n-1].value);});g.expectations.forEach(r=>assert.ok(r.years>r.margin95&&r.margin95>=0));
 }
 assert.deepEqual(lifeTableData.groups[0].expectations.find(x=>x.age===65),{age:65,years:20.85,margin95:0.02});
});
test('published mean intervals use their corresponding margin rather than lifespan dispersion',()=>{
 for(let age=55;age<=80;age++){
  const result=planningResult('periodLifeCash',input({lifeTableAge:age}));result.charts[0].rows.forEach((r,n)=>{const e=lifeTableData.groups[n].expectations.find(x=>x.age===age);assert.equal(r.value,e.years);near(r.lower,Math.round((e.years-e.margin95)*100)/100);near(r.upper,Math.round((e.years+e.margin95)*100)/100);});
 }
 const r=planningResult('periodLifeCash').charts[0].rows[0];assert.deepEqual([r.value,r.lower,r.upper],[20.85,20.83,20.87]);
});
test('default conditional survival divides by survivors at 65, never by the birth radix',()=>{
 const g=lifeTableData.groups[0];assert.equal(g.survivors.find(r=>r.age===65).value,88760);assert.equal(g.survivors.find(r=>r.age===95).value,13600);near(periodSurvival(g,65,95),13600/88760);assert.notEqual(periodSurvival(g,65,95),13600/100000);
 near(periodSurvival(g,65,85),50722/88760);near(periodSurvival(g,65,100),3129/88760);
});
test('conditional curves start at one, stay monotone and preserve survivors at the display boundary',()=>{
 for(const age of [55,65,80]){const r=planningResult('periodLifeCash',input({lifeTableAge:age}));r.charts[1].series.forEach((s,n)=>{assert.equal(s.rows[0].x,age);assert.equal(s.rows[0].value,1);assert.equal(s.rows.at(-1).x,100);assert.ok(s.rows.at(-1).value>0);s.rows.forEach((row,k,a)=>{assert.ok(row.value>0&&row.value<=1);if(k)assert.ok(row.value<=a[k-1].value);near(row.value,periodSurvival(lifeTableData.groups[n],age,row.x));});});}
});
test('conditional probabilities compose across birthdays within the same period category',()=>{
 for(const g of lifeTableData.groups)near(periodSurvival(g,55,95),periodSurvival(g,55,75)*periodSurvival(g,75,95));
 assert.throws(()=>periodSurvival(lifeTableData.groups[0],65,64));assert.throws(()=>periodSurvival(lifeTableData.groups[0],65,101));
});
test('later-age thresholds match their own curve points and are not additive categories',()=>{
 for(const age of [55,65,80]){const r=planningResult('periodLifeCash',input({lifeTableAge:age}));r.charts[2].rows.forEach((row,k)=>row.values.forEach((v,n)=>near(v,r.charts[1].series[n].rows.find(p=>p.x===[85,90,95,100][k]).value)));assert.match(r.charts[2].note,/nested/);}
});
test('the authored cash horizon is unweighted and cannot alter any official statistics',()=>{
 const a=planningResult('periodLifeCash'),b=planningResult('periodLifeCash',input({lifeTableGap:0})),c=planningResult('periodLifeCash',input({lifeTableGap:80000}));assert.deepEqual(a.charts.slice(0,3),b.charts.slice(0,3));assert.deepEqual(a.charts.slice(0,3),c.charts.slice(0,3));assert.deepEqual(a.charts[3].rows.map(r=>r.value),[800000,1000000,1200000,1400000]);assert.ok(b.charts[3].rows.every(r=>r.value===0));a.charts[3].rows.forEach((r,n)=>assert.equal(c.charts[3].rows[n].value,2*r.value));assert.ok(!a.charts[3].source);
});
test('all supported age/gap boundaries render finite accessible charts with source and scenario separation',()=>{
 for(const lifeTableAge of [55,65,80])for(const lifeTableGap of [0,40000,150000]){const r=planningResult('periodLifeCash',{lifeTableAge,lifeTableGap});assert.equal(r.charts.length,4);for(const c of r.charts){const h=renderFigure(c,300);assert.match(h,/View chart data/);assert.match(h,/role="img"/);assert.doesNotMatch(h,/NaN|Infinity|undefined/);}assert.match(renderFigure(r.charts[0],300),/95% CI/);assert.doesNotMatch(renderFigure(r.charts[0],300),/\$/);assert.match(renderFigure(r.charts[3],300),/Hypothetical scenario/);}
});
test('unsupported conditioning ages and non-finite cash are rejected without changing source data',()=>{
 const before=JSON.stringify(lifeTableData);for(const o of [{lifeTableAge:54},{lifeTableAge:81},{lifeTableAge:65.5},{lifeTableGap:NaN}]){assert.equal(validInputs('periodLifeCash',input(o)),false);assert.throws(()=>planningResult('periodLifeCash',input(o)));}assert.equal(JSON.stringify(lifeTableData),before);
});
test('the detailed article retains period, preliminary and individual-lifespan boundaries',()=>{
 const g=lifeTableGuides[0];assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>=750);assert.match(g.chartScope,/preliminary/);assert.match(g.chartScope,/no mortality weighting/);g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug),slug));assert.equal(g.sources.length,2);
});
