export const bondReinvestmentDefinitions={
  bondReinvestment:{title:'Compare a bond’s sale value with growth on its received cash flows',fields:[
    ['face','Face amount of the hypothetical bond (CAD)',100000,100,1000000,1000],
    ['coupon','Fixed annual coupon, as % of face amount',5,0,15,.25],
    ['maturity','Original maturity (whole model years)',10,1,30,1],
    ['purchaseYield','Annual effective yield used for the purchase price (%)',5,0,15,.25],
    ['changedYield','Yield immediately after purchase, then constant (%)',7,0,15,.25],
    ['horizon','Date of the cash comparison (whole model years)',8,1,30,1]
  ]}
};
export function bondPurchaseMoments(input,yieldPercent=input.purchaseYield){
  const y=yieldPercent/100,c=input.face*input.coupon/100;
  let price=0,weightedTime=0;
  for(let t=1;t<=input.maturity;t++){
    const pv=(c+(t===input.maturity?input.face:0))/(1+y)**t;
    price+=pv;weightedTime+=t*pv;
  }
  return {price,duration:weightedTime/price};
}
export function bondHorizonCash(input,yieldPercent=input.changedYield,horizon=input.horizon){
  const y=yieldPercent/100,c=input.face*input.coupon/100,count=Math.min(input.maturity,Math.floor(horizon));
  let couponFV=0,saleValue=0;
  for(let t=1;t<=input.maturity;t++){
    if(t<=horizon)couponFV+=c*(1+y)**(horizon-t);
    else saleValue+=(c+(t===input.maturity?input.face:0))/(1+y)**(t-horizon);
  }
  const couponsPaid=c*count,principalPaid=horizon>=input.maturity?input.face:0;
  const principalFV=principalPaid*(1+y)**Math.max(0,horizon-input.maturity);
  const cashGrowth=Math.max(0,couponFV-couponsPaid+principalFV-principalPaid);
  const assetOrPrincipal=saleValue+principalPaid,total=saleValue+couponFV+principalFV;
  const purchase=bondPurchaseMoments(input);
  return {saleValue,couponsPaid,couponFV,principalPaid,principalFV,cashGrowth,assetOrPrincipal,total,annualized:horizon>0?(total/purchase.price)**(1/horizon)-1:null};
}
export function bondReinvestmentResult(kind,input){
  if(kind!=='bondReinvestment')throw Error('Unknown bond-reinvestment topic.');
  const purchase=bondPurchaseMoments(input),p=bondHorizonCash(input),base=bondHorizonCash(input,input.purchaseYield),end=Math.max(input.maturity,input.horizon);
  const yields=[...new Set([0,input.purchaseYield,input.changedYield,10])].sort((a,b)=>a-b);
  return {metrics:[['Original purchase price before the yield change',purchase.price,'money'],['Macaulay duration at purchase · model years',purchase.duration,'decimal'],['Changed-yield wealth minus unchanged-yield wealth at selected date',p.total-base.total,'money']],note:'Original deterministic annual-coupon bond illustration, with no observed bond data or quoted security. Purchase occurs immediately after a coupon boundary. The selected yield changes once immediately after purchase and then stays constant; that same effective annual rate prices every remaining payment and reinvests all received coupons and maturity principal. All payments occur in full on schedule; no default, call, fees, spread, tax, inflation, FX, curve twists or later rate changes. Wealth before maturity includes an assumed immediate sale at model value; after maturity it includes reinvested principal instead. No amount is counted twice. Reinvested cash must remain invested until the comparison date; using coupons for spending changes the result. Duration is a local sensitivity measure, not a guaranteed risk-free horizon.',charts:[
    {id:'bond-reinvestment-wealth-path',type:'line',title:'An immediate price loss can coexist with faster later growth on received cash',unit:'money',xLabel:'Completed model years',series:[['Yield unchanged at '+input.purchaseYield+'%',input.purchaseYield],['Yield changes to '+input.changedYield+'%',input.changedYield]].map(([name,yieldPercent],i)=>({name,dash:i===0,rows:Array.from({length:end+1},(_,x)=>({x,value:bondHorizonCash(input,yieldPercent,x).total}))})),note:'Time zero is immediately after the hypothetical yield change; the original outlay remains the separately displayed purchase price. At later points, wealth combines the sale value of unpaid bond cash flows with received cash grown at the scenario rate. From maturity onward there is no outstanding bond; principal is in the reinvestment account. These are alternative constant-rate scenarios, not a forecast of market paths.'},
    {id:'bond-reinvestment-wealth-parts',type:'stackbar',title:'Separate original coupon cash from the growth earned after receipt',unit:'money',seriesNames:['Bond sale value or redeemed face amount','Coupons paid, without their growth','Growth on received cash'],rows:yields.map(yieldPercent=>{const q=bondHorizonCash(input,yieldPercent);return {label:yieldPercent+'% yield · year '+input.horizon,values:[q.assetOrPrincipal,q.couponsPaid,q.cashGrowth]};}),note:'At the selected date, every bar totals wealth in one yield scenario. Before maturity the first part is the remaining bond’s sale value; at and after maturity it is the redeemed face amount. The final part includes coupon reinvestment growth and, after maturity, growth on principal. Coupon amounts are fixed by face and coupon rate; the yield changes their reinvestment growth and the price of unpaid cash flows.'},
    {id:'bond-reinvestment-offset-bridge',type:'waterfall',title:'Reconcile the changed-yield result against the same bond with an unchanged yield',unit:'money',rows:[{label:'Sale-value / redeemed-face difference',value:p.assetOrPrincipal-base.assetOrPrincipal},{label:'Growth-on-received-cash difference',value:p.cashGrowth-base.cashGrowth}],totalLabel:'Total horizon-wealth difference',note:'Both cases start with the same purchase and receive identical contractual coupons and principal. Their original coupon amounts therefore cancel from this difference. Before maturity, a price change and a reinvestment-growth change can work in opposite directions. At or after maturity, redeemed face amounts are equal and only the assumed cash-growth rates differ. A negative endpoint is lower wealth than the unchanged-rate benchmark, not automatically a loss against the original purchase price.'},
    {id:'bond-reinvestment-horizon-matrix',type:'heatmap',title:'The direction of the rate effect depends on when cash is needed',unit:'money',signed:true,columns:['0% yield','3%','6%','9%'],rows:[1,5,10,20].map(horizon=>({label:'Year '+horizon,values:[0,3,6,9].map(yieldPercent=>bondHorizonCash(input,yieldPercent,horizon).total-bondHorizonCash(input,input.purchaseYield,horizon).total)})),note:'Cells show horizon wealth minus the unchanged-purchase-yield benchmark for the same date. Rows replace the comparison date; columns replace the constant post-purchase yield. Face, coupon, maturity and original price stay selected. A horizon after maturity reinvests principal as well as coupons. Signed amounts are deterministic differences, not probabilities or guaranteed funding for a household goal.'}
  ]};
}
