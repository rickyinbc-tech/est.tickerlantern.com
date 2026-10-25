import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult,validInputs } from '../src/planning-models.js';
import { carEquityLoan,carTradePlan } from '../src/planning-car-equity-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
const cents=(a,b)=>assert.equal(Math.round(a*100),Math.round(b*100));

test('closing bridge settles the old payout and counts gross trade proceeds once',()=>{
  const input=defaults('carEquity'),p=carTradePlan(input);near(p.tradeEquity,-6000);near(p.oldShortfall,6000);near(p.principal,43000);near(p.cashUsed,5000);near(p.unusedCash,0);near(p.cashReleased,0);
  near(p.principal,input.carPrice+input.carCharges+p.oldShortfall-p.cashUsed);
  near(p.acquisition+input.oldPayout,input.tradeOffer+p.cashUsed+p.principal-p.cashReleased);
  near(planningResult('carEquity').charts[0].rows.reduce((n,r)=>n+r.value,0),p.netFinancing);
});
test('positive trade equity, surplus proceeds and unused cash do not create negative borrowing',()=>{
  const d=defaults('carEquity'),positive=carTradePlan({...d,oldPayout:10000,tradeOffer:20000});near(positive.principal,27000);near(positive.oldShortfall,0);near(positive.shortfallLoan.interest,0);
  const excess=carTradePlan({...d,oldPayout:0,tradeOffer:100000});near(excess.principal,0);near(excess.cashUsed,0);near(excess.cashReleased,58000);near(excess.unusedCash,5000);near(excess.loan.payment,0);
  const funded=carTradePlan({...d,tradeDown:50000});near(funded.cashUsed,48000);near(funded.unusedCash,2000);near(funded.principal,0);near(funded.oldShortfall,6000);near(funded.shortfallFinanced,0);
  const partly=carTradePlan({...d,tradeDown:45000});near(partly.principal,3000);near(partly.shortfallFinanced,3000);near(partly.replacementFinanced,0);
});
test('loan amounts reproduce independently checked decimal examples and reconcile principal plus interest',()=>{
  const expected=[[48,952.10,6700.99],[72,683.80,10233.34],[84,607.86,12060.44]];
  for(const [months,payment,interest] of expected){const loan=carEquityLoan(39000,8,months);cents(loan.payment,payment);cents(loan.interest,interest);near(loan.paid,39000+loan.interest);near(loan.rows.at(-1).debt,0);}
  const p=carTradePlan(defaults('carEquity'));cents(p.loan.payment,733.11);cents(p.loan.interest,9783.72);cents(p.shortfallLoan.payment,102.29);cents(p.shortfallLoan.interest,1365.17);
});
test('longer terms lower the payment but increase interest at the same positive rate and principal',()=>{
  const short=carEquityLoan(43000,7,36),long=carEquityLoan(43000,7,96);assert.ok(long.payment<short.payment);assert.ok(long.interest>short.interest);assert.ok(long.rows[24].debt>short.rows[24].debt);
  const result=planningResult('carEquity');for(const row of result.charts[2].rows)near(row.values[0],43000);
});
test('the financed-shortfall attribution uses the new terms and does not imply the shortfall was forgiven',()=>{
  const input=defaults('carEquity'),p=carTradePlan(input),without=carTradePlan({...input,oldPayout:input.tradeOffer});
  near(p.loan.payment-without.loan.payment,p.shortfallLoan.payment);near(p.loan.interest-without.loan.interest,p.shortfallLoan.interest);
  near(p.principal-without.principal,p.shortfallFinanced);
  const zero=carTradePlan({...input,tradeRate:0});near(zero.shortfallLoan.interest,0);near(zero.shortfallLoan.paid,6000);near(zero.loan.payment,43000/72);
  const grid=planningResult('carEquity').charts[4];near(grid.rows[0].values.reduce((n,v)=>n+v,0),0);near(grid.rows[2].values[2],p.shortfallLoan.interest);
});
test('new-car value excludes old debt and charges while the loan balance amortizes separately',()=>{
  const p=carTradePlan(defaults('carEquity'));near(p.rows[0].value,40000);near(p.rows[0].debt,43000);near(p.rows[24].value,28900);cents(p.rows[24].debt,30614.71);cents(p.rows[24].debt-p.rows[24].value,1714.71);
  const higherCharges=carTradePlan({...defaults('carEquity'),carCharges:5000});near(higherCharges.rows[24].value,p.rows[24].value);assert.ok(higherCharges.rows[24].debt>p.rows[24].debt);
});
test('whole loan terms and all supported boundary cases retain five finite accessible figures',()=>{
  const kind='carEquity',d=defaults(kind),fields=definitions[kind].fields;assert.equal(validInputs(kind,{...d,tradeMonths:36.5}),false);
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const input of inputs){const plan=carTradePlan(input),result=planningResult(kind,input);finite(plan);finite(result);near(plan.acquisition+input.oldPayout,input.tradeOffer+plan.cashUsed+plan.principal-plan.cashReleased);assert.ok(plan.principal>=0);assert.ok(plan.cashUsed<=input.tradeDown);assert.ok(plan.shortfallFinanced<=plan.principal);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
});
