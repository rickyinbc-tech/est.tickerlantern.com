import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {bondPurchaseMoments,bondHorizonCash} from '../src/planning-bond-reinvestment-models.js';
import {renderResult} from '../src/planning-charts.js';
const kind='bondReinvestment',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const annuityPrice=(f,c,n,y)=>y?c*(1-(1+y)**-n)/y+f*(1+y)**-n:c*n+f;
test('bond purchase prices match a separate closed-form annuity equation',()=>{
  const base=defaults(kind);
  for(const coupon of [0,5,15])for(const maturity of [1,10,30])for(const yieldPercent of [0,5,15]){
    const input={...base,coupon,maturity};near(bondPurchaseMoments(input,yieldPercent).price,annuityPrice(input.face,input.face*coupon/100,maturity,yieldPercent/100));
  }
  near(bondPurchaseMoments(base).duration,8.107821675644052);
  near(bondPurchaseMoments({...base,coupon:0}).duration,base.maturity);
  near(bondPurchaseMoments({...base,purchaseYield:0}).duration,(5000*10*11/2+100000*10)/150000);
});
test('cash ledger matches both a recurrence and whole-payment present-value identity before and after maturity',()=>{
  const input=defaults(kind);
  for(const yieldPercent of [0,3,5,7,15]){
    const y=yieldPercent/100,c=input.face*input.coupon/100;let receivedCash=0;
    for(let h=0;h<=30;h++){
      if(h)receivedCash=receivedCash*(1+y)+(h<=input.maturity?c:0)+(h===input.maturity?input.face:0);
      const sale=h<input.maturity?annuityPrice(input.face,c,input.maturity-h,y):0;
      const p=bondHorizonCash(input,yieldPercent,h);
      near(p.total,receivedCash+sale);near(p.total,bondPurchaseMoments(input,yieldPercent).price*(1+y)**h);
      near(p.assetOrPrincipal+p.couponsPaid+p.cashGrowth,p.total);
      if(h>=input.maturity){near(p.saleValue,0);near(p.principalPaid,input.face);}
      else near(p.principalPaid,0);
    }
  }
});
test('original duration cancels local yield sensitivity, without asserting exact immunity for finite shifts',()=>{
  const input=defaults(kind),d=bondPurchaseMoments(input).duration,eps=.001;
  const mid=bondHorizonCash(input,5,d).total,up=bondHorizonCash(input,5+eps,d).total,down=bondHorizonCash(input,5-eps,d).total;
  assert.ok(Math.abs((up-down)/mid)<1e-10);
  assert.ok(bondHorizonCash(input,7,d).total>mid);
  const earlyUp=bondHorizonCash(input,7,1).total,earlyBase=bondHorizonCash(input,5,1).total;
  const lateUp=bondHorizonCash(input,7,10).total,lateBase=bondHorizonCash(input,5,10).total;
  assert.ok(earlyUp<earlyBase);assert.ok(lateUp>lateBase);
});
test('default year-eight price and reinvestment offsets reconcile to the complete wealth difference',()=>{
  const input=defaults(kind),p=bondHorizonCash(input),base=bondHorizonCash(input,5);
  near(p.total,147682.97651008604);near(p.saleValue,96383.9636649489);near(p.couponsPaid,40000);near(p.cashGrowth,11299.012845137157);
  near(p.total-base.total,-62.56786882021744);near(p.annualized,.0499444074290154);near(base.annualized,.05);
  const bridge=planningResult(kind).charts[2];near(bridge.rows.reduce((s,r)=>s+r.value,0),p.total-base.total);
  const zeroCoupon={...input,coupon:0};near(bondHorizonCash(zeroCoupon,7,10).total,bondHorizonCash(zeroCoupon,5,10).total);
  assert.ok(bondHorizonCash(zeroCoupon,7,20).total>bondHorizonCash(zeroCoupon,5,20).total);
});
test('whole-year input rules and all supported extrema retain finite, labelled chart geometry',()=>{
  const base=defaults(kind),fields=definitions[kind].fields,cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
  for(const input of cases){assert.ok(validInputs(kind,input));const result=planningResult(kind,input);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
  for(const key of ['maturity','horizon'])assert.equal(validInputs(kind,{...base,[key]:1.5}),false);
});
