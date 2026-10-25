export const premiumBondDefinitions={
  premiumBond:{title:'Compare hypothetical bond rates and a nominal-capital reserve',fields:[
    ['face','Face amount repaid at maturity (CAD)',10000,1000,100000,1000],
    ['pricePercent','Purchase price as a percentage of face value (%)',110,80,130,1],
    ['coupon','Annual coupon as a percentage of face value (%)',6,0,12,.5],
    ['years','Whole years to maturity; one coupon each year',10,1,20,1],
    ['reinvestRate','Reserve’s assumed annual return after its tax and costs (%)',2,0,8,.5]
  ]}
};
export function annualBondYield(face,couponCash,price,years){
  const pv=yieldRate=>{let total=0;for(let year=1;year<=years;year++)total+=(couponCash+(year===years?face:0))/(1+yieldRate)**year;return total;};
  if(Math.abs(face+couponCash*years-price)<1e-10*Math.max(1,price))return 0;
  let low=-.99,high=1;
  for(let i=0;i<100;i++){const middle=(low+high)/2;if(pv(middle)>price)low=middle;else high=middle;}
  return (low+high)/2;
}
export function premiumReserveDeposit(face,pricePercent,years,reinvestRate){
  const premium=Math.max(0,face*pricePercent/100-face),r=reinvestRate/100;
  const factor=r===0?years:Math.expm1(years*Math.log1p(r))/r;
  return premium/factor;
}
export function premiumBondPlan(input){
  const price=input.face*input.pricePercent/100,couponCash=input.face*input.coupon/100,premium=Math.max(0,price-input.face),deposit=premiumReserveDeposit(input.face,input.pricePercent,input.years,input.reinvestRate),r=input.reinvestRate/100;
  let pool=0;const rows=[{x:0,value:0}];
  for(let year=1;year<=input.years;year++){pool=pool*(1+r)+deposit;rows.push({x:year,value:pool});}
  const rawRemaining=couponCash-deposit,remainingCoupon=Math.abs(rawRemaining)<1e-8?0:rawRemaining;
  return {price,couponCash,premium,deposit,rows,pool,remainingCoupon,outsideNeed:Math.max(0,-remainingCoupon),currentYield:couponCash/price,cashFlowYield:annualBondYield(input.face,couponCash,price,input.years)};
}
export function premiumBondResult(kind,input){
  if(kind!=='premiumBond')throw Error('Unknown premium-bond topic.');
  const p=premiumBondPlan(input);
  return {metrics:[['Annual coupon rate on face value',input.coupon/100,'percent'],['Current yield: annual coupon divided by purchase price',p.currentYield,'percent'],['Annual-coupon cash-flow yield to maturity',p.cashFlowYield,'percent']],note:'Original hypothetical nominal-CAD bond illustration. A fixed non-callable bond is bought immediately after a coupon at the entered price, pays one annual coupon at each year-end and repays face value at maturity. All issuer payments are assumed honoured. The cash-flow yield is the effective annual discount rate equating these annual receipts with the purchase price; it is not a dealer’s semiannual or day-count quote conversion, a forecast or a guaranteed realised compound return. The separate reserve target is the positive difference between purchase price and face amount, with no inflation allowance. Equal reserve deposits are made at each year-end after prior reserve cash earns the selected return. That reserve return is assumed after its own tax and costs, while bond coupons and redemption are shown before bond tax and transaction costs. If the reserve deposit exceeds the coupon, outside cash is required to fund the illustrated plan; no borrowing or extra money is silently supplied. Calculations retain fractional cents; actual payment rounding would change a final adjustment. No interim bond valuation, early call, default, accrued interest, tax treatment or fee is calculated.',charts:[
    {id:'premium-bond-coupon-budget',type:'waterfall',title:'Subtract the modeled reserve requirement from the annual coupon',unit:'money',rows:[{label:'Annual coupon cash before tax and costs',value:p.couponCash},{label:'Required year-end premium reserve deposit',value:-p.deposit}],totalLabel:'Coupon less reserve requirement',note:'This is a budget subtotal rather than the bond’s return. A negative endpoint means the coupon cannot fund the whole reserve deposit: there is no coupon left for spending and outside cash would be needed for the deficit. A price at or below face value creates no positive premium gap and requires no premium reserve in this model.'},
    {id:'premium-bond-reserve-path',type:'line',title:'The reserve grows toward the price paid above face value',unit:'money',xLabel:'Complete years from purchase',series:[{name:'Funded premium reserve',rows:p.rows},{name:'Selected nominal premium gap',rows:[{x:0,value:p.premium},{x:input.years,value:p.premium}],dash:true}],note:'The pool starts at zero and receives the same deposit at every year-end. Its value excludes the bond itself and all coupon cash spent elsewhere. The path assumes every required deposit is actually funded, including any necessary outside top-up. The target restores a nominal amount at maturity, not purchasing power or an interim market price.'},
    {id:'premium-bond-maturity-capital',type:'stackbar',title:'Maturity capital reflects the earlier spending choice',unit:'money',unitLabel:'Nominal CAD retained at maturity; earlier coupon spending excluded',seriesNames:['Bond face amount repaid','Separate reserve at maturity'],rows:[{label:'All coupon cash spent',values:[input.face,0]},{label:'Required reserve fully funded',values:[input.face,p.pool]}],note:'Both cases receive the same face amount from the issuer. The funded plan retains part of each coupon instead of spending it, and requires outside deposits if the coupon is insufficient. Its extra ending capital is not a free gain or higher bond coupon. Cumulative household consumption differs between the cases. When the price is below face value, the premium reserve is zero and maturity face value already exceeds the purchase price.'},
    {id:'premium-bond-reserve-grid',type:'heatmap',title:'Purchase premium and reserve return change the amount to set aside',unit:'money',unitLabel:'Equal year-end deposit to fund the nominal premium gap at maturity (CAD)',columns:['0%','2%','4%','6%'],rows:[100,105,110,120].map(pricePercent=>({label:pricePercent+'% price',values:[0,2,4,6].map(rate=>premiumReserveDeposit(input.face,pricePercent,input.years,rate))})),note:'Rows replace the purchase price as a percentage of face; columns replace the reserve return. Face amount and maturity remain entered. The coupon rate does not change this reserve target, although it changes how much can be funded from coupons. Returns are assumptions without probabilities, and a higher assumed return is not evidence that a smaller deposit is reliable in practice.'}
  ]};
}
