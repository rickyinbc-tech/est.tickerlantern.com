import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { bookingRefundPlan } from '../src/planning-booking-refund-models.js';
import { bookingRefundGuides } from '../src/planning-booking-refund-guides.js';
import { planningGuides } from '../src/planning-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('cash refund, conditional costs, weighted costs and default equality reconcile independently',()=>{
  const input=defaults('bookingRefund'),p=bookingRefundPlan(input),[low,high]=p.contracts;
  near(low.refund,0);near(high.refund,2000);near(low.cancelCost,1800);near(high.cancelCost,100);
  near(low.expected,1800);near(high.expected,1700);near(p.difference,-100);near(p.crossing,.15);
  for(const s of p.contracts){
    near(s.expected,.8*s.price+.2*s.cancelCost);near(s.price,s.refund+s.cancelCost);
  }
  near(bookingRefundPlan(input,{chance:15}).difference,0);
  assert.ok(bookingRefundPlan(input,{chance:10}).difference>0);
  assert.ok(bookingRefundPlan(input,{chance:20}).difference<0);
});

test('a changed premium also changes the refund base, and each matrix cell uses that contract consistently',()=>{
  const input=defaults('bookingRefund'),p=bookingRefundPlan(input,{premium:600});
  near(p.contracts[1].price,2400);near(p.contracts[1].refund,2300);near(p.crossing,600/2300);
  const chart=planningResult('bookingRefund').charts[3];
  near(chart.rows[1].values[2],-100);near(chart.rows[2].values[2],600-.2*2300);
  for(const premium of [100,300,600])for(const chance of [0,10,20,40]){
    const q=bookingRefundPlan(input,{premium,chance});
    near(q.difference,premium-chance/100*q.extraRefund);
  }
});

test('cash is fully paid at booking and refunded only after the cancellation and lag; probability does not move it',()=>{
  const input=defaults('bookingRefund'),p=bookingRefundPlan(input),[low,high]=p.contracts;
  assert.equal(p.refundMonth,4);near(low.rows[0].value,700);near(high.rows[0].value,400);
  near(high.rows[3].value,400);near(high.rows[4].value,2400);near(low.rows[4].value,700);
  assert.deepEqual(p.contracts.map(s=>s.rows),bookingRefundPlan({...input,cancelChance:100}).contracts.map(s=>s.rows));
  const later=bookingRefundPlan({...input,refundLag:5});near(later.contracts[1].rows[6].value,400);near(later.contracts[1].rows[7].value,2400);
  near(later.contracts[1].expected,high.expected);
  const short=bookingRefundPlan({...input,bookingCash:2000});near(short.contracts[1].rows[0].value,-100);near(short.contracts[1].upfrontGap,100);
  const sameMonth=bookingRefundPlan({...input,refundLag:0});near(sameMonth.contracts[1].rows[1].value,400);near(sameMonth.contracts[1].rows[2].value,2400);
});

test('retained fees cannot create extra bills and degenerate equality cases do not invent a probability',()=>{
  const input=defaults('bookingRefund'),largeFee=bookingRefundPlan({...input,highCancelFee:5000});
  near(largeFee.contracts[1].refund,0);near(largeFee.contracts[1].cancelCost,2100);
  const noRefund=planningResult('bookingRefund',{...input,highRefund:0});
  assert.equal(noRefund.metrics[2][1],null);assert.match(noRefund.metrics[2][3],/No crossing/);
  const equal=bookingRefundPlan({...input,bookingPremium:0,highRefund:0,lowRefund:0});assert.equal(equal.sameEverywhere,true);
  const same=planningResult('bookingRefund',{...input,bookingPremium:0,highRefund:0,lowRefund:0});assert.match(same.metrics[2][3],/Equal at every/);
  for(const bookingPrice of [0,1800,20000])for(const lowRefund of [0,100])for(const highRefund of [0,100]){
    for(const s of bookingRefundPlan({...input,bookingPrice,lowRefund,highRefund}).contracts){
      assert.ok(s.refund>=0&&s.refund<=s.price);assert.ok(s.expected>=0);near(s.price-s.refund,s.cancelCost);
    }
  }
});

test('the English article has valid related pages and four finite accessible charts at supported boundaries',()=>{
  const kind='bookingRefund',guide=bookingRefundGuides[0],slugs=new Set(planningGuides.map(g=>g.slug));
  assert.ok(guide.related.every(s=>slugs.has(s)));assert.equal(guide.sections.length,6);
  assert.ok(guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>850);
  for(const input of [defaults(kind),Object.fromEntries(definitions[kind].fields.map(([k,,,min])=>[k,min])),Object.fromEntries(definitions[kind].fields.map(([k,,,,max])=>[k,max]))]){
    assert.ok(validInputs(kind,input));const result=planningResult(kind,input);assert.equal(result.charts.length,4);
    for(const width of [300,760]){
      const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/View chart data/g)||[]).length,4);
    }
  }
  for(const key of ['cancelMonth','refundLag']){
    const input={...defaults(kind),[key]:1.5};assert.equal(validInputs(kind,input),false);assert.throws(()=>planningResult(kind,input));
  }
});
