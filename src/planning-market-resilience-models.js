// Original deterministic annual-coupon teaching model. No quoted security.
export const marketResilienceDefinitions={
  bondGoal:{title:'Compare a fixed-coupon bond with an earlier cash deadline',fields:[
    ['face','Face amount repaid at maturity if the issuer pays (CAD)',10000,1000,100000,1000],['coupon','Fixed annual coupon as a share of face (%)',4,0,10,.5],
    ['purchaseYield','Effective annual yield used for the purchase price (%)',4,0,12,.5],['resetYield','Effective annual yield immediately after purchase (%)',6,0,12,.5],
    ['bondYears','Whole years to maturity at purchase',10,1,30,1],['cashYear','Whole years until the cash goal',3,1,30,1]
  ]}
};

export function fixedCouponPrice(face,coupon,yieldPct,years){
  const y=yieldPct/100,payment=face*coupon/100;
  if(years===0)return face;
  if(y===0)return face+payment*years;
  return payment*(-Math.expm1(-years*Math.log1p(y)))/y+face*Math.exp(-years*Math.log1p(y));
}
export function bondGoalPath(input,resetYield=input.resetYield){
  const purchase=fixedCouponPrice(input.face,input.coupon,input.purchaseYield,input.bondYears),coupon=input.face*input.coupon/100;
  const rows=[];
  for(let year=0;year<=input.cashYear;year++){
    const paidCoupons=coupon*Math.min(year,input.bondYears),remaining=Math.max(0,input.bondYears-year);
    const market=remaining>0?fixedCouponPrice(input.face,input.coupon,resetYield,remaining):0;
    const matured=remaining===0?input.face:0;
    rows.push({x:year,value:market+matured+paidCoupons,market,matured,coupons:paidCoupons});
  }
  const end=rows.at(-1);
  return {purchase,rows,end,profit:end.value-purchase};
}

const path=(name,rows,key='value',extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});

export function marketResilienceResult(kind,input){
  if(kind==='bondGoal'){
    const p=bondGoalPath(input),unchanged=bondGoalPath(input,input.purchaseYield);
    const rates=[...new Set([0,2,4,6,8,10,12,input.purchaseYield,input.resetYield])].sort((a,b)=>a-b);
    return {metrics:[['Purchase price, separately from face value',p.purchase,'money'],['Bond value plus retained cash at the goal date',p.end.value,'money'],['Nominal gain / loss by that date',p.profit,'money']],note:'Original annual-coupon, non-callable bullet-bond illustration in nominal CAD. Purchase is immediately after a coupon date with no accrued interest. The selected reset yield applies immediately after purchase and stays constant. Each annual coupon is paid in full; maturity principal is paid in full. Goal-date values are immediately after that year’s coupon or maturity payment. Coupons and matured principal are held as zero-interest cash, with no reinvestment. Price is the present value of remaining annual coupons and face at the selected effective annual yield. No issuer default, credit-spread change, bid-ask spread, dealing costs, taxes, currency movement, optionality, amortization or product quotation is modeled. Assuming timely payment is not a guarantee. Yield to maturity is a discount rate here, not the realized return with idle coupon cash.',charts:[
      {id:'bond-goal-price-yield',type:'bar',title:'The coupon can stay fixed while the market price changes',unit:'money',rows:rates.map(y=>({label:y+'% effective annual yield',value:fixedCouponPrice(input.face,input.coupon,y,input.bondYears)})),note:'All rows value the same face amount, annual coupon and maturity immediately after purchase. Only the discount yield changes. This is a price comparison at one date, not a sequence of actual offers or a forecast yield path.'},
      {id:'bond-goal-wealth-path',type:'line',title:'Track the bond and the coupon cash to the date you need money',unit:'money',xLabel:'Years after purchase; after each annual payment',series:[path('Yield resets immediately',p.rows),path('Purchase yield stays unchanged',unchanged.rows,'value',{dash:true})],note:'At year zero, the reset curve shows the market value immediately after the yield change; the amount paid remains the purchase-price metric. Each curve includes accumulated coupons and any maturity principal exactly once. After maturity, wealth is flat because the retained cash earns zero.'},
      {id:'bond-goal-profit-reconcile',type:'waterfall',title:'A coupon receipt is only one part of the holding-period result',unit:'money',rows:[{label:'Coupons received and retained',value:p.end.coupons},{label:'Sale / principal less cost',value:p.end.market+p.end.matured-p.purchase}],totalLabel:'Net holding-period gain / loss',note:'The second step is remaining-bond sale value before maturity or principal retained after maturity, less the original purchase price. Adding both maturity principal and an outstanding bond value would double count it. This is a dollar gain or loss, not an annualized yield.'},
      {id:'bond-goal-term-yield',type:'heatmap',title:'Price sensitivity across remaining terms and discount yields',unit:'money',columns:['1% yield','3% yield','5% yield','7% yield'],rows:[2,5,10,20].map(years=>({label:years+' years',values:[1,3,5,7].map(y=>fixedCouponPrice(input.face,input.coupon,y,years))})),note:'Every cell is a price at one coupon boundary, with the selected face and coupon but the displayed term and yield. It does not contain coupons already paid, a later sale, or a reinvestment return. A longer term can create a larger price response; maturity is only one determinant of real-world interest-rate sensitivity.'}
    ]};
  }
  throw Error('Unknown market-resilience planning topic.');
}
