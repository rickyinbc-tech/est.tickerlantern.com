import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {rentalCashYear,interestPayoutPath,cardAllocationPath} from '../src/planning-income-ledgers-models.js';
import {incomeLedgerGuides} from '../src/planning-income-ledgers-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('rental cash reconciles separately from operating costs and the interest subtotal',()=>{
  const d=defaults('rentalCash'),p=rentalCashYear(d);near(p.rentCollected,35200);near(p.operating,7200);near(p.operatingLessInterest,18000);near(p.cash,2000);near(p.ownerFunding,0);
  for(let vacantMonths=0;vacantMonths<=12;vacantMonths++){
    const q=rentalCashYear({...d,vacantMonths});near(q.rentCollected,d.rent*(12-vacantMonths));
    near(q.cash,q.operatingLessInterest-d.annualPrincipal-d.capitalCash-d.taxCash);
    near(q.cash,d.rent*(12-vacantMonths)-12*d.operatingMonthly-d.annualInterest-d.annualPrincipal-d.capitalCash-d.taxCash);
  }
  const gap=rentalCashYear({...d,vacantMonths:2});near(gap.cash,-1200);near(gap.ownerFunding,1200);
  for(const key of ['annualPrincipal','capitalCash','taxCash']){const q=rentalCashYear({...d,[key]:d[key]+1000});near(q.cash,p.cash-1000);near(q.operatingLessInterest,p.operatingLessInterest);}
});
test('payout saving agrees with an independent annuity formula and the resources ledger',()=>{
  const d=defaults('interestPayout');
  for(const outsideRate of [0,2,4,10])for(const spentShare of [0,50,100])for(const years of [1,5,10]){
    const input={...d,outsideRate,spentShare,years},p=interestPayoutPath(input),q=outsideRate/100,C=d.principal*d.certificateRate/100;
    const saved=C*(1-spentShare/100),outside=saved*(q===0?years:((1+q)**years-1)/q);
    near(p.outside,outside);near(p.end.compound,d.principal*(1+d.certificateRate/100)**years);
    near(p.end.payoutRetained,d.principal+outside);near(p.spent,C*spentShare/100*years);
    near(p.end.payoutRetained+p.spent,d.principal+p.paidInterest+p.outsideInterest);
    near(p.rows.reduce((s,r)=>s+r.payoutReceipt,0),d.principal+C*years);
    near(p.rows.reduce((s,r)=>s+r.compoundReceipt,0),p.end.compound);
  }
  const p=interestPayoutPath(d);near(p.outsideInterest,204.04016);near(p.end.payoutRetained,55204.04016);
});
test('matching reinvestment rates without consumption reproduces annual compounding',()=>{
  const d=defaults('interestPayout');
  for(const certificateRate of [0,2,4,10])for(const years of [1,5,10]){
    const p=interestPayoutPath({...d,certificateRate,outsideRate:certificateRate,spentShare:0,years});near(p.end.payoutRetained,p.end.compound);near(p.spent,0);
  }
  const empty=interestPayoutPath({...d,principal:0});near(empty.end.compound,0);near(empty.spent,0);near(empty.outsideInterest,0);
});
test('card allocation follows independently checked first-cycle amounts and total cash conservation',()=>{
  const d=defaults('cardAllocation'),h=cardAllocationPath(d),p=cardAllocationPath(d,'proportional');
  near(h.firstMinimum,213.75);near(h.rows[1].a,4922.75);near(h.rows[1].b,1902.25);near(h.rows[1].total,6825);
  near(p.rows[1].a,5075-300*5075/7125);near(p.rows[1].b,2050-300*2050/7125);
  assert.equal(h.months,30);assert.equal(p.months,31);near(h.interest,1929.9067087133976);near(p.interest,2169.541908131777);
  for(const q of [h,p]){near(q.paid+q.remaining,d.balanceA+d.balanceB+q.interest);near(q.interestBy[0]+q.interestBy[1],q.interest);assert.equal(q.complete,true);}
  const swapped=cardAllocationPath({...d,balanceA:d.balanceB,balanceB:d.balanceA,rateA:d.rateB,rateB:d.rateA});near(swapped.interest,h.interest);assert.equal(swapped.months,h.months);
});
test('equal card rates reduce the total path to the standard fixed-payment annuity',()=>{
  const d={...defaults('cardAllocation'),rateB:18},r=d.rateA/1200,P=d.balanceA+d.balanceB;
  const h=cardAllocationPath(d),p=cardAllocationPath(d,'proportional');near(h.interest,p.interest);assert.equal(h.months,p.months);
  for(const row of h.rows.slice(0,-1))near(row.total,P*(1+r)**row.x-d.payment*((1+r)**row.x-1)/r);
  const zero=cardAllocationPath({...d,rateA:0,rateB:0});assert.equal(zero.months,Math.ceil(P/d.payment));near(zero.interest,0);
});
test('blocked and limited card paths retain their debt without reporting a payoff saving',()=>{
  const d=defaults('cardAllocation'),blocked=cardAllocationPath({...d,payment:100});assert.equal(blocked.blockedMonth,1);assert.equal(blocked.rows.length,1);near(blocked.interest,0);near(blocked.remaining,7000);assert.equal(blocked.complete,false);
  const limited=cardAllocationPath(d,'highest',1);assert.equal(limited.complete,false);near(limited.paid,300);near(limited.interest,125);near(limited.remaining,6825);
  const empty=cardAllocationPath({...d,balanceA:0,balanceB:0});assert.equal(empty.complete,true);assert.equal(empty.months,0);near(empty.firstMinimum,0);
  const result=planningResult('cardAllocation',{...d,payment:100});assert.equal(result.metrics[2][1],null);
});
test('income-ledger articles retain substantial prose and finite accessible charts across input boundaries',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const g of incomeLedgerGuides){
    assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800,g.slug);assert.ok(g.related.every(s=>slugs.has(s)));
    const d=defaults(g.planning),fields=definitions[g.planning].fields;
    const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
  assert.equal(validInputs('rentalCash',{...defaults('rentalCash'),vacantMonths:1.5}),false);
});
