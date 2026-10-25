export const familyReceivableDefinitions={
 familyReceivable:{title:'Stress the lender’s own bill before relying on scheduled repayments',fields:[
  ['cash','Accessible cash before the family advance (CAD)',60000,0,250000,1000],
  ['advance','Interest-free principal advanced at month zero (CAD)',20000,0,100000,1000],
  ['monthlySurplus','Monthly cash surplus after ordinary spending (CAD; can be negative)',500,-2000,5000,100],
  ['repayment','Scheduled month-end principal repayment (CAD)',1000,0,10000,100],
  ['firstRepayMonth','First scheduled repayment month',6,1,48,1],
  ['repayDelayMonths','Stress delay shifting all repayments (whole months)',12,0,36,1],
  ['personalBill','Lender’s separate one-time bill (CAD)',50000,0,250000,1000],
  ['personalBillMonth','Month of the lender’s separate bill',12,1,48,1],
  ['months','Reporting window (whole months)',24,12,48,1]
 ]}
};
export function familyLoanCash(input,delay=0,lend=true) {
 const principal=lend?input.advance:0;let cash=input.cash-principal,unpaid=principal,received=0,min=cash;
 const rows=[{x:0,cash,unpaid,repayment:0,bill:0}];
 for(let month=1;month<=input.months;month++) {
  const repayment=lend&&month>=input.firstRepayMonth+delay?Math.min(unpaid,input.repayment):0;
  const bill=month===input.personalBillMonth?input.personalBill:0;
  received+=repayment;unpaid=Math.max(0,unpaid-repayment);cash+=input.monthlySurplus+repayment-bill;min=Math.min(min,cash);
  rows.push({x:month,cash,unpaid,repayment,bill});
 }
 return {rows,cash,unpaid,received,min,extraStartingCash:Math.max(0,-min)};
}
export function familyReceivableResult(kind,input) {
 if(kind!=='familyReceivable')throw Error('Unknown family-receivable topic.');
 const keep=familyLoanCash(input,0,false),onTime=familyLoanCash(input),delayed=familyLoanCash(input,input.repayDelayMonths);
 const dates=[...new Set([Math.min(6,input.months),Math.min(12,input.months),Math.min(18,input.months),input.months])].sort((a,b)=>a-b);
 return {metrics:[['Cash immediately after the entered family advance',input.cash-input.advance,'money'],['Extra initial cash needed to avoid a negative delayed-case ledger',delayed.extraStartingCash,'money'],['Unpaid original principal at the end of the delayed-case window',delayed.unpaid,'money']],note:'Original interest-free family-loan cash illustration, not a contract, collection forecast or fair-value estimate. The principal leaves accessible cash at month zero. Scheduled principal receipts begin at the entered first repayment month and repeat monthly, capped at the unpaid principal; the delayed case shifts the entire receipt schedule by the entered delay. Repayment is a transfer from unpaid principal into cash, not additional interest income. Each month’s ordinary cash surplus and any repayment arrive before the lender’s separate bill is paid at that month-end. Negative ledger values show an unfunded amount, not an authorised overdraft or an automatically financed payment. Extra initial cash is the amount needed to lift the entire selected ledger to zero or above; it includes any underlying budget deficit as well as the loan’s timing effect. No interest, tax, fees, default probability, collateral, enforcement or assumed credit line is modeled. Unpaid principal is a nominal record of original principal not yet received, not proof of collectability or spendable wealth. Only events within the reporting window appear; an excluded later bill or repayment is not cancelled. The keep-cash control advances no family money and therefore does not provide the same assistance.',charts:[
  {id:'family-loan-cash-advance',type:'waterfall',title:'The advance leaves accessible cash before any repayment is received',unit:'money',rows:[{label:'Accessible cash before advance',value:input.cash},{label:'Principal advanced to family',value:-input.advance}],totalLabel:'Cash after the advance',evidence:'Hypothetical lender cash transfer',note:'The unpaid principal record starts at the amount advanced, but it is not added back to this cash bridge. A household cannot spend the receivable as if the borrower had already repaid it. If the advance exceeds starting cash, the negative endpoint identifies an immediate funding gap; no financing source is automatically supplied.'},
  {id:'family-loan-lender-cash-calendar',type:'line',title:'The lender’s bill can arrive before the repayment cash',unit:'money',xLabel:'Months from the initial advance',series:[{name:'Keep cash: no family advance',rows:keep.rows.map(r=>({x:r.x,value:r.cash}))},{name:'Advance: repayments on schedule',rows:onTime.rows.map(r=>({x:r.x,value:r.cash})),dash:true},{name:'Advance: repayments shifted by the stress delay',rows:delayed.rows.map(r=>({x:r.x,value:r.cash}))}],evidence:'Hypothetical receipt schedules · no likelihood assigned',note:'The ordinary surplus and one-time bill are identical in all three cases. The control retains cash and makes no family advance. The other cases use the same principal and repayment amount with different receipt dates. Lines join discrete monthly ledger observations. Values below zero identify funding that must be arranged separately; later receipts do not retroactively pay an earlier bill. Earlier intramonth bill dates can require an additional timing buffer.'},
  {id:'family-loan-extra-starting-cash',type:'bar',title:'Initial cash needed in addition to the entered amount',unit:'money',rows:[{label:'Keep cash: no family advance',value:keep.extraStartingCash},{label:'Advance: on-schedule receipts',value:onTime.extraStartingCash},{label:'Advance: delayed receipts',value:delayed.extraStartingCash}],evidence:'Hypothetical peak funding needs',note:'Each bar is the largest negative ledger amount over the whole selected window, floored at zero. Adding that much cash at the start would prevent a negative ledger in the respective scenario under the model’s timing. It is not the loan loss, a recommendation to borrow or an amount due from the family member. The keep-cash bar can itself be positive if the lender’s ordinary budget and separate bill already exceed available resources.'},
  {id:'family-loan-bill-delay-matrix',type:'heatmap',title:'Peak funding need when the lender’s bill and repayment delay change',unit:'money',columns:[0,6,12,18].map(v=>v+' mo'),rows:dates.map(personalBillMonth=>({label:'Bill mo '+personalBillMonth,values:[0,6,12,18].map(delay=>familyLoanCash({...input,personalBillMonth},delay).extraStartingCash)})),evidence:'Hypothetical two-input cash sensitivity',note:'Columns replace the delay applied to the original repayment schedule. Rows replace the month of the lender’s bill, using dates within the selected reporting window. Cells show extra initial cash needed to keep that entire loan-case ledger non-negative, not simply the final balance. All other inputs remain selected assumptions. No probability, legal recovery date or assessment of a borrower is inferred.'}
 ]};
}
