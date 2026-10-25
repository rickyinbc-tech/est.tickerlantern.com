export const indexedBondDefinitions={
  inflationLinkedCash:{title:'Separate index-adjusted principal from the cash a bond actually pays',fields:[
    ['indexedFace','Original face amount (USD)',10000,100,1000000,1000],
    ['indexedCoupon','Fixed annual coupon rate (%)',2,.125,8,.125],
    ['indexedInflation','Constant annual change in the illustrative price index (%)',3,-5,10,.5],
    ['indexedYears','Whole years to the hypothetical maturity',5,1,10,1],
    ['indexedCostPct','Purchase outlay as a percentage of original face (%)',105,80,130,.5]
  ]}
};

export function indexedBondLedger(input){
  const face=input.indexedFace,couponRate=input.indexedCoupon/100,annualFactor=1+input.indexedInflation/100;
  let cumulativeCoupons=0;
  const rows=[{x:0,index:1,adjustedPrincipal:face,originalFace:face,coupon:0,realCoupon:0,cumulativeCoupons:0}];
  for(let half=1;half<=input.indexedYears*2;half++){
    const x=half/2,index=annualFactor**x,adjustedPrincipal=face*index,coupon=adjustedPrincipal*couponRate/2;
    cumulativeCoupons+=coupon;
    rows.push({x,index,adjustedPrincipal,originalFace:face,coupon,realCoupon:coupon/index,cumulativeCoupons});
  }
  const last=rows.at(-1),redemption=Math.max(face,last.adjustedPrincipal),floorTopUp=redemption-last.adjustedPrincipal;
  const purchaseOutlay=face*input.indexedCostPct/100,totalCash=redemption+cumulativeCoupons;
  const annualCoupons=Array.from({length:input.indexedYears},(_,i)=>{
    const a=rows[i*2+1],b=rows[i*2+2];
    return {label:'Year '+(i+1),nominal:a.coupon+b.coupon,baseYear:a.realCoupon+b.realCoupon};
  });
  return {rows,last,annualCoupons,cumulativeCoupons,redemption,floorTopUp,purchaseOutlay,totalCash,netCash:totalCash-purchaseOutlay,principalMinusOutlay:redemption-purchaseOutlay};
}

const moneySpec={unit:'money',currency:'USD',tableUnit:'US dollars (USD)',unitLabel:'US dollars (USD) · authored cash-flow illustration'};
export function indexedBondResult(kind,input){
  if(kind!=='inflationLinkedCash')throw Error('Unknown indexed-bond topic.');
  const p=indexedBondLedger(input);
  return {metrics:[['Coupon cash received before the maturity date · USD',p.cumulativeCoupons-p.last.coupon,'money'],['Principal cash repaid at maturity · USD',p.redemption,'money'],['Maturity principal minus purchase outlay · USD',p.principalMinusOutlay,'money']],note:'Original USD illustration of an inflation-indexed bond, not an actual TIPS quote, observed CPI series or investment recommendation. The reference price index starts at 1 and compounds at the selected constant annual rate; half-year index levels use fractional powers. Coupons are paid at each half-year end on the then-adjusted principal. Principal may fall below original face before maturity; the original-face floor is applied only to principal redemption, never to the coupon calculation. This simplified schedule omits actual TIPS daily reference-CPI conventions, publication lag, interpolation, accrued interest and settlement rounding. The purchase outlay is entered independently as a percentage of original face; no market yield or fair price is estimated. All coupons are retained as cash earning zero interest and are never added to indexed principal. No fees, tax, default, early sale, fund distributions or currency conversion is included. Base-year coupon amounts divide each payment by the same model index at its own payment date; they are not the purchasing power of an accumulated cash account at maturity. USD indexation does not establish protection for a CAD spending goal or a personal spending basket.',charts:[
    {id:'indexed-bond-principal-path',type:'line',title:'An adjusted principal path is not cash paid into the spending account',...moneySpec,xLabel:'Model years from reference date',series:[{name:'Index-adjusted principal before redemption floor',rows:p.rows.map(r=>({x:r.x,value:r.adjustedPrincipal}))},{name:'Original face · maturity-floor reference',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.originalFace}))}],note:'At each half-year checkpoint, adjusted principal equals original face times the illustrative index. The dashed original-face line is a reference for the maturity redemption floor, not an interim balance floor or market sale price. Principal increases are not separate coupon receipts. Under deflation the adjusted-principal line may fall below face; only the maturity principal payment is floored.'},
    {id:'indexed-bond-coupon-cash',type:'groupbar',title:'A fixed coupon percentage can produce changing cash payments',...moneySpec,seriesNames:['Nominal coupon cash received in that year','Coupons in reference-date dollars'],rows:p.annualCoupons.map(r=>({label:r.label,values:[r.nominal,r.baseYear]})),note:'Two half-year coupons form each year’s nominal total. The reference-date comparison first divides each individual payment by the model index on its own payment date, then adds those two amounts. It stays constant because the coupon base and the deflator use the same index. This is a flow comparison, not an end-of-year account valuation. No price-index principal adjustment is counted as coupon cash.'},
    {id:'indexed-bond-cash-reconciliation',type:'waterfall',title:'Reconcile every received dollar with the original purchase outlay',...moneySpec,rows:[{label:'All coupon cash, retained without interest',value:p.cumulativeCoupons},{label:'Principal repaid at maturity',value:p.redemption},{label:'Original purchase outlay',value:-p.purchaseOutlay}],totalLabel:'Net nominal cash over the full holding period',note:'The endpoint is coupons plus maturity principal minus purchase outlay. Coupon cash is assumed retained at zero interest so these flows can also reconcile the ending nominal cash against the original outlay. Redemption already includes the indexed amount or original-face floor; no extra inflation uplift is added again. A positive nominal endpoint is not an annualized return, an inflation-adjusted profit or cash that was available before its payment date.'},
    {id:'indexed-bond-floor-purchase-matrix',type:'heatmap',title:'The principal floor refers to original face, not every possible purchase outlay',...moneySpec,signed:true,columns:['95% face','100%','105%','110%'],rows:[-4,0,3,6].map(indexedInflation=>({label:indexedInflation+'% / year',values:[95,100,105,110].map(indexedCostPct=>indexedBondLedger({...input,indexedInflation,indexedCostPct}).principalMinusOutlay)})),note:'Rows replace the constant annual index change; columns replace purchase outlay as a percentage of original face. Face and years stay selected. Cells equal principal redemption minus purchase outlay, in nominal USD. Coupons are deliberately excluded from this principal-only comparison, so a negative cell is not the total investment result. A price above original face can exceed the maturity floor. These deterministic alternatives have no probabilities and are not market quotations.'}
  ]};
}
