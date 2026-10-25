import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {labourBudgetSource} from '../src/planning-labour-budget-data.js';
import {labourFunding} from '../src/planning-labour-budget-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);

test('the LFS snapshot preserves eight selected series with their units, demographic grain and dates',()=>{
 const s=labourBudgetSource;assert.equal(s.table,'14-10-0327-01');assert.equal(s.period,'2025 annual estimates');assert.equal(s.ageGroup,'15 years and over');assert.equal(s.gender,'Total - Gender');
 assert.equal(s.geography,'Canada, excluding the territories');assert.equal(s.countUnit,'Persons in thousands');assert.equal(s.rateUnit,'Percent');assert.equal(s.released,'2026-01-09');assert.equal(s.retrieved,'2026-10-25');
 assert.deepEqual(s.counts,{population:34569.4,labourForce:22567.6,employment:21028.7,unemployment:1538.9,notInLabourForce:12001.8});assert.deepEqual(s.rates,{unemployment:6.8,participation:65.3,employment:60.8});assert.deepEqual(s.verifiedFootnotes,[8,9,10,13]);assert.match(s.archiveSha256,/^[0-9a-f]{64}$/);
});
test('population components and published-rate denominators reconcile within one-decimal source rounding',()=>{
 const {counts:c,rates:r}=labourBudgetSource;
 near(c.employment+c.unemployment,c.labourForce);near(c.labourForce+c.notInLabourForce,c.population);
 for(const [rate,numerator,denominator] of [[r.unemployment,c.unemployment,c.labourForce],[r.participation,c.labourForce,c.population],[r.employment,c.employment,c.population]])assert.ok(Math.abs(100*numerator/denominator-rate)<.051);
 assert.ok(Math.abs(100*c.unemployment/c.population-r.unemployment)>2);
});
test('the population donut carries a population label and description rather than asset language',()=>{
 const r=planningResult('labourBudget'),html=renderResult(r,300);
 assert.equal(r.charts[0].type,'donut');assert.equal(r.charts[0].centerLabel,'LFS population');assert.match(html,/LFS population/);assert.match(html,/34569.4/);assert.doesNotMatch(html,/listed gross assets/);
 const defaultDonut=renderResult({metrics:[],charts:[{id:'default-asset-label',type:'donut',title:'Assets',unit:'money',rows:[{label:'Cash',value:100}]}]},300);assert.match(defaultDonut,/Total listed assets/);assert.match(defaultDonut,/listed gross assets/);
});
test('cash inputs cannot change either observed statistical chart or the published rate',()=>{
 const d=defaults('labourBudget'),base=planningResult('labourBudget'),edited=planningResult('labourBudget',{...d,reserve:0,essentials:5000,continuing:2000});
 assert.deepEqual(edited.charts[0],base.charts[0]);assert.deepEqual(edited.charts[1],base.charts[1]);assert.deepEqual(edited.metrics[0],base.metrics[0]);assert.equal(base.metrics[0][3],'6.8%');
});
test('the hypothetical twelve-month funding path follows the cash gap rather than a population probability',()=>{
 const d=defaults('labourBudget'),p=labourFunding(d);
 assert.equal(p.monthly,-2000);assert.equal(p.rows[6].value,0);assert.equal(p.rows[7].value,-2000);assert.equal(p.end,-12000);assert.equal(p.extra,12000);
 const surplus=labourFunding({...d,continuing:4000});assert.equal(surplus.end,24000);assert.equal(surplus.extra,0);
 for(const row of p.rows)assert.equal(row.value,d.reserve+row.x*(d.continuing-d.essentials));
});
test('the sensitivity grid independently calculates the initial funding still missing over twelve months',()=>{
 const d=defaults('labourBudget'),r=planningResult('labourBudget');
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const required=12*Math.max(0,[2000,3000,4000,5000][row]-[0,1000,2000,3000][col]);
  assert.equal(r.charts[3].rows[row].values[col],Math.max(0,required-d.reserve));
 }
 assert.match(r.note,/not actual overdraft balances/);
});
test('every input boundary renders four finite chart/table pairs with unchanged statistical observations',()=>{
 const d=defaults('labourBudget'),fields=definitions.labourBudget.fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const result=planningResult('labourBudget',input);assert.equal(result.charts.length,4);
  for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
