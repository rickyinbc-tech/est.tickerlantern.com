import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {incomeCashBudget,discountYieldPlan,balloonFunding} from '../src/planning-rate-benchmarks-models.js';
import {rateBenchmarkGuides} from '../src/planning-rate-benchmarks-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {income2024} from '../src/planning-rate-benchmarks-data.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('income cash ledger reconciles resources, consumption and saving as distinct allocations',()=>{
  const d=defaults('incomeBenchmark'),p=incomeCashBudget(d);near(p.resources,72000);near(p.spending,61800);near(p.unassigned,4200);near(p.gap,0);
  near(p.resources,p.spending+d.annualGoal+p.unassigned);
  near(incomeCashBudget({...d,variableMonthly:d.variableMonthly+400}).unassigned,-600);
  near(incomeCashBudget({...d,monthlyCash:d.monthlyCash+100}).unassigned,p.unassigned+1200);
  near(incomeCashBudget({...d,otherAnnual:500}).resources,p.resources+500);
});
test('official income estimates retain source units and remain independent of budget controls',()=>{
  const d=defaults('incomeBenchmark'),before=planningResult('incomeBenchmark',d),after=planningResult('incomeBenchmark',{...d,monthlyCash:1000,variableMonthly:5000,annualGoal:50000});
  assert.deepEqual(before.charts.slice(0,2),after.charts.slice(0,2));assert.notDeepEqual(before.charts[2],after.charts[2]);
  assert.equal(income2024.year,2024);assert.equal(income2024.unit,'2024 constant dollars');
  const rows=[...income2024.units,...income2024.ageGroups];assert.equal(rows.length,7);assert.equal(new Set(rows.map(r=>r.vector)).size,7);assert.ok(rows.every(r=>r.quality==='A'));
  assert.deepEqual(income2024.units.map(r=>r.value),[108900,75500,41000]);
  for(const chart of before.charts.slice(0,2)){assert.ok(chart.source.includes('pid=1110019001'));assert.ok(chart.note.includes('confidence intervals unavailable'));assert.equal(chart.tableUnit,'2024 constant CAD');}
});
test('discount holding returns and annualisations retain their own denominator and time basis',()=>{
  const d=defaults('discountYield'),p=discountYieldPlan(d);near(p.price,9890);near(p.profit,110);near(p.periodReturn,110/9890);
  near(p.simpleAnnual,110/9890*365/180);near(p.faceAnnual,110/10000*365/180);
  near((1+p.effectiveAnnual)**(180/365),10000/9890);near(p.accountEnd,9890*1.03**(180/365));
  for(const days of [30,90,180,365])for(const pricePct of [90,98.9,100]){
    const q=discountYieldPlan({...d,days,pricePct});near((1+q.effectiveAnnual)**(days/365),d.face/q.price);near(q.simpleAnnual*q.price/d.face,q.faceAnnual);
    if(pricePct===100){near(q.profit,0);near(q.simpleAnnual,0);near(q.effectiveAnnual,0);}
    if(days===365){near(q.effectiveAnnual,q.periodReturn);near(q.simpleAnnual,q.periodReturn);}
  }
  const scaled=discountYieldPlan({...d,face:50000});near(scaled.profit,p.profit*5);near(scaled.effectiveAnnual,p.effectiveAnnual);
});
test('balloon payment formula has the same present value as independently discounted loan cash flows',()=>{
  const d=defaults('balloonPlan');
  for(const apr of [0,7,20])for(const balloonMonths of [12,48,84])for(const balloonShare of [0,40,80]){
    const input={...d,apr,balloonMonths,balloonShare},p=balloonFunding(input),r=apr/1200;
    let value=p.balloon/(1+r)**balloonMonths,ordinaryPV=0;
    for(let m=1;m<=balloonMonths;m++){value+=p.regular/(1+r)**m;ordinaryPV+=p.ordinary/(1+r)**m;}
    near(value,d.loan);near(ordinaryPV,d.loan);
    near(p.interestBalloon,p.regular*balloonMonths+p.balloon-d.loan);near(p.interestFull,p.ordinary*balloonMonths-d.loan);
    near(p.rows.at(-1).full,0);near(p.rows.at(-1).partial,p.balloon);
  }
  const p=balloonFunding(d);near(p.regular,417.5270032699771);near(p.ordinary,598.6561165610726);near(p.shortfall,2844.0304946747447);
});
test('balloon fund agrees with an annuity accumulation and required saving rounds safely upward',()=>{
  const d=defaults('balloonPlan');
  for(const fundRate of [0,2,8])for(const fundCash of [0,2000,20000]){
    const input={...d,fundRate,fundCash},p=balloonFunding(input),q=(1+fundRate/100)**(1/12)-1,n=d.balloonMonths;
    const factor=(1+q)**n,annuity=q===0?n:(factor-1)/q;
    near(p.fund,fundCash*factor+d.fundMonthly*annuity);
    const needed=Math.max(0,(p.balloon-fundCash*factor)/annuity);
    assert.ok(p.requiredMonthly+1e-8>=needed);assert.ok(p.requiredMonthly-needed<.01000001);
    const funded=balloonFunding({...input,fundMonthly:p.requiredMonthly});assert.ok(funded.fund+1e-6>=funded.balloon);
  }
  const zero=balloonFunding({...d,apr:0,fundRate:0,fundCash:0});near(zero.regular+zero.balloon/d.balloonMonths,zero.ordinary);
  const noBalloon=balloonFunding({...d,balloonShare:0});near(noBalloon.regular,noBalloon.ordinary);near(noBalloon.requiredMonthly,0);near(noBalloon.shortfall,0);
});
test('new guides retain substantial prose and complete accessible figures at input boundaries',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const g of rateBenchmarkGuides){
    assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800,g.slug);assert.ok(g.related.every(s=>slugs.has(s)));
    const d=defaults(g.planning),fields=definitions[g.planning].fields;
    const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
  assert.equal(validInputs('discountYield',{...defaults('discountYield'),days:30.5}),false);
  assert.equal(validInputs('balloonPlan',{...defaults('balloonPlan'),balloonMonths:12.5}),false);
});
