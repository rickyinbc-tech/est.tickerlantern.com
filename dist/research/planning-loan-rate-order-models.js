export const loanRateOrderDefinitions={
 loanRateOrder:{title:'Reverse two annual rate blocks while keeping four equal principal repayments',fields:[
  ['orderPrincipal','Initial loan principal (CAD)',24000,0,500000,1000],
  ['rateBlockA','Annual rate in block A (%)',10,0,20,0.25],
  ['rateBlockB','Annual rate in block B (%)',6,0,20,0.25]
 ]}
};

export function loanRateOrderLedger(d){
 const principalPayment=d.orderPrincipal/4;
 const rows=Array.from({length:4},(_,i)=>{
  const opening=d.orderPrincipal*(4-i)/4,ending=d.orderPrincipal*(3-i)/4,rateAFirst=i<2?d.rateBlockA:d.rateBlockB,rateBFirst=i<2?d.rateBlockB:d.rateBlockA;
  const interestA=opening*rateAFirst/100,interestB=opening*rateBFirst/100;
  return {year:i+1,opening,ending,principalPayment,rateAFirst,rateBFirst,interestA,interestB,paymentA:principalPayment+interestA,paymentB:principalPayment+interestB};
 });
 const interestA=rows.reduce((s,r)=>s+r.interestA,0),interestB=rows.reduce((s,r)=>s+r.interestB,0),openingBalanceSum=rows.reduce((s,r)=>s+r.opening,0);
 return {rows,principalPayment,interestA,interestB,gap:interestA-interestB,totalPaymentA:d.orderPrincipal+interestA,totalPaymentB:d.orderPrincipal+interestB,meanRate:(d.rateBlockA+d.rateBlockB)/200,openingBalanceSum,weightedA:openingBalanceSum>0?interestA/openingBalanceSum:null,weightedB:openingBalanceSum>0?interestB/openingBalanceSum:null};
}

export function loanRateOrderResult(kind,d){
 if(kind!=='loanRateOrder')throw Error('Unknown loan-rate order illustration.');
 const p=loanRateOrderLedger(d);
 return {metrics:[['Total interest: block A first, then B',p.interestA,'money'],['Total interest: block B first, then A',p.interestB,'money'],['A-first interest less B-first interest',p.gap,'money']],
 note:'Original hypothetical four-year declining-principal loan. Each of four equal one-year periods starts with the shown principal; that year’s annual rate applies to the entire opening balance. Interest is paid in full at year-end, followed by repayment of one quarter of the initial principal. Total payments therefore vary with interest; this is not a level-total-payment amortization or a current lender quote. Block A applies for two years and block B for two years, then their order is reversed. Both cases have the same principal path, term and unweighted average annual rate. No interest is capitalized, and no extra borrowing, prepayment, fees, tax, payment delay or discounting is modeled. Principal repayments use separate household cash and end the balance at zero after year four. The model explains rate timing on a shrinking balance; it does not forecast variable rates, calculate a regulated APR or establish affordability.',charts:[
  {id:'loan-rate-order-rate-calendar',type:'groupbar',title:'Both rate orders contain two years in each block',unit:'percent',unitLabel:'Assumed annual rate on that year’s opening principal',seriesNames:['Block A first, then B','Block B first, then A'],rows:p.rows.map(r=>({label:'Year '+r.year,values:[r.rateAFirst/100,r.rateBFirst/100]})),note:'The simple average is the same because each rate appears for exactly two of the four periods. Rates are assumptions, not quotes, probabilities or forecasts. An equal average does not assign the same rate to the same amount of debt in each period.'},
  {id:'loan-rate-order-principal-path',type:'line',title:'The fixed principal-repayment rule makes the outstanding balances identical',unit:'money',xLabel:'Annual repayment checkpoint',series:[{name:'Loan principal under both rate orders',step:true,rows:[{x:0,value:d.orderPrincipal},...p.rows.map(r=>({x:r.year,value:r.ending}))]}],note:'Checkpoint zero is the initial amount borrowed. Later checkpoints follow each equal principal repayment. Interest is paid separately and never added to principal. The graph does not imply that a real variable-rate loan has this repayment structure; the structure is fixed here to isolate the rate-order effect.'},
  {id:'loan-rate-order-annual-payments',type:'groupbar',title:'Equal principal repayments still produce different annual cash-payment schedules',unit:'money',unitLabel:'Principal repaid plus that year’s interest, paid at year-end · CAD',seriesNames:['Block A first, then B','Block B first, then A'],rows:p.rows.map(r=>({label:'Year '+r.year,values:[r.paymentA,r.paymentB]})),note:'Every bar includes the same principal repayment for its year and the interest from its own rate order. These are total cash outflows, not all borrowing cost: principal returns money already borrowed. Compare the schedule with household cash availability separately.'},
  {id:'loan-rate-order-interest-bridge',type:'waterfall',title:'Annual interest differences explain the total gap',unit:'money',rows:p.rows.map(r=>({label:'Year '+r.year+' interest difference',value:r.interestA-r.interestB})),totalLabel:'A-first less B-first interest',note:'The bridge subtracts the B-first case from the A-first case in each year. Higher early interest can outweigh lower later interest because more principal is outstanding earlier. Principal cancels from this difference because both cases repay exactly the same amounts on the same dates.'},
  {id:'loan-rate-order-block-matrix',type:'heatmap',signed:true,title:'Changing the two rate blocks changes the signed order effect',unit:'money',unitLabel:'A-first total interest less B-first total interest · CAD',columns:['0%','4%','8%','12%'],rows:[0,4,8,12].map(a=>({label:'A '+a+'%',values:[0,4,8,12].map(b=>loanRateOrderLedger({...d,rateBlockA:a,rateBlockB:b}).gap)})),note:'Rows replace rate A and columns replace rate B, holding the initial loan and equal-principal repayment calendar fixed. A positive cell means putting A first costs more interest; a negative cell means it costs less. Zero occurs when rates match or there is no principal. Cells are deterministic comparisons, not estimates of future rate paths.'}
 ]};
}
