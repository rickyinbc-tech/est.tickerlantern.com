import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { bridgeExpiryPlan, withdrawalAllocation, debtLifePlan } from '../src/planning-pension-withdrawal-protection-models.js';
import { pensionWithdrawalProtectionGuides } from '../src/planning-pension-withdrawal-protection-guides.js';
import { planningGuides } from '../src/planning-guides.js';
import { guides as investmentGuides } from '../src/research-guides.js';
import { renderResult } from '../src/planning-charts.js';
import { articleDates } from '../scripts/build-research.mjs';

const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('bridge expiry and later CPP reconcile each boundary and the earlier reserve trough',()=>{
  const input=defaults('bridgeExpiry'),p=bridgeExpiryPlan(input);
  near(p.required,25200);near(p.extra,5200);near(p.ending,14000);
  near(p.rows[60].cash,14000);near(p.rows[84].cash,-5200);near(p.rows[85].cash,-5000);
  assert.equal(p.rows[60].temporary,700);assert.equal(p.rows[61].temporary,0);
  assert.equal(p.rows[84].cppCash,0);assert.equal(p.rows[85].cppCash,1000);
  near(p.totalIncome-p.totalSpending,p.ending-input.cash);
  const funded=bridgeExpiryPlan({...input,cash:p.required});
  assert.ok(funded.rows.every(row=>row.cash>=0));near(Math.min(...funded.rows.map(row=>row.cash)),0);
  const early=bridgeExpiryPlan(input,{cppStart:65});
  assert.equal(early.rows[60].cppCash,0);assert.equal(early.rows[61].cppCash,1000);
  const later=bridgeExpiryPlan(input,{cppStart:70});
  assert.equal(later.rows[120].cppCash,0);assert.equal(later.rows[121].cppCash,1000);
});

test('spending steps each January while bridge and CPP inputs remain independent net amounts',()=>{
  const input={...defaults('bridgeExpiry'),inflation:3},p=bridgeExpiryPlan(input);
  near(p.rows[12].spending,3500);near(p.rows[13].spending,3605);
  near(p.rows[85].income,3700);near(p.rows[180].income,3700);
  const chart=planningResult('bridgeExpiry',input).charts[3];
  near(chart.rows[1].values[1],p.required);
  near(chart.rows[1].values[2],bridgeExpiryPlan(input,{cppStart:70}).required);
  const zero=bridgeExpiryPlan({...input,lifetime:0,bridge:0,cpp:0,other:0,expenses:0,cash:0});
  near(zero.required,0);near(zero.ending,0);
});

test('withdrawal sources use the smaller remaining denominator without a hidden exchange',()=>{
  const input=defaults('withdrawalMix'),p=withdrawalAllocation(input);
  near(p.proportional.equitySale,21000);near(p.proportional.bondSale,9000);
  near(p.directed.equitySale,30000);near(p.directed.bondSale,0);
  near(p.remaining,270000);near(p.proportionalWeight,.7);near(p.directedWeight,2/3);near(p.residual,18000);
  const exact=withdrawalAllocation(input,{request:75000});
  near(exact.directed.equity,135000);near(exact.directed.bonds,90000);near(exact.directedWeight,.6);near(exact.residual,0);
  const underweight=withdrawalAllocation({...input,equityWeight:30});
  near(underweight.directed.equitySale,0);near(underweight.directed.bondSale,30000);assert.ok(underweight.residual<0);
  const spent=withdrawalAllocation({...input,withdrawal:400000});
  near(spent.paid,300000);near(spent.unfunded,100000);near(spent.remaining,0);
  assert.equal(spent.directedWeight,null);assert.equal(spent.proportionalWeight,null);
});

