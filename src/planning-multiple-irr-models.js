export const multipleIrrDefinitions={multipleIrr:{title:'Keep the later obligation in the cash flows before solving for a return',fields:[
 ['irrInitial','Cash paid now at time zero (CAD)',10000,1000,200000,1000],
 ['irrReceipt','Cash received at the end of year one (CAD)',23000,0,400000,1000],
 ['irrFinal','Required cash payment at the end of year two (CAD)',13200,0,400000,100],
 ['irrDiscount','Effective annual discount assumption for NPV (%)',15,0,50,1]
]}};
export const twoPeriodNpv=(i,rate)=>-i.irrInitial+i.irrReceipt/(1+rate)-i.irrFinal/(1+rate)**2;
export function nonnegativeTwoPeriodIrr(i){
 const a=i.irrInitial,b=i.irrReceipt,c=i.irrFinal;
 let discriminant=b*b-4*a*c;
 const tolerance=32*Number.EPSILON*Math.max(1,b*b,4*a*c);
 if(discriminant < -tolerance)return [];
 if(Math.abs(discriminant)<=tolerance)discriminant=0;
 const high=(b+Math.sqrt(discriminant))/(2*a);
 if(!(high>0))return [];
 // Product of growth-factor roots is c/a; this avoids subtractive cancellation.
 const growth=[high,c/(a*high)].filter(x=>Number.isFinite(x)&&x>=1-1e-12);
 const rates=growth.map(x=>Math.max(0,x-1)).sort((x,y)=>x-y);
 return rates.filter((x,j)=>!j||Math.abs(x-rates[j-1])>1e-9*Math.max(1,Math.abs(x)));
}
export function multipleIrrResult(kind,i){
 if(kind!=='multipleIrr')throw Error('Unknown multiple-IRR topic.');
 const rate=i.irrDiscount/100,npv=twoPeriodNpv(i,rate),roots=nonnegativeTwoPeriodIrr(i),profileEnd=Math.max(30,i.irrDiscount);
 const profile=Array.from({length:121},(_,j)=>{const x=profileEnd*j/120;return {x,value:twoPeriodNpv(i,x/100)};});
 const rootText=roots.length?roots.map(r=>(r*100).toFixed(2)+'%').join(' and '):'None at or above 0%';
 return {metrics:[['NPV at the selected annual discount assumption',npv,'money'],['Distinct nonnegative annual IRRs',null,'percent',rootText],['Undiscounted sum of all three cash flows',-i.irrInitial+i.irrReceipt-i.irrFinal,'money']],note:'Original three-date project illustration: an outflow immediately, an inflow exactly one year later, and a required outflow exactly two years later. Cash flows are independently entered nominal CAD and contain no taxes, financing, interim deposits, bank balances or additional terminal value. The NPV input is an effective annual discount assumption, not a promised yield or an automatically suitable hurdle rate. IRRs are mathematical roots of NPV = 0. The solver lists distinct finite roots at or above 0% only; any negative roots are outside the stated domain. A repeated root is listed once. The profile shows 0% to the greater of 30% and the selected discount input, so an admissible root beyond that range can be listed in the metric without appearing in the plot. No reinvestment or final household wealth is calculated. A later obligation remains payable regardless of how much of the earlier receipt has been spent.',charts:[
  {id:'multiple-irr-cash-dates',type:'signedbar',title:'The final payment reverses the cash-flow sign a second time',unit:'money',rows:[
   {label:'Time 0 · initial payment',value:-i.irrInitial},
   {label:'End of year 1 · receipt',value:i.irrReceipt},
   {label:'End of year 2 · required payment',value:-i.irrFinal}
  ],note:'Signs are from the project participant’s perspective. The last payment is a separate future obligation. It is neither omitted nor subtracted from the year-one receipt as though both occurred at the same time. No probability is assigned to the entered amounts.'},
  {id:'multiple-irr-npv-profile',type:'line',title:'A changing-sign cash flow can cross zero more than once',unit:'money',xLabel:'Annual discount assumption (%)',xTicks:[{value:0,label:'0%'},{value:profileEnd/2,label:profileEnd/2+'%'},{value:profileEnd,label:profileEnd+'%'}],series:[{name:'NPV of all three cash flows',rows:profile}],note:'The curve evaluates NPV directly at 121 equally spaced rate assumptions; the IRR metric comes from an independent quadratic solution, not from counting sampled sign crossings. A tangent zero can be a repeated mathematical root without crossing the axis. Rates beyond the displayed range are not shown. The horizontal zero reference is a valuation threshold, not a bank balance.'},
  {id:'multiple-irr-present-value',type:'waterfall',title:'Discount each future flow from its own date before adding the values',unit:'money',totalLabel:'NPV at the selected assumption',rows:[
   {label:'Immediate cash payment',value:-i.irrInitial},
   {label:'Year-one receipt · present value',value:i.irrReceipt/(1+rate)},
   {label:'Year-two payment · present value',value:-i.irrFinal/(1+rate)**2}
  ],note:'Present values are expressed at time zero. An immediate payment is not discounted. The later obligation receives two annual discount factors. These valuation steps are not cash supplied to pay the obligation and do not establish whether the project can be funded.'}
 ]};
}
