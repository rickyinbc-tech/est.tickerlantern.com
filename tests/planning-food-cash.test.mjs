import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {foodCashPath} from '../src/planning-food-cash-models.js';
import {foodSecurityRows,foodSecuritySource} from '../src/planning-food-cash-data.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const kind='foodCashPlanning';
test('the default plan has an interim gap despite ending at zero',()=>{
 const p=foodCashPath(defaults(kind));assert.deepEqual(p.rows.map(r=>r.value),[600,800,1000,600,200,-200,0]);assert.equal(p.requiredOpening,800);assert.equal(p.additionalGap,200);assert.equal(p.lowest,-200);assert.equal(p.ending,0);assert.equal(p.normalChange,200);assert.equal(p.reducedChange,-400);
});
test('cash is conserved without automatic food cuts, debt or invented receipts',()=>{
 const d=defaults(kind);for(const foodCashOpening of [0,600,20000])for(const foodCashIncome of [2000,3600,12000])for(const foodCashOther of [0,2600,10000])for(const foodCashFood of [0,800,3000])for(const foodCashReduction of [0,600,2000]){
  const input={...d,foodCashOpening,foodCashIncome,foodCashOther,foodCashFood,foodCashReduction},p=foodCashPath(input);assert.equal(p.ending,foodCashOpening+6*foodCashIncome-3*foodCashReduction-6*(foodCashOther+foodCashFood));
  const prefix=[0];for(const row of p.rows.slice(1)){assert.ok(row.receipts>=0);assert.equal(row.change,row.receipts-foodCashOther-foodCashFood);prefix.push(prefix.at(-1)+row.change);}
  assert.equal(p.requiredOpening,Math.max(0,-Math.min(...prefix)));assert.equal(p.additionalGap,Math.max(0,-p.lowest));assert.equal(p.lowest,foodCashOpening+Math.min(...prefix));
 }
});
test('enough opening cash removes the scheduled gap and no reduction matches the control path',()=>{
 const d=defaults(kind),base=foodCashPath(d),funded=foodCashPath({...d,foodCashOpening:800}),more=foodCashPath({...d,foodCashOpening:1000});assert.equal(funded.additionalGap,0);assert.equal(funded.lowest,0);assert.equal(more.lowest,200);assert.equal(base.requiredOpening,funded.requiredOpening);
 const r=planningResult(kind,{...d,foodCashReduction:0});assert.deepEqual(r.charts[3].series[0].rows,r.charts[3].series[1].rows);
});
test('fixed survey charts do not respond to hypothetical household cash inputs',()=>{
 const d=defaults(kind),a=planningResult(kind),b=planningResult(kind,{...d,foodCashOpening:0,foodCashIncome:2000,foodCashOther:10000,foodCashFood:3000,foodCashReduction:2000});assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));assert.notDeepEqual(a.metrics,b.metrics);assert.ok(a.charts.slice(0,2).every(c=>c.evidence==='Official statistics'));assert.ok(a.charts.slice(2).every(c=>c.evidence==='Hypothetical scenario'));
});
test('the reviewed revised vintage preserves annual estimates, flags, vectors and person units',()=>{
 assert.deepEqual(foodSecurityRows.map(r=>r.year),[2018,2019,2020,2021,2022,2023,2024]);assert.deepEqual(foodSecurityRows.map(r=>r.total),[16.8,16,15.8,18.5,23.1,25.7,24]);assert.deepEqual(foodSecurityRows.map(r=>r.moderateSevere),[11.7,10.9,11.2,12.9,17,19.4,18.4]);assert.equal(foodSecurityRows[0].quality.marginal,'C');assert.equal(foodSecurityRows[3].quality.severe,'C');assert.equal(foodSecurityRows.at(-1).quality.total,'A');
 assert.equal(foodSecuritySource.table,'13-10-0835-01');assert.equal(foodSecuritySource.demographic,'All persons');assert.equal(foodSecuritySource.unit,'Percentage of persons');assert.equal(foodSecuritySource.latestFoodInsecurePersons,9755600);assert.equal(foodSecuritySource.seriesMetadata.total.vector,'v1529611793');assert.match(foodSecuritySource.sourceCsvSha256,/^[0-9a-f]{64}$/);
 const r=planningResult(kind);assert.equal(r.charts[0].xMin,2018);for(let i=0;i<3;i++)assert.ok(Math.abs(r.charts[1].rows[i].value-[.056,.119,.065][i])<1e-12);
});
test('the scenario grid substitutes opening cash and reductions without replacing intended food spending',()=>{
 const d=defaults(kind),r=planningResult(kind);for(let i=0;i<4;i++)for(let j=0;j<4;j++)assert.equal(r.charts[4].rows[i].values[j],foodCashPath({...d,foodCashOpening:[0,600,1200,2400][i],foodCashReduction:[0,600,1200,1800][j]}).additionalGap);
 assert.equal(r.charts[4].rows[1].values[1],200);assert.equal(r.charts[2].rows.reduce((s,p)=>s+p.value,0),-400);assert.deepEqual(r.charts[4],planningResult(kind,{...d,foodCashOpening:20000,foodCashReduction:0}).charts[4]);
});
test('the article preserves shared-denominator, revision, coverage and non-assessment boundaries',()=>{
 const matches=planningGuides.filter(g=>g.planning===kind);assert.equal(matches.length,1);const g=matches[0],text=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,8);assert.match(text,/percentage of persons/);assert.match(text,/rather than a percentage of Canadian households/);assert.match(text,/2021 Census/);assert.match(text,/negative 200/);assert.match(text,/extremely remote/);assert.match(text,/not a nutrition benchmark/);assert.match(text,/24\.0% \(A\)/);
 for(const related of g.related)assert.ok(planningGuides.some(p=>p.slug===related),related);
});
test('input bounds keep reduced receipts nonnegative and invalid inputs do not produce results',()=>{
 const d=defaults(kind);assert.equal(foodCashPath({...d,foodCashIncome:2000,foodCashReduction:2000}).rows[3].receipts,0);for(const input of [{...d,foodCashIncome:0},{...d,foodCashOpening:-1},{...d,foodCashReduction:2001},{...d,foodCashFood:NaN}])assert.throws(()=>planningResult(kind,input));
});
test('default and extreme plans render five finite figures with accessible exact-value tables',()=>{
 const d=defaults(kind),fields=definitions[kind].fields,cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi])),{...d,foodCashOpening:0,foodCashIncome:2000,foodCashOther:10000,foodCashFood:3000,foodCashReduction:2000}];
 for(const input of cases)for(const width of [300,760]){const r=planningResult(kind,input),html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
});
