import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {annualBondPrice,annualBondDuration,annualBondCashflows,bondPricingSnapshot} from '../src/planning-bond-pricing-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {guides} from '../src/research-guides.js';
const kind='bondPricingPlanning',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('specified annual payments price at par when coupon equals the annual required yield',()=>{
 const d=defaults(kind),p=bondPricingSnapshot(d),cash=annualBondCashflows(d.pricingFace,d.pricingCoupon,d.pricingYears);near(p.price,1000);assert.equal(cash.length,10);assert.equal(cash[0].value,50);assert.equal(cash.at(-1).value,1050);near(cash.reduce((n,r)=>n+r.principal,0),1000);
 near(p.macaulay,8.107821675644);near(p.modified,7.721734929185);near(p.repriced,859.528369181348);near(p.linearPrice,845.565301416304);
});
test('direct pricing agrees with closed-form and backward-recursive values at all reviewed boundaries',()=>{
 for(const face of [100,1000,100000])for(const coupon of [0,5,15])for(const yieldRate of [0,5,15])for(const years of [1,2,10,30]){
  const c=face*coupon/100,y=yieldRate/100,p=annualBondPrice(face,coupon,yieldRate,years),closed=y===0?face+c*years:c*(1-(1+y)**(-years))/y+face*(1+y)**(-years);let recursive=face;for(let t=0;t<years;t++)recursive=(recursive+c)/(1+y);near(p,closed);near(p,recursive);
  const d=annualBondDuration(face,coupon,yieldRate,years);near(d.modified,d.macaulay/(1+y));assert.ok(d.macaulay<=years+1e-8);if(coupon===0){near(d.macaulay,years);near(d.modified,years/(1+y));}
 }
});
test('modified duration matches normalized price sensitivity and exact convex prices stay above the tangent',()=>{
 const d=defaults(kind),p=bondPricingSnapshot(d),h=.00001,up=annualBondPrice(d.pricingFace,d.pricingCoupon,d.pricingYield+h*100,d.pricingYears),down=annualBondPrice(d.pricingFace,d.pricingCoupon,d.pricingYield-h*100,d.pricingYears);near(-(up-down)/(2*h*p.price),p.modified);
 for(const exitYield of [0,2,5,7,15]){const q=bondPricingSnapshot({...d,pricingExitYield:exitYield});assert.ok(q.repriced>=q.linearPrice-1e-8);}
 const large=bondPricingSnapshot({...d,pricingCoupon:0,pricingYield:0,pricingExitYield:15,pricingYears:30});assert.ok(large.linearPrice<0);assert.ok(large.repriced>0);
});
test('the one-year return removes the paid coupon date and uses nine remaining years',()=>{
 const d=defaults(kind),p=bondPricingSnapshot(d);near(p.couponCash,50);near(p.saleValue,869.695355024042);near(p.redemption,0);near(p.cashAfterOneYear,919.695355024042);near(p.oneYearReturn,-.080304644975958);
 assert.notEqual(p.exitValue,p.repriced);const bridge=planningResult(kind).charts[3];near(bridge.rows.reduce((n,r)=>n+r.value,0),p.cashAfterOneYear);
});
test('maturity in year one pays principal once and leaves no bond for sale',()=>{
 const d={...defaults(kind),pricingYears:1},a=bondPricingSnapshot(d),b=bondPricingSnapshot({...d,pricingExitYield:0});near(a.saleValue,0);near(a.redemption,1000);near(a.cashAfterOneYear,1050);near(a.cashAfterOneYear,b.cashAfterOneYear);near(a.oneYearReturn,d.pricingYield/100);near(annualBondPrice(1000,5,7,0),0);
 const chart=planningResult(kind,d).charts[3];assert.match(chart.rows[1].label,/Redemption/);near(chart.rows.reduce((n,r)=>n+r.value,0),1050);
});
test('unchanged yield preserves the one-year yield identity across premium, discount and zero-coupon prices',()=>{
 const d=defaults(kind);for(const pricingCoupon of [0,5,15])for(const pricingYield of [0,5,15])for(const pricingYears of [1,2,10,30]){const p=bondPricingSnapshot({...d,pricingCoupon,pricingYield,pricingExitYield:pricingYield,pricingYears});near(p.oneYearReturn,pricingYield/100);}
});
test('coupon/maturity grid is an immediate reprice and zero yield change makes every cell zero',()=>{
 const d=defaults(kind),flat=planningResult(kind,{...d,pricingExitYield:d.pricingYield});assert.ok(flat.charts[2].rows.every(r=>r.values.every(v=>Math.abs(v)<1e-12)));
 const result=planningResult(kind);near(result.charts[2].rows[2].values[2],bondPricingSnapshot(d).repriced/bondPricingSnapshot(d).price-1);assert.deepEqual(result.charts[4],planningResult(kind,{...d,pricingExitYield:15}).charts[4]);
});
test('the original URL and distinct cash-goal guide remain unique and linked',()=>{
 const matches=[...planningGuides,...guides].filter(g=>g.slug==='bond-duration-yield-total-return');assert.equal(matches.length,1);assert.equal(matches[0].planning,kind);assert.equal(matches[0].sections.length,9);assert.ok(matches[0].related.includes('bond-maturity-cash-goal-interest-rate-risk'));
 for(const id of ['definitions','duration','scenario','maturity','other-risks','review'])assert.ok(matches[0].sections.some(s=>s.id===id));assert.match(matches[0].sections.find(s=>s.id==='scenario').html,/not the calculated duration/);
});
test('all allowed input boundaries render five finite accessible chart/table pairs',()=>{
 const d=defaults(kind),fields=definitions[kind].fields;assert.equal(validInputs(kind,{...d,pricingYears:1.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const r=planningResult(kind,input);assert.equal(r.charts.length,5);for(const width of [300,760]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
});
