import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {translatedReturn,currencyValue} from '../src/planning-currency-return-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);

test('a local gain and an opposite quote change combine through multiplication',()=>{
 near(translatedReturn(10,-10),-.01);near(currencyValue(10000,10,-10,1),9900);
 const openingQuote=1.35,endingQuote=1.215,foreignAmount=10000/openingQuote;
 near(foreignAmount*1.1*endingQuote,currencyValue(10000,10,-10,1));
 near((1/endingQuote)/(1/openingQuote)-1,1/.9-1);
 assert.notEqual((1/endingQuote)/(1/openingQuote)-1,.1);
});
test('the expanded one-year bridge reconciles all sign combinations including the interaction',()=>{
 const d=defaults('currencyReturn');
 for(const assetReturn of [-30,0,10,30])for(const fxChange of [-30,0,10,30]){
  const input={...d,assetReturn,fxChange},r=planningResult('currencyReturn',input);
  near(r.charts[1].rows.reduce((sum,row)=>sum+row.value,0),10000*(1+assetReturn/100)*(1+fxChange/100));
  near(r.charts[1].rows[3].value,10000*assetReturn/100*fxChange/100);
 }
});
test('the reciprocal break-even quote change gives zero CAD return',()=>{
 for(const asset of [-20,0,10,20])near(translatedReturn(asset,(1/(1+asset/100)-1)*100),0);
 assert.ok(translatedReturn(10,-10)<0);
});
test('multi-year values repeat the same paired factors without new deposits',()=>{
 const d=defaults('currencyReturn'),r=planningResult('currencyReturn');
 let expected=d.initial;for(let year=0;year<d.years;year++)expected*=1.1*.9;
 near(r.metrics[2][1],expected);near(r.metrics[2][1],9509.900499);near(r.charts[0].series[1].rows.at(-1).value,16105.1);
 const flat=planningResult('currencyReturn',{...d,fxChange:0});assert.deepEqual(flat.charts[0].series[0].rows,flat.charts[0].series[1].rows);
 const one=planningResult('currencyReturn',{...d,years:1});assert.deepEqual(one.charts[1],r.charts[1]);assert.deepEqual(one.charts[2],r.charts[2]);assert.deepEqual(one.charts[3],r.charts[3]);
});
test('the fixed one-year matrix has signed precise labels and is independent of the selected path',()=>{
 const r=planningResult('currencyReturn');
 for(let row=0;row<4;row++)for(let col=0;col<4;col++)near(r.charts[3].rows[row].values[col],(1+[-20,0,10,20][row]/100)*(1+[-20,-10,0,10][col]/100)-1);
 assert.match(renderResult(r,300),/>-1.00%<\/text>/);assert.match(r.note,/not the result of a modeled hedge/);
});
test('whole years and all input boundaries produce four finite chart/table pairs',()=>{
 const d=defaults('currencyReturn'),fields=definitions.currencyReturn.fields;
 assert.equal(validInputs('currencyReturn',{...d,years:5.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const result=planningResult('currencyReturn',input);assert.equal(result.charts.length,4);
  for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 const zero=planningResult('currencyReturn',{...d,initial:0});assert.equal(zero.metrics[2][1],0);
});
