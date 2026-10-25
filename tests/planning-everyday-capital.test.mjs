import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {assessmentEvents,assessmentLedger,assessmentSavingRequired,fixedDebtPath,contributionBatchPath} from '../src/planning-everyday-capital-models.js';
import {everydayCapitalGuides} from '../src/planning-everyday-capital-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('assessment bills precede saving and later cash does not erase missed deadlines',()=>{
  const d=defaults('condoAssessment'),p=assessmentLedger(d);
  assert.deepEqual(assessmentEvents(d).map(e=>[e.month,e.amount]),[[6,6000],[9,6000],[12,6000]]);
  near(p.rows[6].funded,6000);near(p.rows[9].gap,3800);near(p.rows[12].gap,4800);near(p.unfunded,8600);near(p.cash,5200);
  near(p.paid+p.unfunded,d.assessmentTotal);near(p.cash,d.assessmentCash+p.deposits-p.paid);
  assert.ok(p.cash>0&&p.unfunded>0);
});
test('required saving is the greatest independent cumulative deadline requirement',()=>{
  const d=defaults('condoAssessment'),required=assessmentSavingRequired(d);
  near(required,13000/11);
  const funded=assessmentLedger({...d,assessmentSaving:required});near(funded.unfunded,0);
  const lower=assessmentLedger({...d,assessmentSaving:required-.01});assert.ok(lower.unfunded>0);
  assert.equal(assessmentSavingRequired({...d,assessmentFirstMonth:1,assessmentCash:0}),null);
  const initialSufficient={...d,assessmentFirstMonth:1,assessmentCash:6000};assert.notEqual(assessmentSavingRequired(initialSufficient),null);
  const allCash={...d,assessmentCash:18000};near(assessmentSavingRequired(allCash),0);near(assessmentLedger({...allCash,assessmentSaving:0}).unfunded,0);
  near(assessmentSavingRequired({...d,assessmentTotal:0,assessmentCash:0}),0);
});
test('fixed loan amortization matches closed-form balances and preserves real/nominal identities',()=>{
  const d=defaults('fixedDebtInflation'),p=fixedDebtPath(d),r=d.realDebtApr/1200,n=12*d.realDebtYears;
  const expectedPayment=d.realDebtPrincipal*r/(1-(1+r)**(-n));near(p.payment,expectedPayment);
  for(const month of [1,12,24,48]){
    const row=p.rows[month],expectedDebt=d.realDebtPrincipal*(1+r)**month-expectedPayment*((1+r)**month-1)/r;
    near(row.value,expectedDebt);near(row.realDebt,row.value/(1+d.realDebtInflation/100)**(month/12));
    near(row.realPayment,p.payment/(1+d.realDebtInflation/100)**(month/12));near(row.withoutDebt-row.surplus,p.payment);
  }
  near(p.final.value,0);near(p.totalInterest,n*p.payment-d.realDebtPrincipal);
  near(p.final.realPayment,397.25384066588646);near(p.final.surplus,513.4450538643025);
  assert.ok(p.final.realPayment<p.payment&&p.final.surplus<p.rows[0].surplus);
});
test('inflation does not change contractual repayment and higher prices need not improve affordability',()=>{
  const d=defaults('fixedDebtInflation'),base=fixedDebtPath(d),higher=fixedDebtPath({...d,realDebtInflation:8});
  near(base.payment,higher.payment);near(base.totalInterest,higher.totalInterest);assert.ok(higher.final.realPayment<base.final.realPayment);assert.ok(higher.final.surplus<base.final.surplus);
  const zero=fixedDebtPath({...d,realDebtApr:0,realDebtInflation:0});near(zero.payment,d.realDebtPrincipal/(12*d.realDebtYears));near(zero.final.realPayment,zero.payment);near(zero.totalInterest,0);
  const noDebt=fixedDebtPath({...d,realDebtPrincipal:0});near(noDebt.payment,0);near(noDebt.totalInterest,0);near(noDebt.final.surplus,noDebt.final.withoutDebt);
});
test('batching at zero returns preserves deposits minus actual purchase fees, including residual cash',()=>{
  const d={...defaults('contributionBatch'),batchAssetReturn:0,batchCashReturn:0};
  for(const gap of [1,2,3,4,13]){
    const p=contributionBatchPath(d,gap),N=52*d.batchYears,trades=Math.floor(N/gap);
    assert.equal(p.trades,trades);near(p.fees,trades*d.batchFee);near(p.contributions,d.batchInitial+N*d.batchWeekly);
    near(p.total,p.contributions-p.fees);near(p.cash,(N%gap)*d.batchWeekly);
  }
  assert.deepEqual(contributionBatchPath(d,1),contributionBatchPath({...d,batchGap:1}));
});
test('weekly investment matches an independently expanded beginning-of-week annuity',()=>{
  const d=defaults('contributionBatch'),p=contributionBatchPath(d,1),N=52*d.batchYears,g=(1+d.batchAssetReturn/100)**(1/52);
  const expected=(d.batchWeekly-d.batchFee)*g*(g**N-1)/(g-1);
  near(p.total,expected);near(p.fees,2600);near(p.total,63705.404993727796);
  const selected=contributionBatchPath(d,4);near(selected.total,66165.19128192856);near(selected.fees,650);assert.equal(selected.trades,130);
});
test('batch purchase amounts include independently compounded waiting cash',()=>{
  const d={...defaults('contributionBatch'),batchGap:4,batchYears:1},p=contributionBatchPath(d),a=(1+d.batchAssetReturn/100)**(1/52),c=(1+d.batchCashReturn/100)**(1/52),N=52;
  let expected=0;
  for(let purchaseWeek=4;purchaseWeek<=N;purchaseWeek+=4){
    const available=d.batchWeekly*(1+c+c**2+c**3)+(purchaseWeek===4?d.batchInitial*c**3:0);
    expected+=(available-d.batchFee)*a**(N-purchaseWeek+1);
  }
  near(p.total,expected);near(p.cash,0);
});
test('unfunded purchase fees are not charged and zero contributions do not create a trade',()=>{
  const d={...defaults('contributionBatch'),batchWeekly:1,batchFee:25,batchInitial:0,batchAssetReturn:0,batchCashReturn:0,batchYears:1};
  const p=contributionBatchPath(d,1);assert.equal(p.trades,2);near(p.fees,50);near(p.total,2);
  assert.equal(p.rows[25].trades,0);assert.equal(p.rows[26].trades,1);near(p.rows[26].invested,1);
  const empty=contributionBatchPath({...d,batchWeekly:0});near(empty.fees,0);near(empty.total,0);assert.equal(empty.trades,0);
});
test('three new guides retain finite four-chart output, tables and whole-number calendar validation',()=>{
  assert.equal(everydayCapitalGuides.length,3);
  for(const [kind,key] of [['condoAssessment','assessmentFirstMonth'],['condoAssessment','assessmentParts'],['condoAssessment','assessmentSpacing'],['fixedDebtInflation','realDebtYears'],['contributionBatch','batchGap'],['contributionBatch','batchYears']])assert.equal(validInputs(kind,{...defaults(kind),[key]:1.5}),false);
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const kind of ['condoAssessment','fixedDebtInflation','contributionBatch']){
    const d=defaults(kind),fields=definitions[kind].fields,cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
    for(const input of cases){assert.ok(validInputs(kind,input));const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});

test('an impossible first-month saving requirement is labelled consistently in chart and table',()=>{
  const d=defaults('condoAssessment'),html=renderResult(planningResult('condoAssessment',d),300);
  assert.match(html,/>N\/A<\/text>/);assert.match(html,/<td>N\/A<\/td>/);assert.match(html,/N\/A means a month-one bill/);
});
