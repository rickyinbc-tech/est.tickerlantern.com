import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {cpiLevelSource} from '../src/planning-cpi-level-data.js';
import {cpiBudgetPath,cpiFutureBudget} from '../src/planning-cpi-level-models.js';
import {renderResult,format} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);

test('the CPI snapshot has six unique annual Canada all-items observations in a consistent index unit',()=>{
 assert.equal(cpiLevelSource.table,'18-10-0005-01');assert.equal(cpiLevelSource.geography,'Canada');assert.equal(cpiLevelSource.product,'All-items');assert.equal(cpiLevelSource.unit,'2002=100');
 assert.equal(cpiLevelSource.retrieved,'2026-10-25');assert.equal(cpiLevelSource.released,'2026-01-19');
 assert.deepEqual(cpiLevelSource.rows,[{year:2020,index:137},{year:2021,index:141.6},{year:2022,index:151.2},{year:2023,index:157.1},{year:2024,index:160.9},{year:2025,index:164.2}]);
 assert.equal(new Set(cpiLevelSource.rows.map(r=>r.year)).size,6);assert.match(cpiLevelSource.archiveSha256,/^[0-9a-f]{64}$/);
});
test('chaining the observed growth factors matches the endpoint index ratio',()=>{
 const p=cpiBudgetPath(3000);let factor=1;
 for(const row of p.slice(1))factor*=1+row.change;
 near(factor,164.2/137);near(p.at(-1).value,3000*164.2/137);
 assert.ok(p[2].change>p[3].change&&p[3].change>p[4].change&&p[4].change>p[5].change);
 assert.ok(p.slice(1).every((r,i)=>r.index>p[i].index));
});
test('the expense waterfall reconciles a monthly equivalent, not the sum of historical bills',()=>{
 const d=defaults('cpiLevel'),r=planningResult('cpiLevel');
 near(r.charts[2].rows.reduce((sum,row)=>sum+row.value,0),d.baseBudget*164.2/137);
 near(r.metrics[0][1],164.2/137-1);near(r.metrics[1][1],3595.620437956204);
 assert.equal(r.charts[0].unit,'decimal');assert.equal(format(164.2,r.charts[0].unit),'164.2');
 assert.match(r.charts[2].note,/does not total all household bills/);
});
test('hypothetical controls preserve historical index and budget graphics',()=>{
 const d=defaults('cpiLevel'),base=planningResult('cpiLevel'),edited=planningResult('cpiLevel',{...d,futureOne:-2,futureTwo:5});
 for(let index=0;index<3;index++)assert.deepEqual(edited.charts[index],base.charts[index]);
 near(base.metrics[2][1],d.baseBudget*164.2/137*1.02*1.01);
 near(edited.metrics[2][1],d.baseBudget*164.2/137*.98*1.05);
 assert.deepEqual(edited.charts[4],base.charts[4]);assert.match(base.note,/not official data or a forecast/);
});
test('positive, zero and negative changes compound from different levels',()=>{
 near(cpiFutureBudget(100,2,1),103.02);near(cpiFutureBudget(100,2,-2),99.96);near(cpiFutureBudget(100,0,0),100);
 assert.ok(cpiFutureBudget(100,-2,0)<100);
 assert.match(renderResult(planningResult('cpiLevel'),300),/>-0.04%<\/text>/);
 assert.equal(planningResult('cpiLevel').charts[4].signed,true);
 const grid=planningResult('cpiLevel').charts[4];
 for(let row=0;row<4;row++)for(let col=0;col<4;col++)near(grid.rows[row].values[col],(1+[-2,0,2,5][row]/100)*(1+[-2,0,2,5][col]/100)-1);
});
test('budget scaling changes dollar illustrations while leaving observed statistics fixed',()=>{
 const d=defaults('cpiLevel'),base=planningResult('cpiLevel'),double=planningResult('cpiLevel',{...d,baseBudget:6000});
 assert.deepEqual(double.charts[0],base.charts[0]);assert.deepEqual(double.charts[1],base.charts[1]);
 near(double.metrics[1][1],2*base.metrics[1][1]);near(double.metrics[2][1],2*base.metrics[2][1]);
});
test('all input boundaries produce five finite chart/table pairs including a zero expense',()=>{
 const d=defaults('cpiLevel'),fields=definitions.cpiLevel.fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const result=planningResult('cpiLevel',input);assert.equal(result.charts.length,5);
  for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
});
