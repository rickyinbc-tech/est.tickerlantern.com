import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {etfTradeCost,reverseEquityPath} from '../src/planning-trading-equity-models.js';
import {tradingEquityGuides} from '../src/planning-trading-equity-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('ETF cost bridge reconciles executed cash and uses half the full quote spread per side',()=>{
 const d=defaults('etfExecution'),p=etfTradeCost(d);
 near(p.ask,25.025);near(p.bid,24.975);near(p.purchase,10015);near(p.sale,9985);near(p.gain,-30);near(p.entrySpreadCost,10);near(p.exitSpreadCost,10);
 for(const entrySpread of [0,20,200])for(const exitSpread of [0,50,200])for(const midMove of [-30,0,30]){
  const x=etfTradeCost({...d,entrySpread,exitSpread,midMove});
  near(x.purchase,d.units*d.midPrice*(1+entrySpread/20000)+d.orders*d.commission);
  near(x.sale,d.units*d.midPrice*(1+midMove/100)*(1-exitSpread/20000)-d.orders*d.commission);
  near(x.gain,x.grossGain-x.entrySpreadCost-x.exitSpreadCost-x.entryCommission-x.exitCommission);
  near(x.cost,x.grossGain-x.gain);near(x.netReturn,x.gain/x.purchase);
 }
});
test('ETF break-even solves cash equality and splitting the same units only changes selected ticket charges',()=>{
 const d=defaults('etfExecution');
 for(const orders of [1,4,24])for(const commission of [0,5,25])for(const entrySpread of [0,20,200]){
  const input={...d,orders,commission,entrySpread},p=etfTradeCost(input);
  near(etfTradeCost({...input,midMove:p.breakEven*100}).gain,0);
  const unsplit=etfTradeCost({...input,orders:1});near(unsplit.gain-p.gain,2*(orders-1)*commission);
  near(unsplit.entrySpreadCost,p.entrySpreadCost);near(unsplit.exitSpreadCost,p.exitSpreadCost);
 }
 const free=etfTradeCost({...d,commission:0,entrySpread:0,exitSpread:0});near(free.breakEven,0);near(free.gain,0);
 const doubled=etfTradeCost({...d,units:800});near(doubled.entrySpreadCost,20);near(doubled.entryCommission,5);
});
test('capitalized-interest loan agrees with independently accumulated opening balance and dated advances',()=>{
 const d=defaults('reverseEquity');
 for(const loanRate of [0,7,15])for(const years of [1,15,30])for(const monthlyDraw of [0,500,3000]){
  const p=reverseEquityPath({...d,loanRate,years,monthlyDraw}),factor=(1+loanRate/100)**(1/12),n=years*12;
  let independent=(d.upfront+d.capitalizedFees)*(1+loanRate/100)**years;
  for(let month=1;month<=n;month++)independent+=monthlyDraw*factor**(n-month);
  near(p.end.balance,independent);near(p.cash,d.upfront+n*monthlyDraw);
  near(p.end.balance,p.cash+d.capitalizedFees+p.interest);
  near(p.end.residual,p.end.home-p.end.saleCosts-p.end.balance);
 }
 const p=reverseEquityPath(d);near(p.end.balance,583202.2685421804);near(p.interest,338202.2685421805);near(p.end.residual,375728.92251376214);
});
test('sale residual preserves losses, financed-fee interest and independent home and loan paths',()=>{
 const d=defaults('reverseEquity'),p=reverseEquityPath(d),flat=reverseEquityPath({...d,homeGrowth:0});
 near(flat.end.home,d.home);near(flat.end.balance,p.end.balance);near(flat.cash,p.cash);
 const noFees=reverseEquityPath({...d,capitalizedFees:0});near(p.end.balance-noFees.end.balance,d.capitalizedFees*(1+d.loanRate/100)**d.years);near(p.cash,noFees.cash);
 const zero=reverseEquityPath({...d,loanRate:0});near(zero.interest,0);near(zero.end.balance,245000);
 const stressed=reverseEquityPath({...d,homeGrowth:-5,loanRate:15});assert.ok(stressed.end.residual<0);near(stressed.end.residual,stressed.end.home*.95-stressed.end.balance);
 const empty=reverseEquityPath({...d,upfront:0,capitalizedFees:0,monthlyDraw:0});near(empty.end.balance,0);near(empty.interest,0);
});
test('new execution and equity guides retain detailed prose, linked sources and four finite accessible figures',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of tradingEquityGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800,g.slug);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields;
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
 for(const key of ['units','orders'])assert.equal(validInputs('etfExecution',{...defaults('etfExecution'),[key]:24.5}),false);
});
