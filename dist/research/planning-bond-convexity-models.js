export const bondConvexityDefinitions={bondConvexity:{title:'Compare exact repricing with local duration and convexity estimates',fields:[
  ['convexFace','Face amount of the hypothetical bond (CAD)',100000,100,1000000,1000],
  ['convexCoupon','Fixed annual coupon rate on face amount (%)',5,0,12,.25],
  ['convexYears','Whole years remaining, with annual payments',10,1,30,1],
  ['convexBaseYield','Starting annual effective yield to maturity (%)',5,0,12,.25],
  ['convexShock','Instantaneous yield change (percentage points)',2,-3,3,.25]
]}};
export function optionFreeAnnualPrice(face,coupon,years,yieldPercent){
  const factor=1+yieldPercent/100;let price=0;
  for(let t=1;t<=years;t++)price+=(face*coupon/100+(t===years?face:0))/factor**t;
  return price;
}
export function annualBondSensitivities(input,years=input.convexYears){
  const face=input.convexFace,coupon=face*input.convexCoupon/100,factor=1+input.convexBaseYield/100;
  let price=0,first=0,second=0;
  for(let t=1;t<=years;t++){
    const cf=coupon+(t===years?face:0);price+=cf/factor**t;first+=t*cf/factor**(t+1);second+=t*(t+1)*cf/factor**(t+2);
  }
  return {price,duration:first/price,convexity:second/price};
}
export function convexityComparison(input,shock=input.convexShock,years=input.convexYears){
  const p=annualBondSensitivities(input,years),dy=shock/100,linearChange=-p.price*p.duration*dy,convexityChange=.5*p.price*p.convexity*dy**2;
  const exact=optionFreeAnnualPrice(input.convexFace,input.convexCoupon,years,input.convexBaseYield+shock),linear=p.price+linearChange,quadratic=linear+convexityChange;
  return {...p,exact,linear,quadratic,linearChange,convexityChange,residual:exact-quadratic,linearError:linear-exact,quadraticError:quadratic-exact};
}
export function bondConvexityResult(kind,input){
  if(kind!=='bondConvexity')throw Error('Unknown bond-convexity topic.');
  const p=convexityComparison(input),moves=Array.from({length:61},(_,i)=>-3+i*.1);
  return {metrics:[['Exact value at the selected hypothetical new yield',p.exact,'money'],['Duration-only estimate minus exact value',p.linearError,'money'],['Duration-plus-convexity estimate minus exact value',p.quadraticError,'money']],note:`Original annual-pay, option-free fixed-coupon bond calculation at a coupon-date valuation point, with all remaining contractual payments assumed to be made in full. Starting modified duration is ${p.duration.toFixed(5)} and annual convexity is ${p.convexity.toFixed(5)}, calculated from derivatives with respect to the annual yield written as a fraction. Yield moves are entered in percentage points and divided by 100 in the formulas. Every shock is instantaneous: no time passes, no coupon is received and remaining maturity is unchanged. Exact means exact within this single-yield discounted-cash-flow model, not an observed execution price. No default, embedded option, spread decomposition, non-parallel curve move, tax, transaction fee, bid–ask spread or coupon reinvestment is modeled. Negative resulting yields are mathematical stresses, not available quotes.`,charts:[
    {id:'bond-convexity-price-curves',type:'line',title:'The exact price-yield curve bends away from the duration tangent',unit:'money',xLabel:'Yield change (pp)',xMin:-3,xTicks:[-3,0,3].map(value=>({value,label:(value>0?'+':'')+value+' pp'})),series:[{name:'Exact model value: discount every remaining cash flow',rows:moves.map(x=>({x,value:convexityComparison(input,x).exact}))},{name:'Duration-only local estimate',dash:true,rows:moves.map(x=>({x,value:convexityComparison(input,x).linear}))},{name:'Duration plus convexity local estimate',rows:moves.map(x=>({x,value:convexityComparison(input,x).quadratic}))}],note:'The horizontal axis changes the bond’s own annual effective yield around the selected starting yield, from −3 to +3 percentage points. Face amount, coupon and remaining maturity stay fixed. All three curves match at a zero move. The straight estimate uses starting modified duration; the curved estimate also retains starting convexity. Neither estimate updates those sensitivities at each plotted yield.'},
    {id:'bond-convexity-selected-change',type:'signedbar',title:'Compare the selected price changes using the same starting value',unit:'percent',unitLabel:'Value change / initial model price · instantaneous repricing only',rows:[{label:'Exact discounted-cash-flow price change',value:p.exact/p.price-1},{label:'Duration-only estimated price change',value:p.linear/p.price-1},{label:'Duration plus convexity estimated price change',value:p.quadratic/p.price-1}],note:'These are price changes at one valuation instant, not a year of total return or cash income. With fixed positive cash flows and the supported yield domain, the price-yield curve is convex. The linear tangent lies below it. The second-order estimate can still be above or below exact repricing; its residual is not silently removed.'},
    {id:'bond-convexity-repricing-bridge',type:'waterfall',title:'Reconcile the exact repricing after both approximation terms and the residual',unit:'money',rows:[{label:'Initial model value',value:p.price},{label:'First-order duration price change',value:p.linearChange},{label:'Second-order convexity adjustment',value:p.convexityChange},{label:'Remaining exact-model correction',value:p.residual}],totalLabel:'Exact value at the selected new yield',note:'The duration term is −initial price × modified duration × yield change. The convexity term is +½ × initial price × convexity × yield change squared. Yield change is a fraction, so a 2-percentage-point move enters as 0.02. The final correction equals exact repricing minus the two-term estimate. Every step is a valuation change; no step pays cash into the account.'},
    {id:'bond-convexity-duration-error-matrix',type:'heatmap',title:'A local duration estimate can leave a larger dollar error at longer maturities',unit:'money',signed:true,unitLabel:'CAD: duration-only estimated value minus exact model value',columns:['−3 pp','−1 pp','+1 pp','+3 pp'],rows:[5,10,20,30].map(years=>({label:years+' yr',values:[-3,-1,1,3].map(shock=>convexityComparison(input,shock,years).linearError)})),note:'Rows replace years remaining and columns replace the yield change; each cell recalculates its own starting price and duration at that maturity. Face amount, coupon and starting yield remain selected. Negative cells mean the duration-only tangent underestimates the exact model value. The grid overrides the selected maturity and shock. It is an approximation-error comparison, not a return forecast or a measure of default risk.'}
  ]};
}
