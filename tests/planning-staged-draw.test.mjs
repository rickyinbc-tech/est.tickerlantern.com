import test from 'node:test';
import assert from 'node:assert/strict';
import {stagedDrawLedger} from '../src/planning-staged-draw-models.js';
import {stagedDrawGuides} from '../src/planning-staged-draw-guides.js';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);

test('staged interest agrees with each independent tranche outstanding for its remaining monthly periods',()=>{
 const d=defaults('stagedDraw'),p=stagedDrawLedger(d);
 assert.deepEqual(p.billMonths,[3,6,9]);near(p.fullInterest,60000*.08);
 near(p.stagedInterest,20000*.08*(10+7+4)/12);near(p.cashInterest,(60000*2+40000*3+20000*3)*.02/12);
 assert.equal(p.fullFees,50);assert.equal(p.stagedFees,150);near(p.fullCost,4350);near(p.stagedCost,2950);near(p.gap,-1400);
});
test('project payments reduce borrowed cash without reducing the debt owed to the lender',()=>{
 const d=defaults('stagedDraw'),p=stagedDrawLedger(d);
 for(const r of p.rows){near(r.projectCash+r.paid,60000);near(r.stagedDebt+r.stagedUnused,60000);near(r.fullDebt,60000);near(r.stagedDebt,r.paid);assert.ok(r.projectCash>=0);}
 near(p.rows[0].projectCash,60000);near(p.rows[0].stagedDebt,0);near(p.rows[3].projectCash,40000);near(p.rows[6].stagedDebt,40000);
 near(p.rows[12].paid,60000);near(p.rows[12].projectCash,0);near(p.rows[12].fullDebt,60000);near(p.rows[12].stagedDebt,60000);
});
test('cash-interest offset and extra draw fees reconcile through an independent balance-month identity',()=>{
 const d=defaults('stagedDraw');
 for(const spacing of [1,2,3,4])for(const loanRate of [0,4,8,18])for(const cashRate of [0,2,8]){
  const p=stagedDrawLedger({...d,drawSpacing:spacing,borrowingRate:loanRate,parkingRate:cashRate});
  const unusedBalanceMonths=60000*(2*spacing-1);
  near(p.gap,-unusedBalanceMonths*(loanRate-cashRate)/1200+2*d.drawFee);
 }
 const result=planningResult('stagedDraw',d);near(result.charts[2].rows.reduce((s,r)=>s+r.value,0),-1400);
});
test('zero project, zero rates and non-divisible bill amounts retain distinct fee and principal boundaries',()=>{
 const d=defaults('stagedDraw'),zero=stagedDrawLedger({...d,projectBudget:0});
 for(const key of ['fullInterest','stagedInterest','cashInterest','fullFees','stagedFees','fullCost','stagedCost','gap'])assert.equal(zero[key],0);
 const noRates=stagedDrawLedger({...d,borrowingRate:0,parkingRate:0});assert.equal(noRates.fullCost,50);assert.equal(noRates.stagedCost,150);assert.equal(noRates.gap,100);
 const thirds=stagedDrawLedger({...d,projectBudget:100000,drawSpacing:4});assert.equal(thirds.rows[12].projectCash,0);assert.equal(thirds.rows[12].stagedDebt,100000);assert.equal(thirds.rows[12].paid,100000);
 assert.equal(validInputs('stagedDraw',{...d,drawSpacing:2.5}),false);
});
test('staged-draw prose preserves the monthly simplification, separate interest funding and principal obligation',()=>{
 const g=stagedDrawGuides[0],prose=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,6);assert.ok(prose.replace(/<[^>]*>/g,' ').split(/\s+/).length>=900);
 assert.match(prose,/same principal owed/);assert.match(prose,/paid from separate household cash/);assert.match(prose,/uniform monthly convention/);
 for(const slug of g.related)assert.ok(planningGuides.some(x=>x.slug===slug),slug);
});
test('staged draw boundaries render accessible finite tables and signed differences',()=>{
 const kind='stagedDraw',d=defaults(kind),fields=definitions[kind].fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs)for(const width of [300,760]){
  const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);
 }
});
