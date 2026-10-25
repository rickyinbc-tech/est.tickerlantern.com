import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {investmentBorrowingPlan} from '../src/planning-investment-borrowing-models.js';
import {investmentBorrowingGuides} from '../src/planning-investment-borrowing-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
test('matched-cash investment borrowing agrees with independent lump-sum and deposit accumulation',()=>{
 const d=defaults('investmentLoan');
 for(const investmentReturn of [-15,0,5,15])for(const borrowingRate of [0,7,15])for(const years of [1,10,20]){
  const p=investmentBorrowingPlan({...d,investmentReturn,borrowingRate,years}),q=(1+investmentReturn/100)**(1/12)-1,n=years*12;
  const factor=(1+investmentReturn/100)**years,annuity=q===0?n:(factor-1)/q;
  near(p.borrowedAsset,d.loan*factor+d.surplusMonthly*annuity);near(p.plainAsset,p.budget*annuity);
  near(p.borrowedNet,p.borrowedAsset-d.loan);near(p.difference,d.loan*annuity*(q-borrowingRate/1200));
  near(p.interestTotal+p.borrowedContributions,p.plainContributions);near(p.plainContributions,p.budget*n);
 }
 const p=investmentBorrowingPlan(d);near(p.interestTotal,35000);near(p.borrowedNet,46881.04746901918);near(p.plainAsset,60458.904843074364);near(p.difference,-13577.857374055187);
});
test('rate equivalence, zero borrowing and common extra saving isolate the source of endpoint differences',()=>{
 const d=defaults('investmentLoan'),p=investmentBorrowingPlan(d);
 near(investmentBorrowingPlan({...d,investmentReturn:p.equivalentAnnual*100}).difference,0);
 const extra=investmentBorrowingPlan({...d,surplusMonthly:1000});near(extra.difference,p.difference);
 const none=investmentBorrowingPlan({...d,loan:0});near(none.difference,0);near(none.interestTotal,0);
 const flat=investmentBorrowingPlan({...d,investmentReturn:0});near(flat.difference,-flat.interestTotal);
 const loss=investmentBorrowingPlan({...d,investmentReturn:-15,surplusMonthly:0});assert.ok(loss.borrowedNet<0);assert.ok(loss.difference<0);
});
test('principal and monthly interest are reconciled once in their respective asset and household cash ledgers',()=>{
 const d=defaults('investmentLoan'),p=investmentBorrowingPlan(d),result=planningResult('investmentLoan');
 near(p.borrowedAsset,d.loan+p.borrowedContributions+p.borrowedGain);near(p.plainAsset,p.plainContributions+p.plainGain);
 const bridge=result.charts.find(c=>c.type==='waterfall');near(bridge.rows.reduce((s,r)=>s+r.value,0),p.borrowedNet);
 const budget=result.charts.find(c=>c.type==='stackbar');near(budget.rows[0].values.reduce((a,b)=>a+b),budget.rows[1].values.reduce((a,b)=>a+b));
 assert.equal(p.rows[0].borrowedNet,0);assert.equal(p.rows[0].plainAsset,0);
});
test('investment-borrowing guide keeps substantial prose and accessible signed results at input boundaries',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of investmentBorrowingGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
 assert.equal(validInputs('investmentLoan',{...defaults('investmentLoan'),years:1.5}),false);
});
