import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, validInputs, planningResult } from '../src/planning-models.js';
import { disabilityCash, currencyBill, currencySaving, annuityCash } from '../src/planning-funding-choices-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('disability cash calendar reconciles waiting, temporary pay and the end of six net benefits',()=>{
  const input=defaults('disabilityIncome'),p=disabilityCash(input);
  assert.deepEqual(p.incomeRows.map(r=>r.benefit),[0,0,0,2200,2200,2200,2200,2200,2200,0,0,0]);
  assert.deepEqual(p.incomeRows.map(r=>r.sick),[2500,2500,0,0,0,0,0,0,0,0,0,0]);
  near(p.sickTotal,5000);near(p.benefitTotal,13200);near(p.required,18800);near(p.extra,8800);near(p.ending,-8800);
  near(p.rows[9].value,200);near(p.rows[10].value,-2800);
  near(disabilityCash({...input,benefit:0}).required,32000);
});
test('disability horizon truncates all receipts and zero waiting starts at the first month end',()=>{
  const input={...defaults('disabilityIncome'),months:2,sickMonths:12,wait:3};
  const p=disabilityCash(input);near(p.sickTotal,5000);near(p.benefitTotal,0);
  near(disabilityCash({...input,wait:0,benefitMonths:1}).benefitTotal,2200);
  near(disabilityCash({...input,wait:0,benefitMonths:0}).benefitTotal,0);
});
test('a later disability cash surplus does not erase the starting cash needed for earlier unpaid months',()=>{
  const input={...defaults('disabilityIncome'),ongoing:0,sick:0,expenses:1000,wait:3,benefit:5000,benefitMonths:3,months:6,upfront:0,reserve:0};
  const p=disabilityCash(input);near(p.required,3000);near(p.ending,9000);
  near(disabilityCash({...input,expenses:0,upfront:1000}).required,1000);
});
test('foreign price, CAD-per-unit translation and fees reconcile without mixing units',()=>{
  const p=currencySaving(defaults('currencyGoal'));
  near(p.bill.foreign,21854.54);near(p.bill.base,30596.356);near(p.bill.charge,611.92712);near(p.bill.total,31233.28312);
  near(p.ending,23836.16017296331);near(p.gap,7397.122947036689);near(p.requiredMonthly,699.59727400553);
  const flat={...defaults('currencyGoal'),foreignCost:10000,foreignInflation:0,fx:1.4};near(currencyBill(flat).total,14305);
  near(currencyBill({...flat,fx:2.8}).total-flat.flat,2*(currencyBill(flat).total-flat.flat));
});
test('foreign-goal required deposits fund the bill under zero, positive and negative CAD return assumptions',()=>{
  for(const rate of [-5,0,2,8])for(const months of [6,36,120]){
    const input={...defaults('currencyGoal'),initial:0,rate,months};const p=currencySaving(input);
    const funded=currencySaving({...input,monthly:p.requiredMonthly});near(funded.ending,p.bill.total);near(funded.gap,0);
  }
  const input={...defaults('currencyGoal'),rate:0};const p=currencySaving(input);near(p.requiredMonthly,(p.bill.total-input.initial)/input.months);
});
test('a zero foreign bill creates no conversion fee, and an already funded goal requires no extra contribution',()=>{
  const zero=currencySaving({...defaults('currencyGoal'),foreignCost:0,flat:500});near(zero.bill.total,0);near(zero.requiredMonthly,0);near(zero.gap,0);
  const funded=currencySaving({...defaults('currencyGoal'),initial:250000});near(funded.requiredMonthly,0);near(funded.gap,0);
});
test('annuity allocation and conditional nominal receipts do not imply a redeemable principal or annual return',()=>{
  const p=annuityCash(defaults('annuityIncome'));near(p.premium,200000);near(p.monthly,1100);near(p.liquid,300000);near(p.payoutRatio,.066);assert.equal(p.receiptMonths,182);
  assert.ok(181*p.monthly<p.premium&&182*p.monthly>=p.premium);near(p.rows.at(-1).receipts,396000);near(p.rows.at(-1).realMonthly,1100/1.02**30);
  const charts=planningResult('annuityIncome').charts;near(charts[3].rows[1].values[2],1.32);
});
test('zero and full annuity allocations preserve liquid-capital reconciliation and meaningful no-premium output',()=>{
  for(const [capital,allocation] of [[0,40],[500000,0],[500000,100]]){
    const input={...defaults('annuityIncome'),capital,allocation},p=annuityCash(input);near(p.premium+p.liquid,capital);
    if(!p.premium){near(p.monthly,0);assert.equal(p.receiptMonths,null);assert.match(renderResult(planningResult('annuityIncome',input)),/No premium allocated/);}
  }
  const p=annuityCash({...defaults('annuityIncome'),inflation:0});assert.ok(p.rows.every(r=>r.realMonthly===p.monthly));
});
test('new insurance calendar inputs require whole months and preserve supported boundary schedules',()=>{
  for(const key of ['sickMonths','benefitMonths','wait']){
    const input={...defaults('disabilityIncome'),[key]:1.5};assert.equal(validInputs('disabilityIncome',input),false);assert.throws(()=>planningResult('disabilityIncome',input));
  }
  assert.equal(validInputs('currencyGoal',{...defaults('currencyGoal'),fx:.0089}),true);
});
test('funding-choice charts remain finite and expose data at every supported field edge',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['disabilityIncome','currencyGoal','annuityIncome']){
    const d=defaults(kind),inputs=[d,...definitions[kind].fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}])];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
