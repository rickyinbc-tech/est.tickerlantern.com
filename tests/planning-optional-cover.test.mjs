import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { insuranceLoanSchedule, insuranceCashComparison } from '../src/planning-optional-cover-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('base and insured payments agree with an independent annuity formula',()=>{
  for(const principal of [0,1800,25000,250000])for(const apr of [0,8,24])for(const months of [6,60,120]) {
    const r=apr/1200,expected=r===0?principal/months:principal*r/(1-(1+r)**(-months));
    const p=insuranceLoanSchedule(principal,apr,months);near(p.payment,expected);
    near(p.paid,principal+p.interest);near(p.balance,0);assert.equal(p.rows.length,months+1);
    assert.ok(p.rows.every(row=>row.value>=0));
  }
});
test('remaining debt matches the independent outstanding-balance equation before the final payment',()=>{
  const principal=26800,apr=8,months=60,r=apr/1200,p=insuranceLoanSchedule(principal,apr,months);
  for(const k of [1,12,30,59])near(p.rows[k].value,principal*(1+r)**k-p.payment*((1+r)**k-1)/r);
});
test('financed-premium costs reconcile as a separate loan and do not become usable purchase proceeds',()=>{
  const d=defaults('loanInsuranceCash'),p=insuranceCashComparison(d);
  near(p.base.payment,506.909857210342);near(p.financed.payment,543.4073669294867);
  near(p.extraInterest,389.8505831486855);near(p.premium.paid,2189.8505831486787);near(p.recurring,2100);
  near(p.financed.payment-p.base.payment,p.premium.payment);near(p.financed.paid-p.base.paid,p.premium.paid);
  near(p.financed.rows[0].value-p.base.rows[0].value,d.singlePremium);
  near(p.extraInterest,p.premium.interest);
});
test('total-payment bars count the premium once and exactly reconcile each cost schedule',()=>{
  const d=defaults('loanInsuranceCash'),p=insuranceCashComparison(d),bars=planningResult('loanInsuranceCash',d).charts[0].rows;
  const sum=row=>row.values.reduce((a,b)=>a+b,0);
  near(sum(bars[0]),p.base.paid);near(sum(bars[1]),p.base.paid+d.singlePremium);
  near(sum(bars[2]),p.financed.paid);near(sum(bars[3]),p.base.paid+d.monthlyPremium*d.months);
  assert.ok(bars.every(row=>row.values[0]===d.advance));
});
test('cash-calendar rows isolate premium outlays and handle a term shorter than twelve months',()=>{
  const d=defaults('loanInsuranceCash'),p=insuranceCashComparison(d),rows=planningResult('loanInsuranceCash',d).charts[2].rows;
  near(rows[0].values[0],1800);near(rows[0].values[1],p.premium.payment);near(rows[0].values[2],35);
  near(rows[1].values[1],437.9701166297354);near(rows[1].values[2],420);
  const short=planningResult('loanInsuranceCash',{...d,months:6}).charts[2].rows;assert.equal(short.length,2);
  assert.deepEqual(short.map(r=>r.label),['Cumulative through month 1','Cumulative through month 6']);
});
test('zero interest and a zero single premium remain different from a zero recurring premium',()=>{
  const d=defaults('loanInsuranceCash'),zero=insuranceCashComparison({...d,apr:0});near(zero.extraInterest,0);near(zero.premium.paid,d.singlePremium);
  const free=insuranceCashComparison({...d,singlePremium:0});near(free.extraInterest,0);near(free.premium.paid,0);near(free.financed.payment,free.base.payment);near(free.recurring,2100);
  const noMonthly=insuranceCashComparison({...d,monthlyPremium:0});near(noMonthly.recurring,0);assert.ok(noMonthly.premium.paid>0);
});
test('matrix changes rate and term only, while all boundary scenarios render finite values and data tables',()=>{
  const kind='loanInsuranceCash',d=defaults(kind),matrix=planningResult(kind,d).charts[4];
  assert.ok(matrix.rows.every(row=>row.values[0]===d.singlePremium));
  near(matrix.rows[2].values[2],insuranceLoanSchedule(d.singlePremium,12,60).paid);
  assert.equal(validInputs(kind,{...d,months:6.5}),false);
  const variants=[d];for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
  for(const input of variants){assert.equal(validInputs(kind,input),true);const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
});
