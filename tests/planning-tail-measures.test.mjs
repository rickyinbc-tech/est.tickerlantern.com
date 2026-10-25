import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {tailMeasurePlan} from '../src/planning-tail-measures-models.js';
import {tailMeasureGuides} from '../src/planning-tail-measures-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('an independent equiprobable finite-state universe verifies quantiles and exact worst-tail averages',()=>{
 for(const tailCapital of [1000,100000])for(const tailLossScale of [50,100,150])for(const tailConfidence of [80,85,90,95,95.5,99]){
  const input={tailCapital,tailLossScale,tailConfidence},p=tailMeasurePlan(input),s=tailLossScale/100;
  const universe=[...Array(100).fill(tailCapital*.4*s),...Array(400).fill(tailCapital*.2*s),...Array(1500).fill(tailCapital*.05*s),...Array(4000).fill(-tailCapital*.05),...Array(4000).fill(-tailCapital*.12)].sort((a,b)=>a-b);
  const index=Math.ceil(tailConfidence*100)-1,tailCount=(100-tailConfidence)*100,tail=universe.slice(10000-tailCount);
  near(p.valueAtRisk,universe[index]);near(p.expectedShortfall,tail.reduce((a,b)=>a+b,0)/tail.length);near(p.maxLoss,universe.at(-1));
  near(p.slices.reduce((sum,r)=>sum+r.massTaken,0),100-tailConfidence);near(p.slices.reduce((sum,r)=>sum+r.tailWeight,0),1);
  assert.ok(p.slices.every(r=>r.massTaken>0&&r.massTaken<=r.massPercent));assert.ok(p.expectedShortfall>=p.valueAtRisk-1e-8&&p.expectedShortfall<=p.maxLoss+1e-8);
 }
});
test('boundary masses distinguish VaR, strict exceedance averages and the selected ES tail',()=>{
 const d=defaults('tailMeasures'),p=tailMeasurePlan(d);near(p.valueAtRisk,5000);near(p.expectedShortfall,24000);near(p.maxLoss,40000);assert.equal(p.strictBeyondPercent,5);
 const ninety=tailMeasurePlan({...d,tailConfidence:90});near(ninety.valueAtRisk,5000);near(ninety.expectedShortfall,14500);assert.deepEqual(ninety.slices.map(r=>r.massTaken),[1,4,5]);assert.equal(ninety.strictBeyondPercent,5);
 const eighty=tailMeasurePlan({...d,tailConfidence:80});near(eighty.valueAtRisk,-5000);near(eighty.expectedShortfall,9750);
 const jump=tailMeasurePlan({...d,tailConfidence:95.5});near(jump.valueAtRisk,20000);near(jump.expectedShortfall,24444.444444444445);
 const ninetyNine=tailMeasurePlan({...d,tailConfidence:99});near(ninetyNine.valueAtRisk,20000);near(ninetyNine.expectedShortfall,40000);
 const twice=tailMeasurePlan({...d,tailCapital:d.tailCapital*2});near(twice.valueAtRisk,p.valueAtRisk*2);near(twice.expectedShortfall,p.expectedShortfall*2);
 assert.deepEqual(twice.outcomes.map(r=>r.massPercent),p.outcomes.map(r=>r.massPercent));
 near(tailMeasurePlan({...d,tailConfidence:80,tailLossScale:150}).valueAtRisk,-5000);
});
test('tail-measure guide preserves full assumptions, substantial prose, valid links and four finite accessible figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of tailMeasureGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   near(result.charts.find(c=>c.type==='bar').rows.reduce((s,r)=>s+r.value,0),1);near(result.charts.find(c=>c.type==='waterfall').rows.reduce((s,r)=>s+r.value,0),tailMeasurePlan(input).expectedShortfall);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
 assert.equal(validInputs('tailMeasures',{...defaults('tailMeasures'),tailConfidence:100}),false);assert.equal(validInputs('tailMeasures',{...defaults('tailMeasures'),tailConfidence:95.5}),true);
});
