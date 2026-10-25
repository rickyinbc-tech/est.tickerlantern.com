import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {constructionQuoteBudget} from '../src/planning-construction-quote-models.js';
import {constructionQuoteSource} from '../src/planning-construction-quote-data.js';
import {renderResult} from '../src/planning-charts.js';
const kind='constructionQuote',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('quote, known outside costs and additional reserve reconcile independently of earlier estimates',()=>{
  const input=defaults(kind),p=constructionQuoteBudget(input);
  near(p.earlier,80000);near(p.quote,88500);near(p.change,8500);near(p.changeRate,.10625);
  near(p.reserve,8850);near(p.committed,102350);near(p.residual,-2350);near(p.extra,2350);
  near(p.committed+p.residual,input.availableCash);
  const alternative=constructionQuoteBudget({...input,budgetMaterials:0,budgetLabour:0,budgetOther:0});
  assert.equal(alternative.changeRate,null);near(alternative.committed,p.committed);near(alternative.extra,p.extra);
});
test('a changed quote recalculates its percentage reserve, while outside costs stay separate',()=>{
  const input=defaults(kind),p=constructionQuoteBudget(input),up=constructionQuoteBudget(input,1.1,10);
  near(up.quote,97350);near(up.reserve,9735);near(up.committed,112085);near(up.extra,12085);
  near(up.extra-p.extra,(up.quote-p.quote)*1.1);
  const outside=constructionQuoteBudget({...input,outsideCosts:15000});near(outside.reserve,p.reserve);near(outside.extra-p.extra,10000);
  const noReserve=constructionQuoteBudget(input,1,0);near(noReserve.reserve,0);near(noReserve.residual,6500);near(noReserve.extra,0);
  const funded=constructionQuoteBudget({...input,availableCash:p.committed});near(funded.residual,0);near(funded.extra,0);
});
test('official historical changes are signed, fixed and isolated from all project calculations',()=>{
  assert.deepEqual(constructionQuoteSource.rows.map(r=>r.value),[.005,.026,.025,.021,-.001,-.002,-.008]);
  const a=planningResult(kind),b=planningResult(kind,{...defaults(kind),quoteMaterials:500000,contingency:40});
  assert.deepEqual(a.charts[0],b.charts[0]);assert.ok(a.charts[0].source);assert.equal(a.charts[0].type,'signedbar');
  assert.ok(a.charts.slice(1).every(c=>!c.source));
  const matrix=a.charts.at(-1);near(matrix.rows[2].values[1],2350);near(matrix.rows[2].values[2],12085);
});
test('zero quotes, field limits and aggregate extremes produce finite, inspectable charts',()=>{
  const base=defaults(kind),fields=definitions[kind].fields,cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
  for(const input of cases){assert.ok(validInputs(kind,input));const result=planningResult(kind,input);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
  assert.equal(validInputs(kind,{...base,contingency:41}),false);
});
