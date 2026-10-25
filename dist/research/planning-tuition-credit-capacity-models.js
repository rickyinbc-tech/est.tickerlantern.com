export const tuitionCreditCapacityDefinitions={
  tuitionCreditCapacity:{title:'Separate the tuition amount, usable tax relief and repayment of prepaid tax',fields:[
    ['creditTuition','Assumed eligible tuition amount for this illustration (CAD)',8000,0,50000,500],
    ['creditFactor','Baseline credit conversion rate only; not a full tax-return calculation (%)',14,0,20,.5],
    ['creditTax','Tax otherwise payable within this isolated comparison (CAD)',600,0,50000,100],
    ['creditPrepaid','Matching tax prepayments assigned to this same comparison (CAD)',600,0,50000,100]
  ]}
};

export function tuitionCreditCapacityPlan(input,{tuition=input.creditTuition,tax=input.creditTax,prepaid=input.creditPrepaid}={}){
  const potential=tuition*input.creditFactor/100,used=Math.min(potential,tax),unabsorbed=potential-used,after=tax-used;
  const settlement=prepaid-after,refund=Math.max(0,settlement),balance=Math.max(0,-settlement);
  const withoutSettlement=prepaid-tax;
  return {potential,used,unabsorbed,after,settlement,refund,balance,withoutSettlement,
    refundWithout:Math.max(0,withoutSettlement),balanceWithout:Math.max(0,-withoutSettlement)};
}

export function tuitionCreditCapacityResult(kind,input){
  if(kind!=='tuitionCreditCapacity')throw Error('Unknown tuition-credit topic.');
  const p=tuitionCreditCapacityPlan(input);
  const span=Math.max(2000,Math.ceil(Math.max(input.creditPrepaid,input.creditTax)*1.25/1000)*1000);
  return {metrics:[['Baseline credit value before the tax-capacity limit',p.potential,'money'],['Tax reduction absorbed in this illustration',p.used,'money'],['Refund of entered prepayments in this illustration',p.refund,'money']],
    note:'Hypothetical closed tax-and-prepayment exercise in CAD, not a completed return, eligibility determination or CRA refund estimate. Tuition is an assumed eligible amount; the entered conversion rate produces a baseline value only. Usable relief is capped at the entered tax otherwise payable. Tax and prepayments must describe the same scope. Unabsorbed baseline value is not a Schedule 11 tuition carryforward balance, a future credit valuation or a cash entitlement. No deduction from taxable income, Top-Up Tax Credit, other credit ordering, transfers, future-year use, provincial tax, Alternative Minimum Tax, refundable benefit, interest or assessment offset is calculated. The 14% default reflects the general 2026 federal baseline described by Finance Canada; it does not implement all 2026 return rules. A refund here comes only from matched prepayments exceeding the modeled remaining tax, and cannot exceed those prepayments.',
    charts:[
      {id:'tuition-credit-tax-bridge',type:'waterfall',title:'The applied non-refundable credit can reduce this tax amount to zero',unit:'money',rows:[{label:'Tax otherwise payable',value:input.creditTax},{label:'Baseline credit absorbed',value:-p.used}],totalLabel:'Tax remaining in this example',note:'The first step is independently entered tax, rather than taxable income or tuition. The reduction is the smaller of that tax amount and the baseline credit value. The endpoint cannot be negative; a leftover credit value is not added as a cash payment.'},
      {id:'tuition-credit-capacity-cases',type:'stackbar',title:'The same tuition input can meet different amounts of tax capacity',unit:'money',seriesNames:['Baseline value used to reduce tax','Baseline value not absorbed here'],rows:[0,600,2000].map(tax=>{const q=tuitionCreditCapacityPlan(input,{tax});return {label:'$'+tax.toLocaleString('en-CA')+' tax',values:[q.used,q.unabsorbed]};}),note:'Each row replaces tax otherwise payable while retaining the entered tuition and conversion rate. Every row totals the same potential baseline credit value. The unabsorbed segment is expressed in illustrative tax-value dollars, not tuition-amount dollars and not an actual carryforward record.'},
      {id:'tuition-credit-prepayment-lines',type:'line',title:'A tax reduction and a refund of prepaid tax are separate calculations',unit:'money',xUnit:'money',xLabel:'Matched tax prepaid (CAD)',series:[{name:'With the modeled credit',rows:Array.from({length:21},(_,i)=>({x:span*i/20,value:span*i/20-p.after}))},{name:'Without this modeled credit',rows:Array.from({length:21},(_,i)=>({x:span*i/20,value:span*i/20-input.creditTax})),dash:true}],note:'Positive values mean a refund of matched prepayments; negative values mean tax still to pay. At zero prepayments, this non-refundable credit cannot produce a positive cash refund. The vertical difference equals the tax relief used, even when the effect first reduces a balance owing rather than generating a refund. No other credits, payments or offsets are included.'},
      {id:'tuition-credit-relief-grid',type:'heatmap',title:'Baseline tax relief stops growing when the available tax is exhausted',unit:'money',unitLabel:'Tax relief in CAD · columns are assumed eligible tuition amounts',columns:[0,4000,8000,12000].map(tuition=>'$'+tuition/1000+'k'),rows:[0,500,1500].map(tax=>({label:'$'+tax.toLocaleString('en-CA')+' tax',values:[0,4000,8000,12000].map(tuition=>tuitionCreditCapacityPlan(input,{tuition,tax}).used)})),note:'Rows replace tax capacity and columns replace assumed eligible tuition. The selected conversion rate stays fixed. Cells report the absorbed tax reduction only; changing prepayments does not change them. These values are not refunds, a marginal tax deduction or a valuation of future unused tuition amounts.'}
    ]};
}
