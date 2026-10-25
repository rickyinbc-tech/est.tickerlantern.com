import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {mortgagePremiumPlan} from '../src/planning-premium-financing-models.js';
import {premiumSchedule} from '../src/planning-premium-financing-data.js';
import {premiumFinancingGuides} from '../src/planning-premium-financing-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
test('mortgage premium uses base principal and correct selected bands at both down-payment thresholds',()=>{
 const d=defaults('mortgagePremium');
 for(const [downPct,rate] of [[5,.04],[9.99,.04],[10,.031],[14.99,.031],[15,.028],[19.99,.028]]){
  const p=mortgagePremiumPlan({...d,downPct});near(p.rate,rate);near(p.premium,(d.price-p.down)*rate);near(p.loan,p.base+p.premium);near(p.base+p.down,d.price);
 }
 const p=mortgagePremiumPlan(d);near(p.down,50000);near(p.premium,13950);near(p.loan,463950);
 assert.deepEqual(premiumSchedule.rows.map(r=>r.value),[.028,.031,.04]);
});
test('financed premium payment and interest reconcile with independently discounted mortgage cash flows',()=>{
 const d=defaults('mortgagePremium');
 for(const apr of [0,5,10])for(const amortYears of [5,25]){
  const p=mortgagePremiumPlan({...d,apr,amortYears});near((1+p.q)**6,1+apr/200);near(p.basePayment+p.premiumPayment,p.payment);
  let present=0;for(let month=1;month<=p.n;month++)present+=p.premiumPayment/(1+p.q)**month;
  near(present,p.premium);near(p.premiumPayment*p.n-p.premium,p.interest);near(p.rows.at(-1).balance,0);
  assert.ok(p.rows.every(r=>r.balance>=0));assert.ok(p.rows.every((r,i,rows)=>!i||r.interest+1e-7>=rows[i-1].interest));
 }
 const p=mortgagePremiumPlan(d);near(p.premiumPayment,81.13389541266366);near(p.interest,10390.168623798992);
});
test('closing tax is cash rather than financed principal and official chart is invariant under scenario changes',()=>{
 const d=defaults('mortgagePremium'),p=mortgagePremiumPlan(d),taxed=mortgagePremiumPlan({...d,premiumTax:8});
 near(p.residual,10000);near(taxed.tax,1116);near(taxed.residual,8884);near(taxed.loan,p.loan);near(taxed.payment,p.payment);
 near(taxed.needed+taxed.residual,d.closingCash);assert.ok(mortgagePremiumPlan({...d,closingCash:0}).residual<0);
 const first=planningResult('mortgagePremium').charts[0],changed=planningResult('mortgagePremium',{...d,price:100000,downPct:19.99,apr:0});assert.deepEqual(changed.charts[0],first);
 assert.equal(first.evidence,'Official premium schedule · selected bands');
});
test('premium guide preserves source scope, detailed prose and four accessible finite figures at input limits',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of premiumFinancingGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
 assert.equal(validInputs('mortgagePremium',{...defaults('mortgagePremium'),amortYears:5.5}),false);
});
