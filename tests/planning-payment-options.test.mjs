import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {rewardBudget,cashDiscountPath,transferBudget} from '../src/planning-payment-options-models.js';
import {paymentOptionGuides} from '../src/planning-payment-options-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {remittanceCase} from '../src/planning-payment-options-data.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('cash-back mix and purchase cap reconcile before annual costs',()=>{
  const d=defaults('cardRewards'),p=rewardBudget(d);
  near(p.bonusPurchases,9600);near(p.basePurchases,14400);near(p.gross,432);near(p.premiumNet,312);near(p.plainNet,240);near(p.advantage,72);
  for(const bonusShare of [50,75,100]){const q=rewardBudget({...d,bonusShare});near(q.bonusPurchases,10000);near(q.basePurchases,14000);near(q.gross,440);near(q.advantage,80);}
  const none=rewardBudget({...d,bonusCap:0});near(none.gross,240);near(none.advantage,-120);
  const noSpend=rewardBudget({...d,spend:0});near(noSpend.gross,0);near(noSpend.premiumNet,-120);
});
test('common interest reduces both absolute results but cannot change their relative difference',()=>{
  const d=defaults('cardRewards'),base=rewardBudget(d),p=rewardBudget({...d,commonInterest:400});
  near(p.premiumNet,-88);near(p.plainNet,-160);near(p.advantage,base.advantage);
  near(rewardBudget({...d,annualFee:0}).advantage,192);
  near(rewardBudget({...d,spend:15000}).advantage,0);
});
test('cash discount comparison agrees with independent terminal annuity values and debt ledger',()=>{
  const d=defaults('cashDiscount');
  for(const netReturn of [0,2,3,8])for(const financeMonths of [3,24,60]){
    const input={...d,netReturn,financeMonths},p=cashDiscountPath(input),r=(1+netReturn/100)**(1/12)-1;
    const factor=(1+r)**financeMonths,deposit=d.price/financeMonths,opening=d.price+d.setupFee-d.price*(1-d.cashDiscount/100);
    const cash=opening*factor+deposit*(r===0?financeMonths:(factor-1)/r),financing=d.price*factor;
    near(p.rows.at(-1).paidNow,cash);near(p.rows.at(-1).financed,financing);near(p.advantage,financing-cash);
    for(const row of p.rows){near(row.loan,d.price*(1-row.x/financeMonths));near(row.financedNet,row.financed-row.loan);near(row.paidNowNet,row.paidNow);}
  }
  near(cashDiscountPath(d).advantage,-316.3576650272371);
});
test('zero-return financing difference equals the forgone discount plus the upfront fee',()=>{
  const d={...defaults('cashDiscount'),netReturn:0},p=cashDiscountPath(d);
  near(p.advantage,-(d.price*d.cashDiscount/100+d.setupFee));near(p.rows.at(-1).loan,0);
  const same={...d,cashDiscount:0,setupFee:0};near(cashDiscountPath(same).advantage,0);
  assert.ok(cashDiscountPath({...same,netReturn:3}).advantage>0);
});
test('transfer quotes preserve the net foreign receipt and reconcile all CAD components',()=>{
  const d=defaults('remittanceBudget');
  for(const recipientFee of [0,20,100])for(const markup of [0,.5,3,10]){
    const p=transferBudget({...d,recipientFee},markup,10);
    near((p.total-p.fee)/p.quote-recipientFee,d.netForeign);
    near(p.principal+p.recipient+p.markupCost+p.fee,p.total);
    near(p.extra,p.total-d.netForeign*d.referenceRate);near(p.annualTotal,p.total*d.transferCount);
  }
  const a=transferBudget(d,d.markupA,d.feeA),b=transferBudget(d,d.markupB,d.feeB);
  near(a.total,1442);near(b.total,1417);near(a.annualTotal-b.annualTotal,300);
  const threshold=10/(1.4*.025),input={...d,netForeign:threshold};near(transferBudget(input,3,0).total,transferBudget(input,.5,10).total);
  const empty=transferBudget({...d,netForeign:0,recipientFee:100},10,100);near(empty.total,0);near(empty.annualExtra,0);near(empty.fee,0);
});
test('the official case stays fixed and retains its quote date and source classification',()=>{
  const d=defaults('remittanceBudget'),chart=planningResult('remittanceBudget',d).charts[0];
  assert.deepEqual(chart,planningResult('remittanceBudget',{...d,netForeign:9000,markupA:9,feeB:90,transferCount:2}).charts[0]);
  assert.equal(chart.evidence,'Official worked example · dated quotes');assert.ok(chart.source.includes('canada.ca'));
  assert.deepEqual(chart.rows.map(r=>r.values.reduce((a,b)=>a+b,0)),[39.7,9.46,42.5]);
  assert.equal(remittanceCase.quoted,'2026-06-23');assert.ok(chart.note.includes('23 June 2026'));
});
test('new articles retain detailed prose, valid links and four accessible figures at input boundaries',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const g of paymentOptionGuides){
    assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800,g.slug);
    assert.ok(g.related.every(s=>slugs.has(s)));
    const d=defaults(g.planning),fields=definitions[g.planning].fields;
    const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
  assert.equal(validInputs('cashDiscount',{...defaults('cashDiscount'),financeMonths:12.5}),false);
  assert.equal(validInputs('remittanceBudget',{...defaults('remittanceBudget'),transferCount:2.5}),false);
});
