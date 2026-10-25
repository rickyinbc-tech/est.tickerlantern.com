import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {homeownershipCashPlan} from '../src/planning-homeownership-age-models.js';
import {homeownershipAgeSource} from '../src/planning-homeownership-age-data.js';
import {homeownershipAgeGuides} from '../src/planning-homeownership-age-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('retained household rates preserve source vintage and do not respond to personal cash controls',()=>{
 const s=homeownershipAgeSource;assert.deepEqual(s.years,[2011,2016,2021]);assert.equal(s.releaseDate,'2022-09-21');
 assert.deepEqual(s.rows.map(r=>r.values),[[44.1,39.6,36.5],[59.2,55,52.3],[67.1,63.5,61.5],[71,69,66.8]]);
 assert.equal(s.csvSHA256,'c3ec9d4628ec156162fbc33eeb916bc01d3e016ab1aebfe62d4119da90870a17');
 const a=planningResult('ownershipContext'),b=planningResult('ownershipContext',{...defaults('ownershipContext'),homeOpeningCash:0,homeMonthlyCash:100,homeCashMonths:1});
 assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));near(a.charts[1].rows[0].value,-.076);
 assert.equal(a.charts[1].unit,'pp');assert.ok(a.charts[0].source);assert.ok(!a.charts[2].source);
});
test('a monthly cash ledger independently identifies the first funded date and retains truncated gaps',()=>{
 const d=defaults('ownershipContext'),p=homeownershipCashPlan(d);near(p.target,105000);near(p.gap,60000);assert.equal(p.firstMonth,50);assert.equal(p.withinWindow,true);near(p.end,117000);
 for(const homeOpeningCash of [0,45000,104000,105000,500000])for(const homeMonthlyCash of [100,1200,10000]){
  const q=homeownershipCashPlan({...d,homeOpeningCash,homeMonthlyCash});let cash=homeOpeningCash,month=0;
  while(cash<105000){cash+=homeMonthlyCash;month++;assert.ok(month<1100);}
  assert.equal(q.firstMonth,month);assert.ok(cash>=q.target);if(month)assert.ok(cash-homeMonthlyCash<q.target);
 }
 const short=homeownershipCashPlan({...d,homeCashMonths:49});assert.equal(short.withinWindow,false);near(short.finishGap,1200);
 const metric=planningResult('ownershipContext',{...d,homeCashMonths:49}).metrics[2];assert.equal(metric[1],null);assert.match(metric[3],/Not reached within 49/);
 const funded=homeownershipCashPlan({...d,homeOpeningCash:105000});assert.equal(funded.firstMonth,0);near(funded.gap,0);
});
test('homeownership guide has substantial English prose, resolvable links and finite accessible source and scenario figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of homeownershipAgeGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
 assert.equal(validInputs('ownershipContext',{...defaults('ownershipContext'),homeCashMonths:1.5}),false);
});
