import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {offsetAccountCosts} from '../src/planning-offset-account-models.js';
import {offsetAccountGuides} from '../src/planning-offset-account-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('the offset cost identity holds for every cash, rate and day combination',()=>{
 for(const debt of [0,1000,300000])for(const cash of [0,500,40000,300000,450000])for(const offsetQuote of [0,3,6,12])for(const alternative of [0,4.5,7,12])for(const saving of [0,3,8])for(const days of [1,30,59,365]){
  const i={offsetDebt:debt,offsetCashBalance:cash,offsetQuote,offsetAlternative:alternative,offsetSaving:saving,offsetDays:days,offsetFee:10};
  const p=offsetAccountCosts(i),fraction=days/365;
  near(p.eligible,Math.min(debt,cash));near(p.interestBase,Math.max(0,debt-cash));
  near(p.offsetInterest,p.interestBase*offsetQuote/100*fraction);
  near(p.alternativeInterest,debt*alternative/100*fraction);
  near(p.separateInterest,cash*saving/100*fraction);
  near(p.avoided,p.eligible*offsetQuote/100*fraction);
  near(p.quotePremium,debt*(offsetQuote-alternative)/100*fraction);
  near(p.offsetCost,p.offsetInterest+10);
  near(p.alternativeNetCost,p.alternativeInterest-p.separateInterest);
  near(p.advantage,p.alternativeNetCost-p.offsetCost);
  near(p.advantage,p.avoided-p.quotePremium-p.separateInterest-10);
 }
});

test('default comparison reproduces the published article bridge and fee treatment',()=>{
 const d=defaults('offsetAccount'),p=offsetAccountCosts(d);
 near(p.interestBase,260000);near(p.avoided,197.26027397260273);near(p.quotePremium,123.2876712328767);
 near(p.separateInterest,98.63013698630137);near(p.offsetInterest,1282.191780821918);near(p.alternativeInterest,1356.164383561644);
 near(p.offsetCost,1292.191780821918);near(p.alternativeNetCost,1257.5342465753424);near(p.advantage,-34.65753424657534);
 assert.equal(Number(p.avoided.toFixed(2)),197.26);assert.equal(Number(p.quotePremium.toFixed(2)),123.29);
 assert.equal(Number(p.separateInterest.toFixed(2)),98.63);assert.equal(Number(p.offsetInterest.toFixed(2)),1282.19);
 assert.equal(Number(p.alternativeInterest.toFixed(2)),1356.16);assert.equal(Number(p.advantage.toFixed(2)),-34.66);
 const noFee=offsetAccountCosts({...d,offsetFee:0});near(noFee.advantage,p.advantage+10);
 const longer=offsetAccountCosts({...d,offsetDays:60});
 near(longer.offsetCost,2*p.offsetInterest+10);
 near(longer.advantage,2*(p.avoided-p.quotePremium-p.separateInterest)-10);
 assert.notEqual(Number(longer.advantage.toFixed(2)),Number((2*p.advantage).toFixed(2)));
});

test('equal quotes remove the premium row while forgone savings interest and the fee remain',()=>{
 const d=defaults('offsetAccount'),p=offsetAccountCosts({...d,offsetQuote:5.5,offsetAlternative:5.5});
 near(p.quotePremium,0);
 near(p.advantage,d.offsetCashBalance*(5.5-d.offsetSaving)/100*d.offsetDays/365-d.offsetFee);
 assert.ok(p.advantage>0);
 const free={...d,offsetQuote:5.5,offsetAlternative:5.5,offsetFee:0};
 assert.ok(offsetAccountCosts(free).advantage>0);
 assert.ok(offsetAccountCosts({...free,offsetSaving:8}).advantage<0);
 assert.ok(offsetAccountCosts({...d,offsetQuote:5.5,offsetAlternative:5.5,offsetFee:200}).advantage<0);
 const cheaperQuote=offsetAccountCosts({...d,offsetQuote:4,offsetAlternative:6});
 assert.ok(cheaperQuote.quotePremium<0);assert.ok(cheaperQuote.advantage>0);
});

