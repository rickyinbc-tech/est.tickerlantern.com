import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {annuityGuaranteePlan} from '../src/planning-annuity-guarantee-models.js';
import {annuityGuaranteeGuides} from '../src/planning-annuity-guarantee-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
test('independent payment-count identities verify recipient and contract totals at all event boundaries',()=>{
 const d=defaults('annuityPaymentTerm');
 for(const annuityGuaranteeYears of [1,10,30])for(const annuityDeathYear of [1,7,10,17,60])for(const annuityWindow of [1,8,25,60]){
  const p=annuityGuaranteePlan({...d,annuityGuaranteeYears,annuityDeathYear,annuityWindow}),G=annuityGuaranteeYears,D=annuityDeathYear,Y=annuityWindow,P=d.annuityAnnualCash;
  assert.equal(p.end.lifeAnnuitant,P*Math.min(D,Y));assert.equal(p.end.lifeBeneficiary,P*Math.max(0,Math.min(G,Y)-D));
  assert.equal(p.end.termAnnuitant,P*Math.min(G,D,Y));assert.equal(p.end.termBeneficiary,p.end.lifeBeneficiary);
  assert.equal(p.end.lifeTotal,P*Math.min(Y,Math.max(D,G)));assert.equal(p.end.termTotal,P*Math.min(Y,G));
  assert.equal(p.remainingGuaranteed,P*Math.max(0,G-D));
  assert.equal(p.rows.reduce((s,r)=>s+r.lifePayment,0),p.end.lifeTotal);assert.equal(p.rows.reduce((s,r)=>s+r.termPayment,0),p.end.termTotal);
  p.rows.forEach((r,i)=>{if(i){assert.ok(r.lifeTotal>=p.rows[i-1].lifeTotal);assert.ok(r.termTotal>=p.rows[i-1].termTotal);}});
 }
});
test('later death extends the lifetime schedule, early death redirects instalments and a short window excludes future receipts',()=>{
 const d=defaults('annuityPaymentTerm'),p=annuityGuaranteePlan(d);assert.equal(p.end.lifeTotal,122400);assert.equal(p.end.termTotal,72000);assert.equal(p.remainingGuaranteed,0);
 const early=annuityGuaranteePlan({...d,annuityDeathYear:7});assert.equal(early.end.lifeAnnuitant,50400);assert.equal(early.end.lifeBeneficiary,21600);assert.equal(early.end.lifeTotal,72000);assert.equal(early.end.termTotal,72000);
 const short=annuityGuaranteePlan({...d,annuityDeathYear:7,annuityWindow:8});assert.equal(short.end.lifeTotal,57600);assert.equal(short.end.lifeBeneficiary,7200);assert.equal(short.remainingGuaranteed,21600);
 assert.equal(annuityGuaranteePlan({...d,annuityDeathYear:10}).remainingGuaranteed,0);
 const result=planningResult('annuityPaymentTerm',{...d,annuityDeathYear:7});assert.equal(result.charts.find(c=>c.type==='stackbar').rows[0].values.reduce((s,x)=>s+x,0),72000);
});
test('annuity-payment guide has substantial prose, valid links, full assumptions and four finite accessible figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of annuityGuaranteeGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
 for(const key of ['annuityGuaranteeYears','annuityDeathYear','annuityWindow'])assert.equal(validInputs('annuityPaymentTerm',{...defaults('annuityPaymentTerm'),[key]:1.5}),false);
});
