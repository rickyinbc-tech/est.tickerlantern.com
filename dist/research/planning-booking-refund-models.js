export const bookingRefundDefinitions={
  bookingRefund:{title:'Compare two hypothetical booking contracts and a delayed cash refund',fields:[
    ['bookingPrice','Lower-priced booking: full initial cash price (CAD)',1800,0,20000,100],
    ['bookingPremium','Additional upfront price for the alternative booking (CAD)',300,0,5000,50],
    ['lowRefund','Lower-priced booking: assumed refund before retained fee (%)',0,0,100,5],
    ['highRefund','Alternative booking: assumed refund before retained fee (%)',100,0,100,5],
    ['lowCancelFee','Lower-priced booking: amount retained from that gross refund (CAD)',0,0,5000,50],
    ['highCancelFee','Alternative booking: amount retained from that gross refund (CAD)',100,0,5000,50],
    ['cancelChance','Assumed probability of an eligible voluntary cancellation (%)',20,0,100,5],
    ['cancelMonth','Cancellation month after booking',2,1,6,1],
    ['refundLag','Whole months from cancellation to cash refund',2,0,12,1],
    ['bookingCash','Cash assigned to this booking before purchase (CAD)',2500,0,50000,500]
  ]}
};

export function bookingRefundPlan(input,{premium=input.bookingPremium,chance=input.cancelChance}={}){
  const refundMonth=input.cancelMonth+input.refundLag,horizon=refundMonth+2;
  const contracts=[
    {name:'Lower-priced booking',price:input.bookingPrice,percent:input.lowRefund,fee:input.lowCancelFee},
    {name:'Alternative booking',price:input.bookingPrice+premium,percent:input.highRefund,fee:input.highCancelFee}
  ].map(s=>{
    const refund=Math.max(0,s.price*s.percent/100-s.fee),cancelCost=s.price-refund,expected=s.price-chance/100*refund;
    const rows=Array.from({length:horizon+1},(_,month)=>({x:month,value:input.bookingCash-s.price+(month>=refundMonth?refund:0)}));
    return {...s,refund,cancelCost,expected,rows,upfrontGap:Math.max(0,s.price-input.bookingCash)};
  });
  const extraRefund=contracts[1].refund-contracts[0].refund;
  const crossing=extraRefund!==0?premium/extraRefund:null;
  const sameEverywhere=extraRefund===0&&premium===0;
  return {contracts,refundMonth,horizon,extraRefund,crossing,sameEverywhere,difference:contracts[1].expected-contracts[0].expected};
}

export function bookingRefundResult(kind,input){
  if(kind!=='bookingRefund')throw Error('Unknown booking-refund topic.');
  const p=bookingRefundPlan(input),[low,high]=p.contracts;
  const crossingInRange=p.crossing!=null&&p.crossing>=0&&p.crossing<=1;
  const crossingText=p.sameEverywhere?'Equal at every assumption':crossingInRange?null:'No crossing within 0–100%';
  return {metrics:[['Lower-priced booking: probability-weighted cost',low.expected,'money'],['Alternative booking: probability-weighted cost',high.expected,'money'],['Cancellation assumption giving equal weighted costs',crossingInRange?p.crossing:null,'percent',crossingText]],
    note:'Independent hypothetical contracts in CAD, not travel prices, policy quotations or legal refund determinations. The traveler voluntarily cancels before using the booking; an eligible cash refund is assumed accepted. This excludes supplier cancellation, statutory disruption rights, travel insurance, vouchers, partial use, replacement travel, interest and all other trip costs. Refund equals the entered percentage of that contract’s full price less its retained fee, floored at zero; a fee cannot create an additional cancellation bill here. Probability is an assumption, not a forecast or survey statistic. The weighted average is not the amount a single booking will necessarily cost. Both prices are paid at time zero; the cash chart shows the cancellation branch only, with no new saving or borrowing.',
    charts:[
      {id:'booking-refund-outcomes',type:'groupbar',title:'A lower purchase price and a lower cancellation cost are different outcomes',unit:'money',seriesNames:p.contracts.map(s=>s.name),rows:[{label:'Use the booking',values:p.contracts.map(s=>s.price)},{label:'Eligible cancellation',values:p.contracts.map(s=>s.cancelCost)}],note:'The first row assumes the booking is used and no refund is due. The second assumes an eligible voluntary cancellation and the full modeled cash refund is received. These are alternative branches; their costs are not added together. A contract’s retained fee is already included in its net refund.'},
      {id:'booking-refund-weighted-cost',type:'line',title:'Move the cancellation assumption before reading the probability-weighted cost',unit:'money',xLabel:'Assumed cancellation chance',xTicks:[0,25,50,75,100].map(value=>({value,label:value+'%'})),series:p.contracts.map((s,i)=>({name:s.name,rows:Array.from({length:21},(_,j)=>({x:j*5,value:s.price-j/20*s.refund})),dash:i===1})),note:'Each line uses price minus the assumed probability times that contract’s net refund. It averages a used-booking branch and an eligible-cancellation branch under the selected contract terms. It values neither the experience of travel nor the inconvenience of cancellation. A crossing is an arithmetic equality, not a recommendation.'},
      {id:'booking-refund-cash-wait',type:'line',title:'Even an accepted future refund cannot pay the initial booking bill',unit:'money',xLabel:'Months after booking',series:p.contracts.map((s,i)=>({name:s.name,rows:s.rows,step:true,dash:i===1})),note:'This chart conditions on cancellation in month '+input.cancelMonth+' and cash refund in month '+p.refundMonth+'. It is not probability-weighted. Cash falls immediately by the full booking price and rises only when the modeled refund arrives. Upfront funding gaps are '+cad(low.upfrontGap)+' for the lower-priced contract and '+cad(high.upfrontGap)+' for the alternative. No other bills or income are included.'},
      {id:'booking-refund-premium-grid',type:'heatmap',title:'Extra weighted cost of the alternative under different upfront premiums',unit:'money',signed:true,columns:[0,10,20,40].map(value=>value+'% cancel'),rows:[100,300,600].map(premium=>({label:'+$'+premium,values:[0,10,20,40].map(chance=>bookingRefundPlan(input,{premium,chance}).difference)})),note:'Cells show alternative minus lower-priced probability-weighted cost. Negative CAD means the alternative has a lower weighted cost under that assumed probability; positive CAD means a higher cost. Each row replaces the premium, which also changes the alternative’s refund base. Refund percentages, retained fees and the lower price remain selected. No probability is estimated from the color or cell value.'}
    ]};
}

function cad(value){return 'CAD '+value.toLocaleString('en-CA',{maximumFractionDigits:2});}
