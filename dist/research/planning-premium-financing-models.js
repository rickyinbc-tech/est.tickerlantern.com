import {premiumSchedule} from './planning-premium-financing-data.js';
export const premiumFinancingDefinitions={
 mortgagePremium:{title:'Separate a financed insurance premium from closing cash',fields:[
  ['price','Hypothetical home price (CAD)',500000,100000,500000,10000],['downPct','Down payment (% of price)',10,5,19.99,.01],
  ['apr','Annual loan-rate assumption, compounded semi-annually (%)',5,0,10,.25],['amortYears','Whole amortization years, with no rate changes',25,5,25,1],
  ['premiumTax','Independently verified tax assumption (% of premium)',0,0,15,.5],['otherClosing','Other closing costs paid in cash (CAD)',5000,0,50000,500],
  ['closingCash','Cash available before closing (CAD)',65000,0,500000,1000]
 ]}
};
export function mortgagePremiumPlan(d){
 const down=d.price*d.downPct/100,base=d.price-down,rate=d.downPct>=15?.028:d.downPct>=10?.031:.04;
 const premium=base*rate,loan=base+premium,tax=premium*d.premiumTax/100,q=(1+d.apr/200)**(1/6)-1,n=d.amortYears*12;
 const paymentFor=amount=>q===0?amount/n:amount*q/(1-(1+q)**(-n));
 const basePayment=paymentFor(base),premiumPayment=paymentFor(premium),payment=paymentFor(loan);
 let balance=premium,interest=0;const rows=[{x:0,balance,interest}];
 for(let month=1;month<=n;month++){
  const charge=balance*q;interest+=charge;balance=Math.max(0,balance+charge-premiumPayment);if(month===n)balance=0;rows.push({x:month,balance,interest});
 }
 const needed=down+tax+d.otherClosing,residual=d.closingCash-needed;
 return {down,base,rate,premium,loan,tax,q,n,basePayment,premiumPayment,payment,rows,interest,needed,residual};
}
export function premiumFinancingResult(kind,d){
 if(kind!=='mortgagePremium')throw Error('Unknown premium-financing planning topic.');
 const p=mortgagePremiumPlan(d);
 return {metrics:[['Insurance premium added to the mortgage',p.premium,'money'],['Monthly payment attributable to financed premium',p.premiumPayment,'money'],['Cash remaining after modeled closing payments',p.residual,'money']],note:'A hypothetical approved owner-occupied purchase using three selected CMHC premium-on-total-loan bands reviewed 25 October 2026. Price is capped at CAD 500,000 and down payment at 5%–19.99%; this is not an eligibility, minimum-down-payment or affordability decision. Traditional down payment and an amortization of at most 25 years are assumed. No portability credit, refund, non-traditional premium, surcharge or lender-specific adjustment is applied. The entire premium is financed, while entered premium tax and other closing costs are paid in cash. Tax defaults to zero as a placeholder, not a province-specific finding. Nominal annual loan rate is compounded semi-annually, with equivalent monthly payments, held unchanged over the full amortization. Calculations are unrounded until display; no prepayments, renewals, later fees or market-rate comparison are modeled.',charts:[
  {id:'mortgage-premium-official-bands',type:'bar',title:'Selected CMHC published premium-on-total-loan bands',unit:'percent',unitLabel:'Premium as a percentage of base loan · labels are published loan-to-value bands',rows:premiumSchedule.rows,source:premiumSchedule.url,sourceLabel:'CMHC · published premium table, reviewed 25 October 2026',evidence:'Official premium schedule · selected bands',note:'These are published pricing bands, not statistical averages or individualized quotes. The premium-on-increase column for portability and the non-traditional-down-payment row are excluded. This reference chart stays fixed when the hypothetical controls change.'},
  {id:'mortgage-premium-opening-debt',type:'stackbar',title:'The financed premium increases the opening mortgage balance',unit:'money',seriesNames:['Base loan after down payment','Insurance premium financed'],rows:[5,10,15,19.99].map(downPct=>{const x=mortgagePremiumPlan({...d,downPct});return {label:downPct+'% down',values:[x.base,x.premium]};}),note:'Each bar uses the same selected home price but a different cash down payment. It adds only the base loan and financed premium. The down payment is household cash supplied separately, not a third debt component. Different down payments also leave different outside cash, so the bars do not rank whole-household wealth.'},
  {id:'mortgage-premium-repayment',type:'line',title:'Repay the premium principal while accumulating its interest cost',unit:'money',xLabel:'Completed monthly payments',series:[{name:'Financed premium principal still outstanding',rows:p.rows.map(r=>({x:r.x,value:r.balance}))},{name:'Cumulative interest attributable to financed premium',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.interest}))}],note:'Both components use the same rate and amortization as the base loan. The incremental payment can be isolated because the payment formula is linear in principal. The assumed rate stays unchanged for the full horizon; actual mortgage terms and renewal rates can differ.'},
  {id:'mortgage-premium-closing-cash',type:'waterfall',title:'Financing the premium does not remove the other closing cash needs',unit:'money',rows:[{label:'Cash available before closing',value:d.closingCash},{label:'Cash down payment',value:-p.down},{label:'Entered tax on insurance premium',value:-p.tax},{label:'Other closing costs paid in cash',value:-d.otherClosing}],totalLabel:'Cash remaining after modeled closing payments',note:'The financed insurance premium is already part of mortgage debt and is not deducted again from this cash ledger. Entered premium tax is paid outside the loan. A negative endpoint is an unfunded cash need; zero tax is only the default assumption and must be replaced when applicable.'}
 ]};
}
