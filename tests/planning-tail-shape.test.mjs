import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {twoPointReturns,probabilityBelow,tailShapePlan} from '../src/planning-tail-shape-models.js';
import {tailShapeGuides} from '../src/planning-tail-shape-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('complete outcome enumeration verifies population moments over the supported construction',()=>{
 for(const mean of [-5,5,15])for(const sd of [1,15,20])for(const q of [5,10,25,50]){
  const rows=twoPointReturns(mean,sd,q);near(rows.reduce((s,r)=>s+r.probability,0),1);
  const actualMean=rows.reduce((s,r)=>s+r.probability*r.return,0),actualVariance=rows.reduce((s,r)=>s+r.probability*(r.return-actualMean)**2,0);
  near(actualMean,mean/100);near(Math.sqrt(actualVariance),sd/100);
  assert.ok(rows[0].return<rows[1].return);assert.ok(rows.every(r=>r.return>-1&&r.probability>0));
 }
});
test('an independent hundred-state ledger reproduces matching moments and different target failure',()=>{
 const d=defaults('tailShape'),p=tailShapePlan(d),equal=Array(50).fill(-.1).concat(Array(50).fill(.2)),unequal=Array(10).fill(-.4).concat(Array(90).fill(.1));
 for(const [returns,rows] of [[equal,p.equal],[unequal,p.unequal]]){
  const mean=returns.reduce((s,x)=>s+x,0)/100,sd=Math.sqrt(returns.reduce((s,x)=>s+(x-mean)**2,0)/100);
  near(mean,.05);near(sd,.15);near(rows[0].return,Math.min(...returns));near(rows[1].return,Math.max(...returns));
  for(const goal of [-.2,0,.1,.15,.2])near(probabilityBelow(rows,goal),returns.filter(x=>x<goal).length/100);
 }
 near(p.expected,105000);near(p.equalBelow,.5);near(p.unequalBelow,.1);
 const higher=tailShapePlan({...d,goalReturn:15});near(higher.equalBelow,.5);near(higher.unequalBelow,1);
 near(probabilityBelow(p.unequal,.1),.1);near(probabilityBelow(p.unequal,.11),1);
 assert.deepEqual(twoPointReturns(5,15,50),p.equal);
});
test('tail-shape figures keep cumulative probabilities ordered and all endpoints finite and accessible',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of tailShapeGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const s of result.charts.find(c=>c.type==='line').series){assert.equal(s.rows[0].value,0);assert.equal(s.rows.at(-1).value,1);s.rows.forEach((r,i)=>{assert.ok(r.value>=0&&r.value<=1);if(i)assert.ok(r.x>=s.rows[i-1].x&&r.value>=s.rows[i-1].value);});}
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
 assert.equal(validInputs('tailShape',{...defaults('tailShape'),lowerChance:0}),false);
});
