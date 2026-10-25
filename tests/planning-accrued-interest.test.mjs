import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {accruedGicPlan} from '../src/planning-accrued-interest-models.js';
import {accruedInterestGuides} from '../src/planning-accrued-interest-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
test('locked compound balance and annual tax agree with independent compound-interest identities',()=>{
 const d=defaults('accruedGicCash');
 for(const grossRate of [0,4,8])for(const taxRate of [0,30,55])for(const years of [2,5,10]){
  const p=accruedGicPlan({...d,grossRate,taxRate,years}),maturity=d.principal*(1+grossRate/100)**years,interest=maturity-d.principal;
  near(p.maturity,maturity);near(p.totalInterest,interest);near(p.totalTax,interest*taxRate/100);
  near(p.preMaturityTax,d.principal*((1+grossRate/100)**(years-1)-1)*taxRate/100);
  near(p.endingCash,maturity+d.openingReserve+12*years*d.monthlyReserve-p.totalTax);near(p.rows.at(-1).locked,0);
  for(const a of p.annual)near(a.interest,d.principal*(1+grossRate/100)**(a.year-1)*grossRate/100);
 }
});
test('pre-maturity funding need matches independent annual cash minima and extra opening cash cures the gap',()=>{
 const d=defaults('accruedGicCash');
 for(const openingReserve of [0,2000,50000])for(const monthlyReserve of [0,50,1000]){
  const p=accruedGicPlan({...d,openingReserve,monthlyReserve});
  const candidates=[openingReserve,...Array.from({length:d.years-1},(_,i)=>{const y=i+1;return openingReserve+12*y*monthlyReserve-d.principal*((1+d.grossRate/100)**y-1)*d.taxRate/100;})];
  near(p.gap,Math.max(0,-Math.min(...candidates)));
  const funded=accruedGicPlan({...d,openingReserve:openingReserve+p.gap,monthlyReserve});near(funded.gap,0);assert.ok(funded.rows.slice(0,-1).every(r=>r.cash>=-1e-7));
 }
 const p=accruedGicPlan(d);near(p.gap,695.7568);near(p.preMaturityTax,5095.7568);near(p.totalTax,6499.587072);near(p.endingCash,120165.703168);
 assert.ok(p.endingCash>0);assert.ok(p.minPreMaturityCash<0);assert.equal(p.rows.find(r=>r.cash===p.minPreMaturityCash).x,48);
});
test('outside reserves and tax assumptions do not reduce gross investment compounding or silently supply cash',()=>{
 const d=defaults('accruedGicCash'),p=accruedGicPlan(d),more=accruedGicPlan({...d,monthlyReserve:100}),noTax=accruedGicPlan({...d,taxRate:0});
 near(p.maturity,more.maturity);near(p.maturity,noTax.maturity);near(more.endingCash-p.endingCash,3000);
 near(noTax.totalTax,0);near(noTax.gap,0);
 assert.ok(p.rows.slice(0,-1).every(r=>r.locked>=d.principal));near(p.rows.at(-2).locked,d.principal*(1.04)**4);
 const bridge=planningResult('accruedGicCash').charts.find(c=>c.type==='waterfall');near(bridge.rows.reduce((s,r)=>s+r.value,0),p.endingCash);
});
test('accrued-interest guide retains complete scope and accessible figures across supported inputs',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of accruedInterestGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
 assert.equal(validInputs('accruedGicCash',{...defaults('accruedGicCash'),years:2.5}),false);
});
