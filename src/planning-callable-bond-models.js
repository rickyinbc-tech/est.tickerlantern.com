export const callableBondDefinitions={
  callableBond:{title:'Compare hypothetical bond cash flows with and without an early call',fields:[
    ['face','Face value, assumed paid at purchase and at redemption (CAD)',10000,1000,100000,1000],
    ['coupon','Annual coupon as a percentage of face value (%)',6,0,12,.5],
    ['bondYears','Original maturity in complete annual coupon years',10,5,20,1],
    ['callYear','Assumed call immediately after this year’s coupon',3,1,4,1],
    ['reinvestRate','Annual return assumed on all reinvested receipts (%)',2,0,10,.5]
  ]}
};
export function bondReceiptPool(input,redemptionYear=input.bondYears,reinvestRate=input.reinvestRate){
  const coupon=input.face*input.coupon/100,factor=1+reinvestRate/100;
  let couponPool=0,principalPool=0,couponsPaid=0;
  const rows=[{x:0,value:0,couponPaid:0,redemption:0}];
  for(let year=1;year<=input.bondYears;year++){
    const couponPaid=year<=redemptionYear?coupon:0,redemption=year===redemptionYear?input.face:0;
    couponPool=couponPool*factor+couponPaid;principalPool=principalPool*factor+redemption;couponsPaid+=couponPaid;
    rows.push({x:year,value:couponPool+principalPool,couponPaid,redemption});
  }
  return {rows,total:couponPool+principalPool,couponPool,principalPool,couponsPaid,couponGrowth:couponPool-couponsPaid};
}
const zeroSmall=value=>Math.abs(value)<1e-7?0:value;
export function bondCallGap(input,callYear=input.callYear,reinvestRate=input.reinvestRate){
  return zeroSmall(bondReceiptPool(input,callYear,reinvestRate).total-bondReceiptPool(input,input.bondYears,reinvestRate).total);
}
export function callableBondResult(kind,input){
  if(kind!=='callableBond')throw Error('Unknown callable-bond topic.');
  const held=bondReceiptPool(input),called=bondReceiptPool(input,input.callYear),gap=bondCallGap(input);
  return {metrics:[['Reinvested receipts at original maturity: no early call',held.total,'money'],['Reinvested receipts at original maturity: assumed early call',called.total,'money'],['Early-call minus no-call value at the same endpoint',gap,'money']],note:'Original hypothetical nominal-CAD cash-flow comparison. Both cases begin with the same face-value purchase price, face amount, annual coupon and original maturity. They are matched teaching cases, not two actual bonds offered at an identical market price. Coupons arrive at each year-end. The assumed issuer call happens immediately after the selected coupon and returns face value, with no call premium or accrued-interest adjustment. No later coupons are paid in that case. The no-call comparator returns face value at original maturity. Every coupon and redemption receipt is retained in a separate reinvestment pool: prior receipts earn the constant selected annual return before new year-end receipts arrive. No spending, additional saving, tax, fees, issuer default, secondary-market sale, interim bond valuation or call probability is modeled. The issuer’s decision is assumed rather than predicted, and the reinvestment return is independent of that decision. Pool values before original maturity exclude any bond still outstanding; at the common endpoint both bonds have redeemed.',charts:[
    {id:'callable-bond-coupons',type:'groupbar',title:'The original coupon stream stops after the selected call year',unit:'money',unitLabel:'Annual coupon paid by the issuer, excluding principal redemption (CAD)',seriesNames:['No early call','Assumed early call'],rows:held.rows.slice(1).map((r,i)=>({label:'Year '+r.x,values:[r.couponPaid,called.rows[i+1].couponPaid]})),note:'This chart contains coupon payments only, not the face-value redemption. Both cases pay the selected year’s coupon before the assumed early call. Principal arrives at the selected call year in that case and at original maturity in the no-call case; those receipts enter the separate reinvestment-pool chart.'},
    {id:'callable-bond-receipt-pool',type:'line',title:'Earlier redemption changes when money enters the reinvestment pool',unit:'money',unitLabel:'Value of reinvested receipts; outstanding bond value excluded (CAD)',xLabel:'Complete years from purchase',series:[{name:'No early call: reinvested receipts',rows:held.rows.map(r=>({x:r.x,value:r.value}))},{name:'Assumed early call: reinvested receipts',rows:called.rows.map(r=>({x:r.x,value:r.value})),dash:true}],note:'The pool starts at zero because the opening money buys the bond. A redemption creates a large cash receipt and then compounds under the selected reinvestment assumption. A larger pool before original maturity does not establish greater total wealth: the value of an outstanding bond is excluded. At original maturity both cases have redeemed, so the endpoint contains all retained proceeds in each matched case.'},
    {id:'callable-bond-terminal-gap',type:'waterfall',title:'Reconcile the difference at the original maturity date',unit:'money',rows:[{label:'Difference in issuer coupons received',value:zeroSmall(called.couponsPaid-held.couponsPaid)},{label:'Extra growth on earlier principal receipt',value:zeroSmall(called.principalPool-held.principalPool)},{label:'Difference in growth on coupon receipts',value:zeroSmall(called.couponGrowth-held.couponGrowth)}],totalLabel:'Early-call minus no-call endpoint',note:'The common face-value principal cancels. The bridge combines fewer issuer coupons with the reinvestment effects of receiving principal earlier and changing the coupon stream. A negative endpoint is a difference between scenarios, not a write-off of that amount of principal or a calculation of a secondary-market capital loss.'},
    {id:'callable-bond-reinvestment-grid',type:'heatmap',signed:true,title:'Test the call year and the return available after receipts arrive',unit:'money',unitLabel:'Early-call minus no-call pool at original maturity (CAD)',columns:['0%','2%','4%','6%'],rows:[1,2,3,4].map(callYear=>({label:'Call year '+callYear,values:[0,2,4,6].map(rate=>bondCallGap(input,callYear,rate))})),note:'Rows replace the assumed call year; columns replace the annual return on all reinvested receipts in both cases. Face value, coupon and original maturity remain entered. These are sensitivity cases, not quoted replacement yields or an issuer exercise model. If the reinvestment return equals the coupon rate in this par-purchase example, the matched terminal values coincide despite different payment dates.'}
  ]};
}
