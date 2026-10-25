import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult,validInputs } from '../src/planning-models.js';
import { householdDebtRows,householdDebtSource } from '../src/planning-debt-income-data.js';
import { personalDebtBudget } from '../src/planning-debt-income-models.js';
import { renderResult,renderFigure } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('official observations have twelve consecutive quarters and retain both source vintages',()=>{
  assert.equal(householdDebtRows.length,12);assert.equal(householdDebtSource.debtReleased,'2026-09-11');assert.equal(householdDebtSource.incomeReleased,'2026-08-28');
  for(const [i,r] of householdDebtRows.entries()){
    const d=new Date(Date.UTC(2023,6+i*3,1)),expected=d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');
    assert.equal(r.refDate,expected);near(r.consumer+r.nonMortgage+r.mortgage,r.debt);assert.ok(Math.abs(r.debt/r.income*100-r.ratio)<.005);
  }
  assert.deepEqual(householdDebtRows.map(r=>r.ratio),[180.69,179.93,179.66,176.77,174.13,174.78,175.35,177.34,177.95,178.69,178.55,176.37]);
});
test('latest debt stock increases while its income ratio declines and borrowing stays distinct',()=>{
  const [a,b]=householdDebtRows.slice(-2);assert.equal(b.debt-a.debt,28432);assert.ok(b.debt>a.debt);assert.ok(b.income/a.income>b.debt/a.debt);near(a.ratio-b.ratio,2.18);
  assert.equal(b.borrowing,29421);assert.notEqual(b.borrowing,b.debt-a.debt);
  assert.equal(b.debt,3280888);assert.equal(b.income,1860216);
});
test('indexed lines each start at 100 without replacing the underlying amounts',()=>{
  const [debt,income]=planningResult('householdDebt').charts[1].series,first=householdDebtRows[0],last=householdDebtRows.at(-1);
  near(debt.rows[0].value,100);near(income.rows[0].value,100);
  near(debt.rows.at(-1).value,100*last.debt/first.debt);near(income.rows.at(-1).value,100*last.income/first.income);
  assert.equal(debt.rows.at(-1).label,'2026 Q2');
});
test('source-unit conversion and data tables preserve the original million-dollar precision',()=>{
  const result=planningResult('householdDebt'),bridge=result.charts[2];near(bridge.rows.reduce((n,r)=>n+r.value,0),3280.888);
  const html=renderFigure(bridge,760);for(const value of ['2,446.879','678.683','155.326','3,280.888'])assert.ok(html.includes(value));
  assert.ok(renderFigure(result.charts[0],760).includes('2023 Q3'));assert.ok(renderFigure(result.charts[0],760).includes('176.37%'));
});
test('personal stock ratio, scheduled-payment ratio and cash budget use distinct numerators',()=>{
  const input=defaults('householdDebt'),p=personalDebtBudget(input);near(p.annualIncome,96000);near(p.stockRatio,4.375);near(p.paymentShare,.35);near(p.reserve,300);near(p.residual,900);
  const more=personalDebtBudget({...input,debtCash:3800});near(more.stockRatio,p.stockRatio);near(more.residual,-100);
  const lessDebt=personalDebtBudget({...input,debtStock:210000});near(lessDebt.stockRatio,p.stockRatio/2);near(lessDebt.residual,p.residual);near(lessDebt.paymentShare,p.paymentShare);
  const waterfall=planningResult('householdDebt').charts[4];near(waterfall.rows.reduce((n,r)=>n+r.value,0),p.residual);
});
test('cash stresses change receipts and payments independently while holding living costs fixed',()=>{
  const result=planningResult('householdDebt'),grid=result.charts[5];near(grid.rows[1].values[0],-700);near(grid.rows[2].values[0],-1260);near(grid.rows[1].values[2],900);near(grid.rows[1].values[3],1700);
  const changed=planningResult('householdDebt',{...defaults('householdDebt'),livingCash:4500});
  for(let r=0;r<4;r++)for(let c=0;c<4;c++)near(changed.charts[5].rows[r].values[c],grid.rows[r].values[c]-500);
});
test('personal controls do not rewrite any official observations or the first three figures',()=>{
  const before=JSON.stringify(householdDebtRows),base=planningResult('householdDebt'),changed=planningResult('householdDebt',{...defaults('householdDebt'),debtStock:0,netIncome:500,debtCash:15000});
  assert.deepEqual(changed.charts.slice(0,3),base.charts.slice(0,3));assert.equal(JSON.stringify(householdDebtRows),before);
  assert.equal(validInputs('householdDebt',{...defaults('householdDebt'),netIncome:0}),false);
});
test('all six figures and exact-value tables remain finite at supported field limits',()=>{
  const kind='householdDebt',d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,6);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,6);assert.equal((html.match(/<caption>/g)||[]).length,6);}}
});

test('explicit line-axis ranges show their limits and reject a domain that hides observations',()=>{
  const chart=planningResult('householdDebt').charts[0],html=renderFigure(chart,300);
  assert.ok(html.includes('Vertical axis 170.00% to 190.00%'));assert.ok(html.includes('170.0%'));assert.ok(html.includes('190.0%'));
  assert.throws(()=>renderFigure({...chart,yMax:1.75},300),/axis must include/);assert.throws(()=>renderFigure({...chart,yMin:1.85,yMax:1.7},300),/axis must include/);
});
