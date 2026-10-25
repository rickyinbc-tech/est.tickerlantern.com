import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { energyUpgradePlan, leaseBuyComparison, survivorCashPlan } from '../src/planning-home-car-survivor-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('energy cash and present value agree with independent geometric-sum and growing-annuity formulas',()=>{
  const input=defaults('energyUpgrade'),p=energyUpgradePlan(input),n=15,g=.02,r=.04;
  const energy=1200*((1+g)**n-1)/g,pvEnergy=1200/(r-g)*(1-((1+g)/(1+r))**n),pvMaintenance=100*(1-(1+r)**-n)/r;
  near(p.cash,-10000+energy-100*n);near(p.pv,-10000+pvEnergy-pvMaintenance);near(p.pvEnergy,pvEnergy);near(p.pvMaintenance,pvMaintenance);
  near(p.cash,9252.100299447777);near(p.pv,4049.3864409578027);near(p.firstNet,1100);
});
test('energy payback uses full annual endpoints and differs from discounted recovery',()=>{
  const p=energyUpgradePlan(defaults('energyUpgrade'));assert.equal(p.recovered,9);assert.equal(p.discountedRecovered,11);
  assert.ok(p.rows[8].cash<0&&p.rows[9].cash>=0);assert.ok(p.rows[10].pv<0&&p.rows[11].pv>=0);
  const exact=energyUpgradePlan({...defaults('energyUpgrade'),cost:10000,saving:1000,maintenance:0,growth:0,discount:0,years:10});near(exact.cash,0);near(exact.pv,0);assert.equal(exact.recovered,10);
  const short=energyUpgradePlan({...defaults('energyUpgrade'),cost:10000,saving:1000,maintenance:0,growth:0,discount:0,years:9});assert.equal(short.recovered,null);
});
test('energy cost and maintenance enter once while zero discount preserves undiscounted cash',()=>{
  const input=defaults('energyUpgrade'),p=energyUpgradePlan({...input,discount:0});near(p.pv,p.cash);
  const result=planningResult('energyUpgrade');near(result.charts[0].rows.reduce((s,r)=>s+r.value,0),1100);near(result.charts[2].rows.reduce((s,r)=>s+r.value,0),energyUpgradePlan(input).pv);
  const noSaving=energyUpgradePlan(input,0);assert.equal(noSaving.recovered,null);assert.ok(noSaving.pv< -input.cost);
  const noCost=energyUpgradePlan({...input,cost:0,saving:0});assert.equal(noCost.recovered,0);assert.ok(noCost.pv<0);
});
test('buy-and-sell loan figures agree with independent fixed-payment closed forms',()=>{
  const input=defaults('carLease'),p=leaseBuyComparison(input),r=.06/12,n=60,h=48,principal=37000;
  const payment=principal*r*(1+r)**n/((1+r)**n-1),debt=principal*(1+r)**h-payment*((1+r)**h-1)/r;
  near(p.financed,principal);near(p.payment,payment);near(p.debt,debt);near(p.paid,h*payment);near(p.interest,p.paid-(principal-debt));
  near(p.debt,8311.18078237171);near(p.buyCost,28046.23629863572);near(p.leaseCost,28900);near(p.difference,853.7637013642816);
});
test('terminal purchase cash includes the loan payoff exactly once and both cost waterfalls reconcile',()=>{
  const input=defaults('carLease'),p=leaseBuyComparison(input),result=planningResult('carLease');
  near(p.down+p.paid+p.debt,input.price+p.interest);near(p.buyCost,input.price+p.interest+input.months*input.buyExtra-input.resale);
  near(p.leaseCost,input.leaseUpfront+input.months*(input.leasePayment+input.leaseExtra)+input.leaseEnd);
  near(result.charts[1].rows.reduce((s,r)=>s+r.value,0),p.buyCost);near(result.charts[2].rows.reduce((s,r)=>s+r.value,0),p.leaseCost);
  near(p.rows.at(-1).buy,p.buyCost);near(p.rows.at(-1).lease,p.leaseCost);
  near(p.rows.at(-1).buy-p.rows.at(-2).buy,p.payment+input.buyExtra+p.debt-input.resale);
});
test('a shorter purchase loan stops payments while a capped down payment leaves no financed balance',()=>{
  const input=defaults('carLease'),short=leaseBuyComparison({...input,loanMonths:12});near(short.debt,0);near(short.rows[12].debt,0);
  near(short.rows[13].buy-short.rows[12].buy,input.buyExtra);near(short.paid,short.financed+short.interest);
  const cash=leaseBuyComparison({...input,down:50000});near(cash.down,42000);near(cash.financed,0);near(cash.payment,0);near(cash.buyCost,22400);
});
test('zero-rate and negative-equity car scenarios preserve actual closing cash requirements',()=>{
  const input=defaults('carLease'),free=leaseBuyComparison({...input,rate:0});near(free.interest,0);near(free.payment,37000/60);near(free.debt,7400);near(free.buyCost,22400);
  const lowSale=leaseBuyComparison({...input,resale:0});assert.ok(lowSale.terminalEquity<0);near(lowSale.buyCost,input.price+lowSale.interest+input.buyExtra*input.months);
  near(lowSale.buyCost-leaseBuyComparison(input).buyCost,input.resale);
});
test('survivor cash needs include transition costs and bills before the first full income receipt',()=>{
  const input=defaults('survivorCash'),p=survivorCashPlan(input);near(p.beforeSurplus,1000);near(p.ongoing,500);near(p.delayed,1500);
  near(p.rows[0].end,2000);near(p.rows[1].before,-1800);near(p.rows[1].end,1000);near(p.rows[2].end,0);near(p.rows[3].end,-1000);near(p.rows[4].before,-4800);near(p.rows[4].end,-500);
  near(p.required,14800);near(p.extra,4800);near(p.ending,9500);
  near(p.ending,input.cash-input.transition+input.months*p.ongoing-p.delayed*Math.min(input.delay,input.months));
});
test('receipt-gap stress changes required cash without pretending that later income paid an earlier bill',()=>{
  const input=defaults('survivorCash'),plans=[0,1,3,6,12].map(delay=>survivorCashPlan({...input,delay}));assert.deepEqual(plans.map(p=>p.required),[11800,12800,14800,17800,23800]);
  for(const delay of [0,1,3,6,12]){const p=survivorCashPlan({...input,delay}),funded=survivorCashPlan({...input,delay,cash:p.required});assert.ok(funded.rows.every(r=>r.before>=0&&r.end>=0));}
});
test('survivor income is independently entered and the unreceived portion is capped without inventing arrears',()=>{
  const input=defaults('survivorCash'),p=survivorCashPlan(input),differentBefore=survivorCashPlan({...input,beforeIncome:20000,beforeCosts:0});
  assert.deepEqual(p.rows,differentBefore.rows);near(p.required,differentBefore.required);near(p.ongoing,differentBefore.ongoing);
  const capped=survivorCashPlan({...input,afterIncome:1000,delayedPart:10000});near(capped.delayed,1000);assert.ok(capped.rows.every(r=>r.income>=0));
  near(p.rows.reduce((s,r)=>s+r.income,0),input.afterIncome*input.months-1500*3);assert.ok(p.rows.slice(4).every(r=>r.income===4300));
});
test('project years, car periods and survivor receipt gaps require whole calendar periods',()=>{
  for(const [kind,key,value] of [['energyUpgrade','years',15.5],['carLease','loanMonths',60.5],['carLease','months',48.5],['survivorCash','delay',3.5],['survivorCash','months',24.5]])assert.equal(validInputs(kind,{...defaults(kind),[key]:value}),false);
});
test('energy, car and survivor models render finite accessible graphics at supported field edges',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['energyUpgrade','carLease','survivorCash']){
    const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input),count=kind==='carLease'?5:4;finite(result);assert.equal(result.charts.length,count);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,count);assert.equal((html.match(/<caption>/g)||[]).length,count);}}
  }
});