test('cash sensitivity peaks at the gross principal and never credits negative loan interest',()=>{
 const d=defaults('offsetAccount');
 const below=[0,10000,40000,150000,299999].map(cash=>offsetAccountCosts(d,cash));
 for(let i=1;i<below.length;i++)assert.ok(below[i].advantage>below[i-1].advantage);
 const at=offsetAccountCosts(d,d.offsetDebt),above=[300001,400000,450000].map(cash=>offsetAccountCosts(d,cash));
 for(const row of [at,...above])near(row.interestBase,0);
 assert.ok(above[0].advantage<at.advantage);assert.ok(above[1].advantage<above[0].advantage);
 near(at.advantage,d.offsetDebt*(d.offsetAlternative-d.offsetSaving)/100*d.offsetDays/365-d.offsetFee);
 const huge=offsetAccountCosts(d,1000000);assert.ok(huge.advantage<at.advantage);
 assert.ok([d.offsetDebt,d.offsetCashBalance,at.interestBase].every(Number.isFinite));
});

test('the quote grid recomputes each cell independently and leaves likelihood unstated',()=>{
 const d=defaults('offsetAccount'),result=planningResult('offsetAccount',d),grid=result.charts[3];
 assert.equal(grid.type,'heatmap');assert.equal(grid.signed,true);assert.equal(grid.rows.length,4);
 assert.deepEqual(grid.columns,['4% alt','5% alt','6% alt','7% alt']);
 grid.rows.forEach((row,r)=>row.values.forEach((value,c)=>{
  near(value,offsetAccountCosts(d,d.offsetCashBalance,4+r,4+c).advantage);
 }));
 grid.rows.forEach(row=>row.values.forEach((value,c)=>{if(c)assert.ok(value>row.values[c-1]);}));
 for(let c=0;c<4;c++)for(let r=1;r<4;r++)assert.ok(grid.rows[r].values[c]<grid.rows[r-1].values[c]);
 const mixed=planningResult('offsetAccount',{...d,offsetSaving:5}).charts[3];
 assert.ok(mixed.rows[0].values[0]<0);assert.ok(mixed.rows[3].values[3]>0);
 assert.match(grid.note,/likelihood|probability/i);
});

test('whole-day and rate inputs stay within the supported ranges',()=>{
 const d=defaults('offsetAccount');
 for(const key of ['offsetDays'])for(const value of [0,30.5,366,NaN,Infinity])assert.equal(validInputs('offsetAccount',{...d,[key]:value}),false);
 for(const value of [1,30,365])assert.equal(validInputs('offsetAccount',{...d,offsetDays:value}),true);
 assert.equal(validInputs('offsetAccount',{...d,offsetQuote:-1}),false);
 assert.equal(validInputs('offsetAccount',{...d,offsetFee:2001}),false);
 assert.ok(definitions.offsetAccount);
});

test('the guide keeps six sections, live companions and four finite accessible charts',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 assert.equal(offsetAccountGuides.length,1);
 for(const g of offsetAccountGuides){
  assert.equal(g.slug,'linked-offset-cash-loan-rate-fee-comparison');assert.equal(g.planning,'offsetAccount');
  assert.equal(g.sections.length,6);assert.ok(g.related.every(s=>slugs.has(s)));
  assert.ok(g.sources.length>=2&&g.sources.every(s=>s.url.startsWith('https://')&&/reviewed 25 October 2026/i.test(s.note)));
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=900);
  assert.match(g.sections.map(s=>s.html).join(' '),/CAD 34\.66 more/);
  const d=defaults(g.planning),fields=definitions[g.planning].fields;
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){
   assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);
   assert.equal(result.charts.length,4);
   for(const width of [300,900]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
 }
});
