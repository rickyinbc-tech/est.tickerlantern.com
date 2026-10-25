import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult,validInputs } from '../src/planning-models.js';
import { mortgageFrequencyPlan,savingsPromotion,foreignCardCash } from '../src/planning-cash-mechanics-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('mortgage payment conversion preserves the same effective annual rate and stated annual budgets',()=>{
  const input=defaults('mortgageFrequency'),j=input.rate/100,m=(1+j/2)**(1/6)-1,n=300;
  const expected=input.principal*m/(1-(1+m)**(-n)),monthly=mortgageFrequencyPlan(input),regular=mortgageFrequencyPlan(input,'regular'),accelerated=mortgageFrequencyPlan(input,'accelerated');
  near(monthly.payment,expected);near(monthly.payment,2326.4199401480723);near((1+m)**12,(1+j/2)**2);
  near(regular.payment,expected*12/26);near(accelerated.payment,expected/2);near(regular.scheduledAnnual,monthly.scheduledAnnual);near(accelerated.scheduledAnnual-monthly.scheduledAnnual,expected);
});
test('mortgage balances match the independent annuity equation at intermediate dates and reconcile to payoff',()=>{
  const input=defaults('mortgageFrequency');
  for(const mode of ['monthly','regular','accelerated']){
    const p=mortgageFrequencyPlan(input,mode),r=(1+input.rate/200)**(2/p.frequency)-1;
    for(const index of [1,12,52,100])near(p.rows[index].value,input.principal*(1+r)**index-p.payment*((1+r)**index-1)/r);
    near(p.paid,input.principal+p.interest);near(p.firstPrincipal+p.firstInterest,p.scheduledAnnual);near(p.balance,0);assert.ok(p.rows.every(r=>r.value>=0));
    assert.ok(p.paid<=p.periods*p.payment+1e-6);
  }
  const monthly=mortgageFrequencyPlan(input),regular=mortgageFrequencyPlan(input,'regular'),accelerated=mortgageFrequencyPlan(input,'accelerated');
  assert.equal(monthly.periods,300);assert.equal(regular.periods,649);assert.equal(accelerated.periods,559);near(accelerated.interest,249577.2962281278);
});
test('zero-rate mortgages repay principal only and no mortgage creates no payment',()=>{
  const input=defaults('mortgageFrequency');
  for(const mode of ['monthly','regular','accelerated']){
    const p=mortgageFrequencyPlan({...input,rate:0},mode);near(p.interest,0);near(p.paid,input.principal);near(p.balance,0);
    const empty=mortgageFrequencyPlan({...input,principal:0},mode);near(empty.payment,0);near(empty.interest,0);assert.equal(empty.rows.length,1);
  }
});
test('promotion without deposits matches an independently multiplied two-rate accumulation',()=>{
  const input={...defaults('promoSavings'),monthly:0},p=savingsPromotion(input);
  near(p.rows[4].interest,20000*((1+.05/12)**4-1));near(p.rows[4].interest,335.4224597318645);
  near(p.firstYear,20000*((1+.05/12)**4*(1+.02/12)**8-1));
  near(p.balance,20000*(1+.05/12)**4*(1+.02/12)**20);near(p.contributions,20000);
});
test('identical deposits reconcile contribution and interest ledgers in both savings accounts',()=>{
  const input=defaults('promoSavings'),p=savingsPromotion(input),steady=savingsPromotion(input,true);
  near(p.contributions,32000);near(steady.contributions,p.contributions);near(p.balance-p.contributions,p.interest);near(steady.balance-steady.contributions,steady.interest);
  near(p.interest,1264.73061008985);near(steady.interest,1586.5497376353744);near(p.balance-steady.balance,-321.81912754552);
  near(p.years.reduce((s,r)=>s+r.value,0),p.interest);
});
test('promotion caps apply once, include prior credited interest and expire at the stated boundary',()=>{
  const input={...defaults('promoSavings'),initial:60000,monthly:0,cap:50000},p=savingsPromotion(input);
  near(p.rows[1].charge,50000*.05/12+10000*.02/12);
  near(p.rows[4].charge,50000*.05/12+(p.rows[3].value-50000)*.02/12);
  near(p.rows[5].charge,p.rows[4].value*.02/12);
  const noPromo=savingsPromotion({...input,cap:0});near(noPromo.balance,input.initial*(1+.02/12)**24);
  const same=savingsPromotion({...input,promoRate:3,baseRate:3}),control=savingsPromotion({...input,steadyRate:3},true);near(same.balance,control.balance);
  const lower=savingsPromotion({...input,promoRate:0});assert.ok(lower.rows[1].charge<noPromo.rows[1].charge);
  const partial=savingsPromotion({...input,horizonMonths:13});assert.equal(partial.years[1].label,'Months 13–13');near(partial.years[1].value,partial.rows[13].charge);
});
test('foreign refund reconciles rate change and original fee retention without assuming a fee rebate',()=>{
  const input=defaults('cardFxRefund'),p=foreignCardCash(input);
  near(p.base,1350);near(p.purchaseCost,33.75);near(p.charged,1383.75);near(p.refundBase,1300);near(p.credited,1300);near(p.net,83.75);
  near(p.net,input.foreignAmount*(input.buyRate-input.refundRate)+p.purchaseCost);
  near(planningResult('cardFxRefund').charts[0].rows.reduce((s,r)=>s+r.value,0),p.net);
});
test('refund deductions and original-fee rebates are separate, proportional entries',()=>{
  const input=defaults('cardFxRefund'),cost=foreignCardCash({...input,refundFee:2.5}),rebate=foreignCardCash({...input,feeReturn:100});
  near(cost.credited,1267.5);near(cost.net,116.25);near(rebate.credited,1333.75);near(rebate.net,50);
  const half=foreignCardCash({...input,refundShare:50,feeReturn:100});near(half.foreignRefund,500);near(half.feeCredit,16.875);near(half.credited,666.875);
  const none=foreignCardCash({...input,refundShare:0,feeReturn:100});near(none.credited,0);near(none.net,none.charged);
  const exact=foreignCardCash({...input,refundRate:input.buyRate,feeReturn:100});near(exact.net,0);
  const gain=foreignCardCash({...input,purchaseFee:0,refundRate:1.5});assert.ok(gain.net<0);
});
test('currency conversion is homogeneous in foreign units and the no-purchase case has no refund',()=>{
  const input=defaults('cardFxRefund'),p=foreignCardCash(input),double=foreignCardCash({...input,foreignAmount:2000});
  for(const key of Object.keys(p))near(double[key],2*p[key]);
  const empty=foreignCardCash({...input,foreignAmount:0,refundFee:8,feeReturn:100});assert.ok(Object.values(empty).every(v=>v===0));
});
test('calendar periods are whole numbers and all four figures remain finite at supported extremes',()=>{
  for(const [kind,key] of [['mortgageFrequency','amortYears'],['promoSavings','promoMonths'],['promoSavings','horizonMonths']])assert.equal(validInputs(kind,{...defaults(kind),[key]:defaults(kind)[key]+.5}),false);
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['mortgageFrequency','promoSavings','cardFxRefund']){
    const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
