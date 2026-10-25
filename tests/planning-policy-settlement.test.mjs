import test from 'node:test';
import assert from 'node:assert/strict';
import {policyQuoteIssue,policySettlementLedger} from '../src/planning-policy-settlement-models.js';
import {policySettlementGuides} from '../src/planning-policy-settlement-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {defaults,validInputs,planningResult} from '../src/planning-models.js';
import {renderFigure} from '../src/planning-charts.js';
const base=defaults('policySettlement');

test('the dated quotation example deducts one existing 20000 loan from each alternative',()=>{
  const p=policySettlementLedger(base);assert.deepEqual(p,{surrender:30000,conditionalDeath:380000,loan:20000});
  const result=planningResult('policySettlement',base);
  assert.deepEqual(result.charts[0].rows.map(r=>r.values),[[30000,0],[0,380000]]);
  assert.equal(result.charts[1].rows.reduce((s,r)=>s+r.value,0),30000);
  assert.equal(result.metrics[0][1],30000);assert.equal(result.metrics[1][1],380000);
});
test('quote-basis validation rejects an oversized loan or surrender quote instead of silently clamping',()=>{
  const badLoan={...base,policyLoanBalance:60000};
  assert.equal(validInputs('policySettlement',badLoan),false);assert.throws(()=>planningResult('policySettlement',badLoan));
  assert.deepEqual(policyQuoteIssue(badLoan).fields,['policyLoanBalance','policySurrenderQuote']);assert.match(policyQuoteIssue(badLoan).message,/loan must not exceed/);assert.throws(()=>policySettlementLedger(badLoan));
  const badCash={...base,policySurrenderQuote:500000};
  assert.equal(validInputs('policySettlement',badCash),false);assert.throws(()=>planningResult('policySettlement',badCash));
  assert.deepEqual(policyQuoteIssue(badCash).fields,['policySurrenderQuote','policyDeathQuote']);assert.match(policyQuoteIssue(badCash).message,/surrender quote must not exceed/);
  assert.equal(policyQuoteIssue(base),null);
});
test('an accepted loan change reduces each alternative by the same amount without creating new cash',()=>{
  const a=policySettlementLedger({...base,policyLoanBalance:10000}),b=policySettlementLedger({...base,policyLoanBalance:30000});
  assert.deepEqual(a,{surrender:40000,conditionalDeath:390000,loan:10000});assert.deepEqual(b,{surrender:20000,conditionalDeath:370000,loan:30000});
  assert.equal(a.surrender-b.surrender,20000);assert.equal(a.conditionalDeath-b.conditionalDeath,20000);
  assert.equal(a.conditionalDeath-a.surrender,base.policyDeathQuote-base.policySurrenderQuote);
});
test('the sensitivity includes the selected loan and valid endpoints, and is not a calendar',()=>{
  const result=planningResult('policySettlement',{...base,policyLoanBalance:23456});const chart=result.charts[2];
  assert.match(chart.xLabel,/loan/);assert.ok(chart.series[0].rows.some(r=>r.x===23456&&r.value===26544));
  assert.deepEqual(chart.series[0].rows[0],{x:0,value:50000});assert.deepEqual(chart.series[0].rows.at(-1),{x:50000,value:0});
  assert.deepEqual(chart.series[1].rows.at(-1),{x:50000,value:350000});
  assert.ok(chart.series.every(s=>s.rows.every(r=>r.value>=0&&r.x>=0&&r.x<=50000)));
});
test('matrix alternatives replace current cash and loan inputs and mark unsupported quotes unavailable',()=>{
  const a=planningResult('policySettlement',base),b=planningResult('policySettlement',{...base,policySurrenderQuote:100000,policyLoanBalance:50000});
  assert.deepEqual(a.charts[3],b.charts[3]);
  assert.deepEqual(a.charts[3].rows.map(r=>r.values),[[25000,50000,100000,200000],[18750,37500,75000,150000],[12500,25000,50000,100000],[6250,12500,25000,50000]]);
  const small=planningResult('policySettlement',{policyDeathQuote:40000,policySurrenderQuote:10000,policyLoanBalance:5000});
  assert.deepEqual(small.charts[3].rows[0].values,[25000,null,null,null]);assert.match(renderFigure(small.charts[3],300),/N\/A/);
});
test('zero and boundary arithmetic remains finite without implying a valid actual policy or approved loan',()=>{
  for(const input of [{policyDeathQuote:0,policySurrenderQuote:0,policyLoanBalance:0},{...base,policyLoanBalance:50000},{policyDeathQuote:2000000,policySurrenderQuote:1000000,policyLoanBalance:1000000}]){
    assert.equal(validInputs('policySettlement',input),true);const result=planningResult('policySettlement',input);
    for(const c of result.charts)for(const width of [300,354,760]){const html=renderFigure(c,width);assert.match(html,/role="img"/);assert.match(html,/<table/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);}
  }
  const zero=planningResult('policySettlement',{policyDeathQuote:0,policySurrenderQuote:0,policyLoanBalance:0});assert.ok(zero.charts[3].rows.every(r=>r.values.every(v=>v===null)));
});
test('the optional validation hook preserves existing range and whole-number validation on other topics',()=>{
  assert.equal(validInputs('savings',defaults('savings')),true);
  assert.equal(validInputs('disabilityOffset',{...defaults('disabilityOffset'),coordRetroMonths:1.5}),false);
  assert.equal(validInputs('charitableStatistics',{donationTaxYear:2024}),false);
  for(const change of [{policyLoanBalance:-1},{policyDeathQuote:2000001},{policySurrenderQuote:NaN}])assert.throws(()=>planningResult('policySettlement',{...base,...change}));
  assert.equal(policyQuoteIssue({...base,policyLoanBalance:NaN}),null,'Scalar invalidity remains the existing range validator’s responsibility');
});
test('four chart types label before-tax hypothetical amounts rather than official or predicted policy data',()=>{
  const result=planningResult('policySettlement',base);assert.equal(new Set(result.charts.map(c=>c.type)).size,4);
  for(const c of result.charts){const html=renderFigure(c,300);assert.match(html,/Hypothetical scenario/);assert.match(html,/CAD, before tax/);assert.doesNotMatch(html,/Official statistics/);}
  assert.match(result.note,/not added or present-valued/);assert.match(result.note,/no new advance is received/);
});
test('the detailed English guide explains alternative events, quote basis and existing debt without recommending surrender',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const guide of policySettlementGuides){assert.ok(slugs.has(guide.slug));assert.equal(guide.sections.length,6);assert.ok(guide.related.every(s=>slugs.has(s)));
    const prose=guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ');assert.ok(prose.trim().split(/\s+/).length>=850);
    assert.match(prose,/CAD 380,000/);assert.match(prose,/CAD 410,000/);assert.match(prose,/already after the loan/);assert.match(prose,/does not forecast a future date/);
  }
});
