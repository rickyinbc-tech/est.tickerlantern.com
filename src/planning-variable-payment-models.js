export const variablePaymentDefinitions={
  variableMortgage:{title:'Explore a fixed payment after a variable-rate change',fields:[
    ['principal','Opening mortgage debt (CAD)',400000,0,2000000,10000],['initialRate','Initial nominal annual rate, compounded monthly (%)',5,0,18,.25],
    ['laterRate','Nominal annual rate after the change (%)',8,0,18,.25],['fixedPayment','Monthly payment kept in the fixed-payment path (CAD)',2400,0,10000,100],
    ['laterPayment','Alternative monthly payment after the rate change (CAD)',3200,0,10000,100],['changeAfter','Completed months before the rate change',12,0,23,1],
    ['months','Comparison horizon (whole months)',60,24,120,12]
  ]}
};
export function variableMortgagePath(input,alternate=false){
  let balance=input.principal,interest=0,paid=0,capitalized=0;
  const rows=[{x:0,value:balance,interest,paid,capitalized,charge:0,payment:0,principal:0}];
  for(let month=1;month<=input.months;month++){
    const changed=month>input.changeAfter,rate=changed?input.laterRate:input.initialRate;
    const charge=balance*rate/1200,requested=changed&&alternate?input.laterPayment:input.fixedPayment,payment=Math.min(requested,balance+charge);
    interest+=charge;paid+=payment;capitalized+=Math.max(0,charge-payment);balance=Math.max(0,balance+charge-payment);
    if(balance<1e-8)balance=0;
    rows.push({x:month,value:balance,interest,paid,capitalized,charge,payment,principal:payment-charge});
  }
  return {rows,balance,interest,paid,capitalized};
}
const series=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function variablePaymentResult(kind,input){
  if(kind!=='variableMortgage')throw Error('Unknown variable-payment topic.');
  const fixed=variableMortgagePath(input),alternate=variableMortgagePath(input,true),resetDebt=fixed.rows[input.changeAfter].value,first=fixed.rows[input.changeAfter+1];
  const trigger=resetDebt>0?input.fixedPayment*12/resetDebt:null;
  return {metrics:[trigger==null?['Illustrative trigger at the change',null,'custom','No debt at the change']:['Illustrative trigger at the change',trigger,'percent'],['Interest added to debt in the fixed-payment path',fixed.capitalized,'money'],['Fixed-payment debt at the horizon',fixed.balance,'money']],note:'Hypothetical monthly-compounding loan illustration, not a lender agreement or approval to capitalize interest. Annual quoted rates are divided by twelve. Interest is charged on opening monthly debt; the selected payment arrives at month-end. When payment is below interest, the shortfall is added to debt in this model. The alternative uses the same opening path, then the separately selected payment after the rate change. No fees, arrears charges, renewal, property tax, penalty or lender intervention is calculated. The illustrative trigger is payment × 12 ÷ debt at the change, and must not substitute for a contractual trigger rate.',charts:[
    {id:'variable-mortgage-debt-path',type:'line',title:'A stable cash payment can coexist with rising debt',unit:'money',xLabel:'Completed model months',series:[series('Payment kept fixed',fixed.rows,'value'),series('Selected alternative payment after change',alternate.rows,'value',{dash:true})],note:'Both paths share the initial rate and payment. After the change, rates remain the same across paths; the selected payment can differ. New borrowing is excluded, while unpaid modeled interest is capitalized.'},
    {id:'variable-mortgage-principal-bridge',type:'waterfall',title:'First month after the change: payment minus interest',unit:'money',rows:[{label:'Cash payment in the fixed-payment path',value:first.payment},{label:'Less interest charged for that month',value:-first.charge}],totalLabel:'Principal reduction, or debt added if negative',note:'This bridge allocates one payment; it is not an account balance. If the endpoint is negative, that amount of interest exceeds the payment and is added to debt in the hypothetical schedule.'},
    {id:'variable-mortgage-interest-path',type:'line',title:'Cumulative interest charged, including amounts added to debt',unit:'money',xLabel:'Completed model months',series:[series('Payment kept fixed',fixed.rows,'interest'),series('Selected alternative payment after change',alternate.rows,'interest',{dash:true})],note:'These totals are interest charged, not necessarily interest paid in cash. Added interest can generate further interest when it remains part of the next opening balance.'},
    {id:'variable-mortgage-payment-matrix',type:'heatmap',title:'First post-change month: principal change across rates and payments',unit:'money',signed:true,columns:['$1.8k pay','$2.4k','$3k','$3.6k'],rows:[4,6,8,10].map(rate=>({label:rate+'% rate',values:[1800,2400,3000,3600].map(payment=>{const charge=resetDebt*rate/1200;return Math.min(payment,resetDebt+charge)-charge;})})),note:'Every cell starts with the same modeled debt immediately before the rate change. Rows replace the nominal annual rate and columns replace the monthly payment. Positive values reduce principal; negative values add debt in the illustrative capitalization rule. This is neither a lender approval nor a quote.'}
  ]};
}
