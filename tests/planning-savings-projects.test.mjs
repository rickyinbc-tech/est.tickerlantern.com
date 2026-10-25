import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { annualPremiumPath, phasedInvestmentPath, renovationCalendar } from '../src/planning-savings-projects-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('annual and monthly premium paths receive equal resources and reconcile to annuity future values',()=>{
  const input=defaults('annualPremium'),p=annualPremiumPath(input),r=1.04**(1/12)-1;
  near(p.payment,110);near(p.extra,120);near(p.prepaid,110*((1+r)**12-1)/r);near(p.monthly,1200*1.04);
  near(p.prepaid,1344.028631696764);near(p.advantage,96.028631696764);
  near(p.prepaid,12*p.payment+p.prepaidInterest);near(p.monthly,input.annual+p.monthlyInterest);
  near(p.extra+p.prepaidInterest-p.monthlyInterest,p.advantage);
  near(p.rows[0].prepaid,0);near(p.rows[0].monthly,1200);near(p.rows[1].prepaid,110);
});
test('equivalent rate discounts the actual twelve month-end bills and differs from the total surcharge',()=>{
  const p=annualPremiumPath(defaults('annualPremium')),i=(1+p.effective)**(1/12)-1;
  near(p.effective,.19528835799355537);
  near(Array.from({length:12},(_,n)=>p.payment/(1+i)**(n+1)).reduce((a,b)=>a+b,0),1200);
  const zero=annualPremiumPath({...defaults('annualPremium'),surcharge:0,cashReturn:0});near(zero.effective,0);near(zero.advantage,0);
  assert.equal(annualPremiumPath({...defaults('annualPremium'),annual:0}).effective,null);
});
test('cash opportunity cost and surcharge are kept distinct',()=>{
  const input=defaults('annualPremium');near(annualPremiumPath({...input,cashReturn:0}).advantage,120);
  assert.ok(annualPremiumPath({...input,surcharge:0}).advantage<0);
  near(annualPremiumPath({...input,cashReturn:19.528835799355537}).advantage,0);
});
test('phased purchases reconcile to a geometric investment value plus retained cash interest',()=>{
  const input=defaults('phasedInvest'),p=phasedInvestmentPath(input),r=1.06**(1/12)-1;
  const expected=10000*Array.from({length:6},(_,n)=>(1+r)**(24-n)).reduce((a,b)=>a+b,0);
  near(p.invested,expected);near(p.deployed,60000);near(p.cash,p.cashInterest);near(p.total,p.invested+p.cash);
  near(p.cash,256.7557769395);near(p.total,66861.6064141722);
  near(phasedInvestmentPath(input,1).total,60000*1.06**2);
  near(p.rows[1].deployed,10000);near(p.rows[6].deployed,60000);
  const chart=planningResult('phasedInvest').charts[0];near(chart.series[0].rows[0].value,60000);near(chart.series[1].rows[0].value,10000);assert.equal(chart.series[1].rows[5].x,5);
});
test('timing controls preserve capital and produce equality when asset and cash rates match',()=>{
  const input=defaults('phasedInvest');
  for(const count of [1,3,6,12]){
    near(phasedInvestmentPath({...input,assetReturn:0,cashReturn:0},count).total,60000);
    near(phasedInvestmentPath({...input,assetReturn:4,cashReturn:4},count).total,60000*1.04**2);
    near(phasedInvestmentPath(input,count).deployed,60000);
  }
  const negative={...input,assetReturn:-10,cashReturn:0};assert.ok(phasedInvestmentPath(negative,6).total>phasedInvestmentPath(negative,1).total);
  near(phasedInvestmentPath({...input,capital:0}).total,0);
});
test('renovation schedules pay the same total but have independently verified different low points',()=>{
  const input=defaults('renovationCash'),a=renovationCalendar(input),b=renovationCalendar(input,true);
  near(a.paid,46000);near(b.paid,a.paid);near(a.ending,-2000);near(b.ending,a.ending);
  near(a.extra,2000);near(b.extra,8000);near(b.rows[2].after,-8000);near(a.rows[0].after,16000);near(b.rows[0].after,0);
  near(a.rows.reduce((s,r)=>s+r.saving,0),24000);near(a.ending,input.cash+6*input.monthly-a.paid);
  for(const front of [false,true]){const p=renovationCalendar(input,front),funded=renovationCalendar({...input,cash:input.cash+p.extra},front);assert.ok(funded.rows.every(r=>r.after>=-1e-8));}
});
test('preparation shifts every bill and adds only the stated saving months',()=>{
  const input=defaults('renovationCash'),base=renovationCalendar(input),later=renovationCalendar({...input,prepareMonths:3});
  near(later.paid,base.paid);near(later.ending-base.ending,12000);near(later.extra,0);
  assert.deepEqual(later.rows.filter(r=>r.baseBill).map(r=>r.x),[3,5,7,9]);
  assert.deepEqual(later.rows.filter(r=>r.changeBill).map(r=>r.x),[4]);near(later.rows[3].saving,4000);
  near(renovationCalendar({...input,monthly:0}).extra,26000);
});
test('new calendar fields reject fractional purchase and preparation periods',()=>{
  for(const [kind,key] of [['phasedInvest','phaseMonths'],['phasedInvest','months'],['renovationCash','prepareMonths']])assert.equal(validInputs(kind,{...defaults(kind),[key]:1.5}),false);
});
test('new scenarios render finite values and accessible chart tables at supported input edges',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['annualPremium','phasedInvest','renovationCash']){
    const d=defaults(kind),fields=definitions[kind].fields;
    const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
    }
  }
});
