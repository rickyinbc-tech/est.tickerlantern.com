import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {utilityEqualPlan,utilityEqualCharges} from '../src/planning-utility-equal-models.js';
import {utilityEqualGuides} from '../src/planning-utility-equal-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('twelve fictional charges with constant cash installments reproduce the ledger and both payment paths',()=>{
 assert.equal(utilityEqualCharges.length,12);
 const d=defaults('utilityEqualPayment'),p=utilityEqualPlan(d);
 near(p.totalCharge,2000);near(p.totalPaid,1800);near(p.ending,200);
 assert.deepEqual(p.difference,[-60,-120,-160,-160,-120,-30,90,180,250,270,250,200]);
 assert.equal(p.peak,-160);assert.equal(p.peakOwing,270);assert.equal(p.effectiveRefund,0);
 near(p.openDifference,-30);near(p.recomputed,1100/6);near(p.adjusted.at(-1),0);
 const higher=utilityEqualPlan({...d,utilityPayment:175});
 near(higher.totalPaid,2100);near(higher.ending,-100);assert.equal(higher.peakOwing,25);
 assert.deepEqual(higher.difference,[-85,-170,-235,-260,-245,-180,-85,-20,25,20,-25,-100]);
 near(utilityEqualPlan({...d,utilityChargeScale:110}).ending,400);
});

test('a refund is capped at an existing credit and never double counts the same service',()=>{
 const d=defaults('utilityEqualPayment');
 const covered=utilityEqualPlan({...d,utilityPayment:175,utilityRefund:100});
 near(covered.ending,-100);near(covered.effectiveRefund,100);near(covered.afterRefund,0);
 const excess=utilityEqualPlan({...d,utilityPayment:175,utilityRefund:500});
 near(excess.effectiveRefund,100);near(excess.afterRefund,0);
 const owing=utilityEqualPlan({...d,utilityRefund:500});
 near(owing.effectiveRefund,0);near(owing.afterRefund,200);
});

test('recomputed installments clear only the modeled endpoint and remain signed when charges run below cash paid',()=>{
 const d=defaults('utilityEqualPayment');
 for(const utilityAdjustMonth of [2,4,6,9,11])for(const utilityChargeScale of [80,100,130]){
  const p=utilityEqualPlan({...d,utilityAdjustMonth,utilityChargeScale});
  near(p.adjusted.at(-1),0);
  const settled=p.paid.slice(0,p.adjustIndex+1).reduce((a,b)=>a+b,0)+p.recomputed*(p.months-p.adjustIndex-1);
  near(settled,p.totalCharge);
 }
 const credit=utilityEqualPlan({...d,utilityPayment:400,utilityAdjustMonth:11,utilityRefund:400});
 assert.ok(credit.recomputed<0);assert.ok(credit.ending<0);near(credit.effectiveRefund,400);near(credit.afterRefund,credit.ending+400);assert.ok(credit.afterRefund<0);
});

test('the guide keeps the provider limits explicit, links only live companions and renders finite accessible charts',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of utilityEqualGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);
  assert.ok(g.related.every(s=>slugs.has(s)));
  assert.ok(g.sources.every(s=>s.url.startsWith('https://')));
  const d=defaults(g.planning),fields=definitions[g.planning].fields;
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){
   assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,6);assert.ok(result.charts.every(c=>!c.source));
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,6);assert.equal((html.match(/<caption>/g)||[]).length,6);}
  }
 }
 assert.equal(validInputs('utilityEqualPayment',{...defaults('utilityEqualPayment'),utilityAdjustMonth:2.5}),false);
 assert.equal(validInputs('utilityEqualPayment',{...defaults('utilityEqualPayment'),utilityAdjustMonth:12}),false);
});
