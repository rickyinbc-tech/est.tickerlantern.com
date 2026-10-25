import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, validInputs, planningResult } from '../src/planning-models.js';
import { jobOfferComparison, deadlineGoal, deadlineMonthlyNeeded, retirementSpendingRule } from '../src/planning-calendar-risk-models.js';
import { calendarRiskGuides } from '../src/planning-calendar-risk-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('job comparison uses independently calculated annual pay, commuting days, cash costs and time',()=>{
  const d=defaults('jobOffer'),p=jobOfferComparison(d);
  near(p.current.pay,54000);near(p.offer.pay,60000);near(p.current.days,138);near(p.offer.days,230);
  near(p.current.commuting,1656);near(p.offer.commuting,6440);near(p.current.cost,2256);near(p.offer.cost,7640);
  near(p.gain,616);near(p.current.hours,103.5);near(p.offer.hours,345);near(p.extraHours,241.5);
  near(p.breakEven,(54000-2256+7640)/12);
  near(jobOfferComparison({...d,workDaysB:3}).gain,3192);
});
test('job break-even holds cash constant and time changes do not silently change pay',()=>{
  const d=defaults('jobOffer'),p=jobOfferComparison(d);
  near(jobOfferComparison({...d,netB:p.breakEven}).gain,0);
  const time=jobOfferComparison({...d,minutesB:300});near(time.gain,p.gain);assert.ok(time.extraHours>p.extraHours);
  const remote=jobOfferComparison({...d,workDaysB:0});near(remote.offer.commuting,0);near(remote.offer.hours,0);near(remote.offer.other,1200);
  const deficit=jobOfferComparison({...d,netB:0});assert.ok(deficit.gain<0);assert.ok(deficit.offer.remaining<0);
  const same=jobOfferComparison({...d,netB:d.netA,workDaysB:d.workDaysA,dayCostB:d.dayCostA,otherB:d.otherA,minutesB:d.minutesA});near(same.gain,0);near(same.extraHours,0);
});

test('goal loss uses only the initial amount and deposits present before the event',()=>{
  const d=defaults('goalDeadline'),p=deadlineGoal(d);
  near(p.baseline,42000);near(p.lossAmount,(30000+17*500)*.6*.25);near(p.lossAmount,5775);
  near(p.balance,36225);near(p.gap,13775);near(p.balance+p.lossAmount,p.baseline);
  for(const shockMonth of [1,24,25,60]) {
    const q=deadlineGoal({...d,shockMonth});
    near(q.lossAmount,shockMonth<=24?(30000+(shockMonth-1)*500)*.6*.25:0);
    near(q.balance+q.lossAmount,q.baseline);
  }
});
test('independent closed-form contribution solver funds the same goal under every tested stress',()=>{
  const d=defaults('goalDeadline');
  for(const months of [1,24,60])for(const shockMonth of [1,18,60])for(const exposed of [0,60,100])for(const loss of [0,25,60]) {
    const input={...d,months,shockMonth,exposed,loss};
    const h=shockMonth<=months?exposed*loss/10000:0;
    const expected=Math.max(0,(input.goal-input.initial*(1-h))/(months-(shockMonth-1)*h));
    near(deadlineMonthlyNeeded(input),expected);
    const p=deadlineGoal({...input,monthly:expected});near(p.gap,0);assert.ok(p.balance>=input.goal-1e-7);
  }
  near(deadlineMonthlyNeeded(d),1142.1911421911423);
  near(deadlineMonthlyNeeded({...d,goal:0}),0);
  near(deadlineGoal({...d,exposed:0}).lossAmount,0);
});
test('spending trigger is strict, cuts once at review and applies returns after funded withdrawals',()=>{
  const d=defaults('spendingRule'),p=retirementSpendingRule(d);
  assert.equal(p.annual[0].triggered,false);near(p.annual[0].requested,30000);near(p.annual[0].value,(600000-30000)*.75);
  assert.equal(p.annual[1].triggered,true);near(p.annual[1].flexible,9600);near(p.annual[1].requested,27600);
  near(p.annual[1].value,(427500-27600)*1.03);
  near(p.annual[2].flexible,7680);
  assert.ok(p.annual[1].requested/p.annual[0].value>d.trigger/100);
  near(p.balance,67828.9720420173);near(p.unmetEssential,0);
});
test('zero cuts reproduce the fixed-request path; full cuts persist without a restoration rule',()=>{
  const d=defaults('spendingRule'),fixed=retirementSpendingRule(d,false),noCut=retirementSpendingRule({...d,cut:0});
  assert.deepEqual(noCut.rows,fixed.rows);near(noCut.essentialPaid,fixed.essentialPaid);near(noCut.flexiblePaid,fixed.flexiblePaid);near(noCut.foregone,0);
  const full=retirementSpendingRule({...d,cut:100});near(full.annual[0].flexible,12000);assert.ok(full.annual.slice(1).every(r=>r.flexible===0));
  near(full.foregone,12000*(d.years-1));
});
test('retirement ledger distinguishes paid essentials, unpaid requests and deliberate spending cuts',()=>{
  const d={...defaults('spendingRule'),initial:10000,essential:18000,flexible:12000,years:2,cut:50,loss:0,rate:0};
  const p=retirementSpendingRule(d);
  near(p.essentialPaid,10000);near(p.flexiblePaid,0);near(p.unmetEssential,26000);
  near(p.foregone,6000+9000);near(p.unmet,(18000+6000-10000)+(18000+3000));near(p.balance,0);
  near(p.essentialPaid+p.flexiblePaid+p.unmet+p.foregone,(d.essential+d.flexible)*d.years);
  const empty=retirementSpendingRule({...d,initial:0});near(empty.essentialPaid,0);near(empty.unmetEssential,36000);
});
test('zero real returns reconcile ending assets with paid consumption, without double inflation',()=>{
  const d={...defaults('spendingRule'),loss:0,rate:0},p=retirementSpendingRule(d);
  near(p.balance,d.initial-p.essentialPaid-p.flexiblePaid);
  const rich={...d,initial:3000000,trigger:20},q=retirementSpendingRule(rich);
  near(q.foregone,0);near(q.balance,rich.initial-(rich.essential+rich.flexible)*rich.years);
});
test('new calendar fields reject fractional dates and every new topic renders finite accessible figures at boundaries',()=>{
  for(const [kind,key] of [['jobOffer','workDaysA'],['jobOffer','workDaysB'],['jobOffer','workWeeks'],['goalDeadline','shockMonth'],['goalDeadline','months'],['spendingRule','years']])assert.equal(validInputs(kind,{...defaults(kind),[key]:1.5}),false);
  for(const {planning:kind} of calendarRiskGuides) {
    const variants=[defaults(kind)];
    for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...defaults(kind),[key]:value});
    for(const input of variants) {
      assert.equal(validInputs(kind,input),true);
      const result=planningResult(kind,input);assert.equal(result.charts.length,4);
      const html=renderResult(result,300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
      assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);
      assert.ok(result.charts.every(c=>c.note.length>80));
    }
  }
});
