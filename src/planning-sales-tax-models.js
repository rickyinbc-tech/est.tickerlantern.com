export const salesTaxDefinitions={
  salesTax:{title:'Trace a hypothetical six-month GST/HST cash ledger',fields:[
    ['opening','Opening business cash, with no opening sales-tax balance (CAD)',5000,0,100000,500],
    ['sales','Monthly customer receipts excluding GST/HST (CAD)',10000,0,100000,500],
    ['outputTax','GST/HST separately charged and received each month (CAD)',1300,0,15000,100],
    ['costs','Monthly operating cash payments excluding GST/HST (CAD)',6000,0,100000,500],
    ['inputTax','GST/HST paid each month and assumed fully eligible for ITCs (CAD)',400,0,15000,100]
  ]}
};
export function salesTaxPath(input){
  let bank=input.opening,unsettled=0,pendingRefund=0,remitted=0;
  const rows=[{x:0,value:bank,reserve:0,afterReserve:bank,receivable:0,remittance:0}];
  for(let month=1;month<=6;month++){
    let remittance=0;
    if(month===4){
      remittance=Math.max(0,unsettled);bank-=remittance;remitted+=remittance;
      pendingRefund+=Math.max(0,-unsettled);unsettled=0;
    }
    bank+=input.sales+input.outputTax-input.costs-input.inputTax;
    unsettled+=input.outputTax-input.inputTax;
    const reserve=Math.max(0,unsettled),receivable=pendingRefund+Math.max(0,-unsettled);
    rows.push({x:month,value:bank,reserve,afterReserve:bank-reserve,receivable,remittance});
  }
  return {rows,end:rows.at(-1),remitted};
}
export function salesTaxResult(kind,input){
  if(kind!=='salesTax')throw Error('Unknown sales-tax topic.');
  const p=salesTaxPath(input);
  return {metrics:[['Business cash funding position after month 6',p.end.value,'money'],['Positive GST/HST amount still reserved at month 6',p.end.reserve,'money'],['Cash position after that reserve, before other obligations',p.end.afterReserve,'money']],note:'Original hypothetical six-month management ledger for an assumed GST/HST registrant using a simplified regular-method illustration. Sales, output tax, operating cash costs and input tax are separately entered monthly amounts. All invoices are paid and all expense/input-tax payments occur in the same month. The input-tax amount is assumed fully eligible, documented and claimed in the relevant period; eligibility is not tested. Months 1–3 form one model period and months 4–6 a second. At the start of month 4, the positive first-period net tax is remitted; a negative first-period amount becomes a separate potential receivable with no assumed refund cash during these six months. This is a chosen planning calendar, not a calculated statutory filing or payment deadline. Positive unsettled net tax stays within the bank position but is reserved; a receivable is not added to cash. No opening tax liability, owner draw, income-tax provision, payroll obligation, inventory, capital transaction, adjustment, quick method, tax rate or registration test is calculated. Negative cash positions are unfunded needs, not an assumed overdraft.',charts:[
    {id:'sales-tax-receipts',type:'stackbar',title:'The customer’s payment includes sales and a separate tax amount',unit:'money',unitLabel:'Monthly customer cash received in the illustration (CAD)',seriesNames:['Receipts excluding GST/HST','GST/HST charged and received'],rows:[{label:'Each model month',values:[input.sales,input.outputTax]}],note:'The full stack enters the modeled bank account, but the tax component is tracked separately from receipts excluding tax. No statutory GST/HST rate is inferred from these amounts. Actual charged tax and eligibility need supported records; these independently entered values do not determine the tax treatment of a sale.'},
    {id:'sales-tax-bank-reserve',type:'line',title:'Read the bank position beside the amount left after the positive tax reserve',unit:'money',xLabel:'Completed model months',series:[{name:'Business cash funding position',rows:p.rows.map(r=>({x:r.x,value:r.value}))},{name:'Cash position after positive GST/HST reserve',rows:p.rows.map(r=>({x:r.x,value:r.afterReserve})),dash:true}],note:'Both lines describe the same resources. The gap is the positive unsettled net-tax reserve, not extra cash or a second account. Values after the reserve still precede income tax, owner draws and other excluded commitments. Points show month-end positions; the start-of-month-4 remittance is included in that month’s endpoint, not shown as an intramonth path.'},
    {id:'sales-tax-liability-receivable',type:'groupbar',title:'A potential tax receivable remains separate from bank cash',unit:'money',unitLabel:'End-of-month positive tax reserve and potential tax receivable (CAD)',seriesNames:['Positive unsettled net-tax reserve','Potential net-tax receivable, no cash assumed'],rows:p.rows.slice(1).map(r=>({label:'Month '+r.x,values:[r.reserve,r.receivable]})),note:'A positive reserve is held back from the cash position. A negative current-period net-tax amount, plus any negative first-period amount awaiting cash, is tracked as a potential receivable rather than a negative reserve or automatic deposit. The illustration assumes the entered ITCs qualify; it does not establish a refund entitlement, approval date or processing time.'},
    {id:'sales-tax-bank-reconcile',type:'waterfall',title:'Reconcile what moved through the bank without deducting the reserve twice',unit:'money',rows:[{label:'Opening cash',value:input.opening},{label:'Six months of receipts excluding tax',value:6*input.sales},{label:'Six months of output tax received',value:6*input.outputTax},{label:'Operating cash payments excluding tax',value:-6*input.costs},{label:'Input tax paid with those costs',value:-6*input.inputTax},{label:'First-period positive tax remitted',value:-p.remitted}],totalLabel:'Cash funding position after month 6',note:'Only actual modeled receipts and payments enter this bridge. The positive tax reserve remains within the closing cash position and is not another bank payment. The after-reserve metric deducts it once for planning purposes. A potential refund that has not arrived contributes no cash receipt to the waterfall.'}
  ]};
}
