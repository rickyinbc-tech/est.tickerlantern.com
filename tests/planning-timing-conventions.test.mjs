import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {inflationOrderPath,annualQuoteRates,quotedLoanPath} from '../src/planning-timing-conventions-models.js';
import {timingConventionGuides} from '../src/planning-timing-conventions-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('reversed inflation blocks preserve factors and final prices, while changing earlier requests',()=>{
  const d=defaults('inflationOrder'),a=inflationOrderPath(d),b=inflationOrderPath(d,true);
  assert.deepEqual(a.rates,[8,8,8,2,2,2,2,2,2,2]);assert.deepEqual(b.rates,[...a.rates].reverse());
  near(a.prices,1.08**3*1.02**7);near(a.prices,b.prices);near(a.spending[0].value,25000);near(b.spending[0].value,25000);
  near(a.spending[1].value,27000);near(b.spending[1].value,25500);
  near(a.spending.at(-1).value,d.inflationOrderSpending*a.prices/(1+a.rates.at(-1)/100));
  assert.ok(a.requested>b.requested);assert.ok(a.capital<b.capital);
});
test('opening capital and ending portfolios match independently expanded start-of-year cash flows',()=>{
  const d=defaults('inflationOrder'),g=1+d.inflationOrderReturn/100;
  for(const reversed of [false,true]){
    const p=inflationOrderPath(d,reversed);let price=1,pv=0,terminalWithdrawals=0;
    for(let t=0;t<10;t++){
      const request=d.inflationOrderSpending*price;pv+=request/g**t;terminalWithdrawals+=request*g**(10-t);price*=1+p.rates[t]/100;
    }
    near(p.requiredCapital,pv);near(p.capital,d.inflationOrderCapital*g**10-terminalWithdrawals);near(p.paid,p.requested);near(p.unfunded,0);
    const exact=inflationOrderPath({...d,inflationOrderCapital:pv},reversed);near(exact.capital,0);near(exact.unfunded,0);
    const short=inflationOrderPath({...d,inflationOrderCapital:pv-1},reversed);assert.ok(short.unfunded>0);
  }
  near(inflationOrderPath(d).requiredCapital-inflationOrderPath(d,true).requiredCapital,28342.15096315235);
});
test('unfunded inflation-linked spending remains separate, and equal inflation removes sequence differences',()=>{
  const d=defaults('inflationOrder');
  const none=inflationOrderPath({...d,inflationOrderCapital:0});near(none.capital,0);near(none.paid,0);near(none.unfunded,none.requested);assert.ok(none.unfunded>0);
  for(const reversed of [false,true]){
    const p=inflationOrderPath({...d,inflationOrderCapital:100000},reversed);near(p.paid+p.unfunded,p.requested);assert.ok(p.unfunded>0);
  }
  const same={...d,inflationBlockA:3,inflationBlockB:3};assert.deepEqual(inflationOrderPath(same),inflationOrderPath(same,true));
  const zero=inflationOrderPath({...d,inflationOrderSpending:0});near(zero.requiredCapital,0);near(zero.capital,d.inflationOrderCapital*(1+d.inflationOrderReturn/100)**10);
  const zeroReturn=inflationOrderPath({...d,inflationOrderReturn:0});near(zeroReturn.requiredCapital,zeroReturn.requested);
});
test('nominal and effective rate conversions preserve an independently specified annual factor',()=>{
  for(const rate of [0,2,5,20])for(const compounds of [1,2,12,365]){
    const p=annualQuoteRates(rate,compounds),factor=(1+rate/100/compounds)**compounds;
    near(1+p.effectiveAnnual,factor);near((1+p.monthly)**12,factor);
    const effective=annualQuoteRates(p.effectiveAnnual*100,1,true);near(effective.monthly,p.monthly);
  }
  near(annualQuoteRates(5,2).effectiveAnnual,.050625);near(annualQuoteRates(5,12).monthly,.05/12);
  near(annualQuoteRates(5,1,true).effectiveAnnual,.05);
});
test('each quoted loan independently amortizes the same principal using its own monthly rate',()=>{
  const d=defaults('rateConvention'),n=12*d.quoteLoanYears;
  for(const [compounds,effective] of [[2,false],[12,false],[1,true]]){
    const p=quotedLoanPath(d,compounds,effective),r=p.monthly;
    near(p.payment,d.quotePrincipal*r/(1-(1+r)**(-n)));near(p.paid,d.quotePrincipal+p.interest);near(p.interest,n*p.payment-d.quotePrincipal);near(p.rows.at(-1).value,0);
    for(const month of [1,12,120])near(p.rows[month].value,d.quotePrincipal*(1+r)**month-p.payment*((1+r)**month-1)/r);
  }
  near(quotedLoanPath(d).payment,1744.8149551110541);near(quotedLoanPath(d,12).payment,1753.7701245239373);near(quotedLoanPath(d,1,true).payment,1734.4145627464918);
});
test('zero interest and zero principal do not manufacture undefined payments',()=>{
  const d=defaults('rateConvention');
  for(const [compounds,effective] of [[2,false],[12,false],[1,true]]){
    const p=quotedLoanPath({...d,quoteRate:0},compounds,effective);near(p.payment,d.quotePrincipal/(12*d.quoteLoanYears));near(p.interest,0);
    const empty=quotedLoanPath({...d,quotePrincipal:0},compounds,effective);near(empty.payment,0);near(empty.interest,0);near(empty.paid,0);
  }
});
test('the two guides retain five and four accessible charts at all supported input boundaries',()=>{
  assert.equal(timingConventionGuides.length,2);
  for(const [kind,key] of [['inflationOrder','inflationBlockYears'],['rateConvention','quoteCompounds'],['rateConvention','quoteLoanYears']])assert.equal(validInputs(kind,{...defaults(kind),[key]:1.5}),false);
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const kind of ['inflationOrder','rateConvention']){
    const fields=definitions[kind].fields,d=defaults(kind),count=kind==='inflationOrder'?5:4;
    const cases=[d,...fields.flatMap(([key,,,lo,hi])=>[{...d,[key]:lo},{...d,[key]:hi}]),Object.fromEntries(fields.map(([key,,,lo])=>[key,lo])),Object.fromEntries(fields.map(([key,,,,hi])=>[key,hi]))];
    for(const input of cases){assert.ok(validInputs(kind,input));const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,count);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,count);assert.equal((html.match(/<caption>/g)||[]).length,count);}}
  }
});
