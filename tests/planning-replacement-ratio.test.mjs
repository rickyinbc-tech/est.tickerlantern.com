import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {replacementRatioPlan} from '../src/planning-replacement-ratio-models.js';
import {replacementRatioGuides} from '../src/planning-replacement-ratio-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('forward cash ledgers independently reconcile the current budget and retirement gross-up',()=>{
 const d=defaults('replacementRatio');
 for(const replaceGross of [40000,100000,200000])for(const replaceDeductions of [0,25,40])for(const replaceSavings of [0,20])for(const replaceWorkEnds of [0,10])for(const replaceDebtEnds of [0,15])for(const replaceRetireTax of [0,20,40]){
  const input={...d,replaceGross,replaceDeductions,replaceSavings,replaceWorkEnds,replaceDebtEnds,replaceRetireTax},p=replacementRatioPlan(input);let cash=replaceGross;
  for(const fraction of [replaceDeductions,replaceSavings,replaceWorkEnds,replaceDebtEnds])cash-=replaceGross*fraction/100;
  near(p.ongoing,cash);assert.ok(p.ongoing>=replaceGross*.15-1e-8);cash+=input.replaceAdded;near(p.need,cash);
  near(p.targetGross-p.targetGross*replaceRetireTax/100,cash);near(p.targetGross/replaceGross,p.targetRatio);
  let chosen=replaceGross*input.replaceChosen/100;chosen-=chosen*replaceRetireTax/100;near(p.chosenNet,chosen);near(p.excess,chosen-cash);
  const charts=planningResult('replacementRatio',input).charts;near(charts[0].rows.reduce((s,r)=>s+r.value,0),p.ongoing);near(charts[1].rows.reduce((s,r)=>s+r.value,0),p.need);near(charts[2].rows[0].value-charts[2].rows[1].value,charts[2].rows[2].value);
 }
});
test('gross and net denominators stay explicit and continuing debt can turn a cash excess into a gap',()=>{
 const d=defaults('replacementRatio'),p=replacementRatioPlan(d);near(p.ongoing,45000);near(p.need,50000);near(p.targetGross,62500);near(p.targetRatio,.625);near(p.chosenGross,70000);near(p.chosenTax,14000);near(p.chosenNet,56000);near(p.excess,6000);
 assert.notEqual(p.need*1.2*.8,p.need);near(p.targetGross*.8,p.need);
 const continuing=replacementRatioPlan({...d,replaceDebtEnds:0});near(continuing.need,60000);near(continuing.targetGross,75000);near(continuing.excess,-4000);
 const extra=replacementRatioPlan({...d,replaceAdded:20000});near(extra.targetGross,81250);near(extra.excess,-9000);
 const zeroTax=replacementRatioPlan({...d,replaceRetireTax:0});near(zeroTax.targetGross,zeroTax.need);near(zeroTax.chosenNet,zeroTax.chosenGross);
 const scale=replacementRatioPlan({...d,replaceGross:200000,replaceAdded:10000});near(scale.need,p.need*2);near(scale.targetGross,p.targetGross*2);near(scale.targetRatio,p.targetRatio);near(scale.excess,p.excess*2);
 const above=replacementRatioPlan({...d,replaceGross:40000,replaceDeductions:0,replaceSavings:0,replaceWorkEnds:0,replaceDebtEnds:0,replaceAdded:30000,replaceRetireTax:40});assert.ok(above.targetRatio>1);near(above.targetGross*.6,70000);
 const matrix=planningResult('replacementRatio',d).charts[3];near(matrix.rows[1].values[2],.625);near(matrix.rows[0].values[0],.45);
});
test('replacement-ratio guide has detailed English prose, valid related links and four inspectable finite figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of replacementRatioGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
 assert.equal(validInputs('replacementRatio',{...defaults('replacementRatio'),replaceRetireTax:100}),false);
});
