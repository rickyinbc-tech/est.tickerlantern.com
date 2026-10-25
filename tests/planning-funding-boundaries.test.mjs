import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,validInputs,planningResult } from '../src/planning-models.js';
import { movingGoalPath,earmarkCalendar,borrowedCapitalLedger } from '../src/planning-funding-boundaries-models.js';
import { fundingBoundaryGuides } from '../src/planning-funding-boundaries-guides.js';
import { planningGuides } from '../src/planning-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('a moving goal is priced at the same future date as the independently compounded saving account',()=>{
 const d=defaults('risingGoal'),p=movingGoalPath(d),r=1.03**(1/12)-1;
 near(p.target,50000*1.05**8);near(p.balance,10000*1.03**8+500*((1+r)**96-1)/r);
 near(p.balance,66751.41955046097);near(p.gap,7121.35263899219);near(p.contributions,58000);
 near(p.balance-p.contributions,p.growth);near(p.rows[1].balance,10000*(1+r)+500);
});
test('required transfers close the full repriced goal, with explicit zero-return and already-funded boundaries',()=>{
 const d=defaults('risingGoal'),p=movingGoalPath(d);near(p.required,565.8363811267963);
 near(movingGoalPath({...d,monthly:p.required}).gap,0);
 const zero=movingGoalPath({...d,rate:0});near(zero.required,(50000*1.05**8-10000)/96);
 near(movingGoalPath({...d,initial:1000000}).required,0);near(movingGoalPath({...d,goal:0}).required,0);
 const a=movingGoalPath({...d,initial:0,rate:0,goalGrowth:12,years:10}),b=movingGoalPath({...d,initial:0,rate:0,goalGrowth:12,years:20});assert.ok(b.required>a.required);
});
test('earmarks are assigned once and their combined opening shortfall is distinct from a bank payment',()=>{
 const d=defaults('earmarkedCash'),p=earmarkCalendar(d);
 assert.deepEqual(p.claims,[12000,9000,14000]);assert.deepEqual(p.allocated,[12000,9000,9000]);near(p.total,35000);near(p.overcommitted,5000);near(p.unassigned,0);
 near(p.allocated.reduce((s,v)=>s+v,0)+p.unassigned,d.cash);near(p.rows[0].cash,30000);
 const full=earmarkCalendar({...d,cash:40000});near(full.overcommitted,0);near(full.unassigned,5000);assert.deepEqual(full.allocated,full.claims);
});
test('the protected floor is tested at every bill date rather than only at year-end',()=>{
 const d=defaults('earmarkedCash'),p=earmarkCalendar(d);near(p.rows[4].cash,23000);near(p.rows[8].cash,11000);near(p.ending,13000);near(p.extra,1000);
 near(p.ending,d.cash+12*d.monthly-d.taxBill-d.trip);
 const funded=earmarkCalendar({...d,cash:d.cash+p.extra});assert.ok(funded.rows.every(r=>r.cash>=d.reserve));
 const same=earmarkCalendar({...d,tripDue:4});near(same.lowest,9000);near(same.extra,3000);near(same.ending,p.ending);
 const none=earmarkCalendar({...d,taxBill:0,trip:0,cash:0,monthly:0});near(none.extra,12000);near(none.ending,0);
});
test('borrowed investments repay the original principal and separately count all outside interest',()=>{
 const d=defaults('borrowedCapital'),p=borrowedCapitalLedger(d);
 near(p.invested,50000);near(p.asset,40000);near(p.equity,10000);near(p.monthlyInterest,200);near(p.interest,7200);near(p.result,-17200);
 near(p.asset-d.loan,p.equity);near(p.equity-d.own-p.interest,p.result);
 near(p.noLoanResources,23200);near(p.difference,-13200);near(p.difference,d.loan*d.assetChange/100-p.interest);
});
test('common resources, cumulative asset moves and break-even borrowing are not confused with annual returns',()=>{
 const d=defaults('borrowedCapital'),positive=borrowedCapitalLedger({...d,assetChange:20});near(positive.result,2800);near(positive.difference,-1200);
 near(borrowedCapitalLedger({...d,assetChange:24}).difference,0);
 const shorter=borrowedCapitalLedger({...d,years:1});near(shorter.asset,40000);near(shorter.interest,2400);
 const free=borrowedCapitalLedger({...d,loan:0});near(free.equity,free.noLoanResources);near(free.result,-4000);
 const lost=borrowedCapitalLedger({...d,assetChange:-100});near(lost.asset,0);near(lost.equity,-30000);near(lost.result,-57200);
});
test('new date inputs require whole months and articles retain valid links, full explanations and source scope',()=>{
 for(const key of ['taxDue','tripDue'])assert.equal(validInputs('earmarkedCash',{...defaults('earmarkedCash'),[key]:2.5}),false);
 for(const g of fundingBoundaryGuides){assert.equal(g.sections.length,6);assert.ok(g.sections.map(s=>s.html.replace(/<[^>]+>/g,' ')).join(' ').split(/\s+/).length>=800);assert.ok(g.chartScope);assert.ok(g.sources.every(s=>s.url.startsWith('https://')));for(const related of g.related)assert.ok(planningGuides.some(x=>x.slug===related));}
});
test('every new figure retains finite values, signed gaps and a data table at field boundaries',()=>{
 const finite=x=>{if(typeof x==='number')assert.ok(Number.isFinite(x));else if(Array.isArray(x))x.forEach(finite);else if(x&&typeof x==='object')Object.values(x).forEach(finite);};
 for(const kind of ['risingGoal','earmarkedCash','borrowedCapital']){
  const d=defaults(kind),fields=definitions[kind].fields;
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
});
