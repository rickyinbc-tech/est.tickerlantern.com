import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult } from '../src/planning-models.js';
import { currencyQuoteLedger } from '../src/planning-currency-translation-models.js';
import { planningGuides } from '../src/planning-guides.js';
import { guides } from '../src/research-guides.js';
import { renderResult } from '../src/planning-charts.js';
const kind='currencyQuotePlanning',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('explicit quote units reconcile the original CAD 10000, FCU 8000 and FCU 8640 example',()=>{
 const p=currencyQuoteLedger(defaults(kind));near(p.foreignStart,8000);near(p.foreignEnd,8640);near(p.endQuote,1.15);near(p.endCad,9936);near(p.cadReturn,-.0064);
 near(p.inverseStart,.8);near(p.inverseEnd,1/1.15);near(p.inverseChange,.08695652173913043);
});
test('the preserved three ending quotes reproduce the existing article without a second dividend credit',()=>{
 const d=defaults(kind);for(const [fx,end,ret] of [[-8,9936,-.0064],[0,10800,.08],[8,11664,.1664]]){const p=currencyQuoteLedger({...d,quoteFxChange:fx});near(p.endCad,end);near(p.cadReturn,ret);near(p.endCad/d.quotePrincipal-1,ret);}
});
test('reciprocal quotes use the inverted ratio rather than reversing the percentage sign',()=>{
 const d=defaults(kind);for(const fx of [-50,-8,0,8,50]){const p=currencyQuoteLedger({...d,quoteFxChange:fx}),q0=1/d.quoteStart,q1=1/p.endQuote;near(p.inverseChange,q1/q0-1);near((1+d.quoteAssetReturn/100)*(q0/q1)-1,p.cadReturn);near((1+fx/100)*(1+p.inverseChange),1);}
 assert.notEqual(currencyQuoteLedger(d).inverseChange,.08);
});
test('conditional break-even offsets the asset factor including large asymmetric changes',()=>{
 const d=defaults(kind);for(const r of [-50,-20,0,8,20,50]){const p=currencyQuoteLedger({...d,quoteAssetReturn:r});near((1+r/100)*(1+p.breakEvenChange),1);near(p.foreignEnd*p.breakEvenQuote,d.quotePrincipal);}
 near(currencyQuoteLedger({...d,quoteAssetReturn:-20}).breakEvenChange,.25);near(currencyQuoteLedger({...d,quoteAssetReturn:-50}).breakEvenChange,1);near(currencyQuoteLedger(d).breakEvenQuote,1.25/1.08);
});
test('the ending quote changes CAD translation while the foreign ledger and break-even curve remain fixed',()=>{
 const d=defaults(kind),a=planningResult(kind,d),b=planningResult(kind,{...d,quoteFxChange:8});assert.deepEqual(a.charts[0],b.charts[0]);assert.deepEqual(a.charts[3],b.charts[3]);assert.deepEqual(a.charts[2].series,b.charts[2].series);assert.notEqual(a.metrics[0][1],b.metrics[0][1]);
 const more=currencyQuoteLedger({...d,quotePrincipal:20000}),p=currencyQuoteLedger(d);near(more.endCad,p.endCad*2);near(more.cadReturn,p.cadReturn);near(more.breakEvenChange,p.breakEvenChange);
});
test('the original currency URL occurs once and cross-links the separate repeated-return illustration',()=>{
 const matches=[...planningGuides,...guides].filter(g=>g.slug==='currency-cad-hedging');assert.equal(matches.length,1);assert.equal(matches[0].planning,kind);assert.equal(matches[0].sections.length,8);assert.ok(matches[0].related.includes('foreign-investment-local-return-cad-currency-translation'));
 assert.equal(planningGuides.filter(g=>g.planning==='currencyReturn').length,1);assert.match(matches[0].sections.find(s=>s.id==='worked').html,/9,936/);assert.match(matches[0].sections.find(s=>s.id==='hedging').html,/imperfect offset/);
});
test('all permitted boundaries render four finite accessible charts with correctly labeled ledgers',()=>{
 const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const input of inputs){const result=planningResult(kind,input);finite(result);near(currencyQuoteLedger(input).endCad/input.quotePrincipal-1,currencyQuoteLedger(input).cadReturn);assert.equal(result.charts.length,4);assert.equal(result.charts[0].tableUnit,'FCU');for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
