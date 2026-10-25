export const paymentValueDefinitions={
 paymentValue:{title:'Put an upfront receipt and a dated payment stream on the same valuation date',fields:[
  ['upfrontCash','Alternative cash received now (CAD)',50000,0,500000,1000],
  ['annualPayment','Each annual payment in the other alternative (CAD)',12000,0,100000,500],
  ['paymentCount','Number of annual payments',5,1,12,1],
  ['firstPaymentYear','First payment year; 0 means now',1,0,5,1],
  ['valueDiscount','Assumed effective annual discount rate (%)',5,0,15,0.25]
 ]}
};

export function paymentValueLedger(d){
 const payments=Array.from({length:d.paymentCount},(_,i)=>({year:d.firstPaymentYear+i,cash:d.annualPayment,present:d.annualPayment/(1+d.valueDiscount/100)**(d.firstPaymentYear+i)}));
 const present=payments.reduce((sum,p)=>sum+p.present,0),nominal=d.annualPayment*d.paymentCount,lastYear=d.firstPaymentYear+d.paymentCount-1;
 const factors=payments.reduce((sum,p)=>sum+1/(1+d.valueDiscount/100)**p.year,0);
 const timeline=Array.from({length:lastYear+1},(_,year)=>({year,upfront:year===0?d.upfrontCash:0,payment:payments.filter(p=>p.year===year).reduce((sum,p)=>sum+p.cash,0),received:payments.filter(p=>p.year<=year).reduce((sum,p)=>sum+p.cash,0)}));
 return {payments,present,nominal,lastYear,timeline,gap:present-d.upfrontCash,equalPayment:d.upfrontCash/factors};
}

export function paymentValueResult(kind,d){
 if(kind!=='paymentValue')throw Error('Unknown payment-value comparison.');
 const p=paymentValueLedger(d);
 return {metrics:[['Present value of the dated payments',p.present,'money'],['Present value less upfront alternative',p.gap,'money'],['Total payments before discounting',p.nominal,'money']],
 note:'All amounts, dates and discount rates are independently entered hypothetical assumptions. The alternatives are mutually exclusive receipts: the upfront amount is received at time zero, while the equal annual payments occur at first-payment year plus successive whole years. Year 0 means an immediate first payment. Enter spendable amounts on a consistent tax and cost basis; no tax calculation is made. Every scheduled payment is assumed paid in full on its stated date. The effective annual discount rate converts amounts to time-zero value and is not an available investment yield, inflation estimate or probability adjustment. Cumulative receipt totals exclude reinvestment, spending and borrowing. Present value is an analytical measure, not extra money available in the bank. Credit risk, benefit eligibility, life contingencies, assignment rights and actual contract terms are outside this calculation.',charts:[
  {id:'payment-value-cash-dates',type:'groupbar',title:'The alternatives release cash on different dates',unit:'money',unitLabel:'Actual hypothetical receipts at each annual date · CAD',seriesNames:['Upfront alternative','Payment-stream alternative'],rows:p.timeline.map(r=>({label:r.year===0?'Year 0 · now':'Year '+r.year,values:[r.upfront,r.payment]})),note:'Read the alternatives separately. The upfront receipt and later payments are not combined into one entitlement. A gap before the first installment is a period with no receipt from that alternative; it is not filled automatically by the calculated present value.'},
  {id:'payment-value-discounted-bridge',type:'waterfall',title:'Discount each receipt once, then compare the sum with cash now',unit:'money',unitLabel:'Amounts expressed at time zero using the selected discount rate · CAD',rows:[...p.payments.map((r,i)=>({label:'Payment '+(i+1)+' · year '+r.year+' PV',value:r.present})),{label:'Subtract cash-now alternative',value:-d.upfrontCash}],totalLabel:'Payment-stream PV less cash now',note:'Positive steps are separately discounted payments; the negative step is the mutually exclusive upfront alternative. The final signed difference reconciles to the metric above. The running total is an analytical valuation bridge, not a transaction balance or money received at those future dates.'},
  {id:'payment-value-nominal-cumulative',type:'line',title:'The cumulative receipt total answers a different question from present value',unit:'money',xLabel:'Years from now',xMin:0,series:[{name:'Upfront alternative · cumulative receipts',step:true,rows:p.timeline.map(r=>({x:r.year,value:d.upfrontCash}))},{name:'Payment alternative · cumulative receipts',step:true,dash:true,rows:p.timeline.map(r=>({x:r.year,value:r.received}))}],note:'Steps occur at the stated annual receipt dates. No money earns a return and no spending is deducted in this chart. A larger eventual total does not demonstrate a larger value today, and the line does not show the account balance that would remain after household expenses.'},
  {id:'payment-value-rate-start-matrix',type:'heatmap',signed:true,title:'Both the discount rate and first receipt date affect the valuation difference',unit:'money',unitLabel:'Payment-stream present value less cash-now amount · CAD',columns:['0%','3%','5%','8%'],rows:[0,1,3,5].map(first=>({label:'First: yr '+first,values:[0,3,5,8].map(rate=>paymentValueLedger({...d,firstPaymentYear:first,valueDiscount:rate}).gap)})),note:'Each cell keeps the entered upfront amount, payment size and count, then replaces the first date and effective annual discount rate. Negative amounts favor the upfront amount on this valuation measure; positive amounts favor the payment stream. At zero discount, moving the dates leaves the undiscounted total unchanged. Colors do not account for nonpayment, tax differences or personal liquidity needs.'}
 ]};
}