test('directed sale is feasible and at least as close to the target as all sampled feasible alternatives',()=>{
  for(const equityWeight of [0,15,70,100])for(const target of [0,30,60,100])for(const withdrawal of [0,30000,75000,280000,400000]){
    const p=withdrawalAllocation({...defaults('withdrawalMix'),equityWeight,target,withdrawal});
    for(const holdings of [p.directed,p.proportional]){
      near(holdings.equitySale+holdings.bondSale,p.paid);near(holdings.equity+holdings.bonds,p.remaining);
      assert.ok(holdings.equitySale>=-1e-7&&holdings.equitySale<=p.equity+1e-7);
      assert.ok(holdings.bondSale>=-1e-7&&holdings.bondSale<=p.bonds+1e-7);
    }
    const low=Math.max(0,p.paid-p.bonds),high=Math.min(p.equity,p.paid),desired=p.remaining*target/100;
    for(let sample=0;sample<=20;sample++){
      const equitySale=low+(high-low)*sample/20;
      assert.ok(Math.abs(p.residual)<=Math.abs(p.equity-equitySale-desired)+1e-7);
    }
  }
});

test('mortgage balance and cash totals match independent closed-form amortization',()=>{
  const input=defaults('debtLifeCover'),p=debtLifePlan(input),r=(1+.05/2)**(1/6)-1;
  const payment=400000*r/(1-(1+r)**-300),n=120;
  near(p.payment,payment);near(p.balance,400000*(1+r)**n-payment*((1+r)**n-1)/r);
  near(p.loanPaid,payment*n);near(400000+p.interest,p.loanPaid+p.balance);
  near(p.creditorPaid,7200);near(p.levelPaid,4800);
  near(p.levelToDebt+p.levelResidual,400000);near(p.balance-p.levelToDebt,p.levelShortfall);
  const zeroRate=debtLifePlan({...input,rate:0});near(zeroRate.payment,400000/300);near(zeroRate.balance,240000);
});

test('premium termination, insufficient level cover and no-debt cases retain their distinct cash meaning',()=>{
  const input=defaults('debtLifeCover'),paidOff=debtLifePlan({...input,amortYears:1,coverYears:2});
  near(paidOff.balance,0);near(paidOff.creditorPaid,720);near(paidOff.levelPaid,960);
  near(paidOff.rows[12].balance,0);near(paidOff.rows[13].creditorPaid,paidOff.rows[12].creditorPaid);
  const insufficient=debtLifePlan({...input,levelCover:0});
  near(insufficient.levelToDebt,0);near(insufficient.levelResidual,0);near(insufficient.levelShortfall,insufficient.balance);
  const noDebt=debtLifePlan({...input,balance:0});near(noDebt.payment,0);near(noDebt.creditorPaid,0);near(noDebt.levelPaid,4800);
});

test('three detailed English guides have valid cross-links and render four accessible charts at supported extremes',()=>{
  const slugs=new Set([...planningGuides,...investmentGuides].map(g=>g.slug));
  for(const guide of pensionWithdrawalProtectionGuides){
    assert.ok(guide.related.every(slug=>slugs.has(slug)));assert.equal(guide.sections.length,6);
    assert.ok(guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=700);
    const kind=guide.planning;
    for(const input of [defaults(kind),Object.fromEntries(definitions[kind].fields.map(([key,,,min])=>[key,min])),Object.fromEntries(definitions[kind].fields.map(([key,,,,max])=>[key,max]))]){
      assert.ok(validInputs(kind,input));const result=planningResult(kind,input);assert.equal(result.charts.length,4);
      for(const width of [300,760]){
        const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
        assert.equal((html.match(/View chart data/g)||[]).length,4);
      }
    }
  }
  for(const [kind,key] of [['bridgeExpiry','cppStart'],['debtLifeCover','coverYears']]){
    const input={...defaults(kind),[key]:definitions[kind].fields.find(f=>f[0]===key)[3]+.5};
    assert.equal(validInputs(kind,input),false);assert.throws(()=>planningResult(kind,input));
  }
});

test('ongoing articles retain their own publication and review dates while legacy articles keep their dates',()=>{
  assert.deepEqual(articleDates({publishedAt:'2026-10-26',reviewedAt:'2026-10-27'}),{published:'2026-10-26',reviewed:'2026-10-27',publishedText:'26 October 2026',reviewedText:'27 October 2026'});
  assert.equal(articleDates({}).published,'2026-10-25');
  assert.throws(()=>articleDates({publishedAt:'2026-02-30'}));
  assert.throws(()=>articleDates({publishedAt:'2026-10-27',reviewedAt:'2026-10-26'}));
});
