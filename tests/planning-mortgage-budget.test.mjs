import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult } from '../src/planning-models.js';
import { mortgageRatioReference, mortgagePaymentCapacity, mortgageBudget } from '../src/planning-mortgage-budget-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('ratio numerators use qualifying P&I and half the condo fee against gross monthly income',()=>{
  const p=mortgageBudget(defaults('mortgageRatios'));near(p.grossMonthly,10000);near(p.assessedOther,650);near(p.assessedHousing,3850);near(p.gds,.385);near(p.tds,.435);
  near(p.actualHousing,3700);near(p.remainder,50);near(p.capacity,3250);
});
test('assessed debt and actual repayments change their own calculation independently',()=>{
  const d=defaults('mortgageRatios'),base=mortgageBudget(d),assessment=mortgageBudget({...d,qualDebt:1000}),cash=mortgageBudget({...d,cashDebt:1000});
  near(assessment.gds,base.gds);near(assessment.tds,.485);near(assessment.remainder,base.remainder);near(assessment.capacity,2750);
  near(cash.gds,base.gds);near(cash.tds,base.tds);near(cash.remainder,-450);near(cash.capacity,base.capacity);
  const actualPI=mortgageBudget({...d,actualPI:3500});near(actualPI.gds,base.gds);near(actualPI.remainder,-950);
});
test('net-income changes do not change gross ratios and full condo costs stay in the cash budget',()=>{
  const d=defaults('mortgageRatios'),base=mortgageBudget(d),net=mortgageBudget({...d,netMonthly:6500}),condo=mortgageBudget({...d,condo:d.condo+200});
  near(net.gds,base.gds);near(net.tds,base.tds);near(net.remainder,-950);
  near(condo.assessedHousing-base.assessedHousing,100);near(condo.actualHousing-base.actualHousing,200);near(condo.remainder,base.remainder-200);
  const gross=mortgageBudget({...d,grossAnnual:144000});near(gross.gds,3850/12000);near(gross.tds,4350/12000);near(gross.remainder,base.remainder);
});
test('payment capacity satisfies the tighter independently calculated ratio constraint or floors at zero',()=>{
  const d=defaults('mortgageRatios');
  for(const grossAnnual of [0,12000,60000,120000,240000,500000]){
    const other=d.propertyTax+d.heat+d.condo/2,expected=Math.max(0,Math.min(grossAnnual*.39/12-other,grossAnnual*.44/12-other-d.qualDebt)),actual=mortgagePaymentCapacity(d,grossAnnual);
    near(actual,expected);
    if(actual>0){assert.ok((actual+other)/(grossAnnual/12)<=.39+1e-10);assert.ok((actual+other+d.qualDebt)/(grossAnnual/12)<=.44+1e-10);}
  }
  near(mortgagePaymentCapacity({...d,qualDebt:10000}),0);
});
test('cash waterfall reconciles every full bill while official comparison percentages remain fixed',()=>{
  const d=defaults('mortgageRatios'),base=planningResult('mortgageRatios'),edited=planningResult('mortgageRatios',{...d,grossAnnual:80000,netMonthly:5000,condo:1000});
  near(base.charts[1].rows.reduce((sum,r)=>sum+r.value,0),50);
  assert.equal(mortgageRatioReference.reviewed,'2026-10-25');
  for(const r of [base,edited]){near(r.charts[0].rows[0].values[1],.39);near(r.charts[0].rows[1].values[1],.44);}
  assert.notEqual(base.charts[0].rows[0].values[0],edited.charts[0].rows[0].values[0]);
});
test('all control boundaries retain four finite charts and accessible data-table counterparts',()=>{
  const d=defaults('mortgageRatios'),fields=definitions.mortgageRatios.fields;
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const input of inputs){const result=planningResult('mortgageRatios',input);finite(result);assert.equal(result.charts.length,4);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
