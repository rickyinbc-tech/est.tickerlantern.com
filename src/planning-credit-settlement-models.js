export const creditSettlementDefinitions={creditSettlement:{title:'Separate the usable credit from the payments already made',fields:[
 ['settlementTax','Tax charge before the selected credit, for one compatible tax bucket (CAD)',3000,0,50000,500],
 ['settlementCredit','Available credit value after its tax-offset calculation (CAD)',5000,0,50000,500],
 ['settlementPaid','Tax payments already credited toward this simplified settlement (CAD)',1200,0,50000,200]
]}};
export function creditSettlementLedger(i){
 const used=Math.min(i.settlementTax,i.settlementCredit),unused=i.settlementCredit-used;
 const remainingTax=i.settlementTax-used;
 return {used,unused,remainingTax,baselineBalance:i.settlementTax-i.settlementPaid,
  nonrefundableBalance:remainingTax-i.settlementPaid,refundableBalance:i.settlementTax-i.settlementCredit-i.settlementPaid};
}
export function creditSettlementResult(kind,i){
 if(kind!=='creditSettlement')throw Error('Unknown credit-settlement topic.');
 const p=creditSettlementLedger(i),creditMax=Math.max(1000,2*i.settlementTax,i.settlementCredit),paidMax=Math.max(1000,2*i.settlementTax,i.settlementPaid);
 const creditXs=[...new Set([i.settlementTax,i.settlementCredit,...Array.from({length:41},(_,j)=>creditMax*j/40)])].sort((a,b)=>a-b);
 const creditRows=creditXs.map(x=>({x,nonrefundable:Math.min(i.settlementTax,x),refundable:x}));
 const paidRows=Array.from({length:41},(_,j)=>{const x=paidMax*j/40;return {x,baseline:i.settlementTax-x,nonrefundable:p.remainingTax-x,refundable:i.settlementTax-i.settlementCredit-x};});
 const series=(name,rows,key,dash=false)=>({name,dash,rows:rows.map(r=>({x:r.x,value:r[key]}))});
 return {metrics:[['Non-refundable credit used against the modeled tax',p.used,'money'],['Credit value unapplied in this current-period illustration',p.unused,'money'],['Non-refundable case settlement · negative means refund',p.nonrefundableBalance,'money']],note:'Original single-period arithmetic for one compatible tax bucket. Tax before the selected credit and the credit’s already-calculated tax-offset value are entered independently; no income, deduction, bracket, basic personal amount, tax year, provincial/federal conversion or entitlement is determined. The credit input is NOT an eligible expense or a credit-base amount that still needs multiplication by a statutory percentage. Non-refundable usage is capped at the entered tax. The refundable comparison hypothetically uses the same entered credit value under a different refundability rule; these are alternative teaching cases, not a choice of legal classification or two claims to combine. Payments already credited are then subtracted once. A positive settlement balance means owing; a negative balance means a modeled refund before offsets, reassessment or other adjustments. Unapplied non-refundable value has no current-period cash benefit here; no carryforward, transfer or permanent-expiry conclusion is calculated. No payment date, receipt guarantee, interest, benefit phaseout or full tax return is modeled.',charts:[
  {id:'credit-settlement-usage',type:'stackbar',title:'The same available credit value can have a different current-period use',unit:'money',seriesNames:['Offsets modeled tax','Unapplied here','Refundable excess'],rows:[
   {label:'Non-refundable teaching case',values:[p.used,p.unused,0]},
   {label:'Refundable teaching case',values:[p.used,0,p.unused]}
  ],note:'Every row sums to the entered credit value. The tax-offset portion cannot exceed the entered tax charge. The remaining portion is unapplied in the non-refundable case and refundable only under the separate hypothetical refundable rule. Real credits have their own eligibility and computation rules.'},
  {id:'credit-settlement-bridge',type:'waterfall',title:'Previously paid tax can come back after a non-refundable credit reduces the charge',unit:'money',totalLabel:'Balance owing · negative means refund',rows:[
   {label:'Tax before the selected credit',value:i.settlementTax},
   {label:'Non-refundable credit actually used',value:-p.used},
   {label:'Payments already credited',value:-i.settlementPaid}
  ],note:'This bridge does not refund the unapplied part of a non-refundable credit. It reconciles the reduced tax charge with payments already made. A refund can therefore coexist with a non-refundable credit without turning its unused value into a refundable benefit.'},
  {id:'credit-settlement-relief',type:'line',title:'A non-refundable credit stops reducing this tax charge when it reaches zero',unit:'money',xUnit:'money',xLabel:'Available credit (CAD)',series:[series('Non-refundable · current-period benefit',creditRows,'nonrefundable'),series('Refundable · modeled total benefit',creditRows,'refundable',true)],note:'The entered tax charge stays fixed while the available credit value varies. The horizontal axis already uses tax-offset dollars. The non-refundable line plateaus at the tax charge; the refundable comparison can exceed that charge. This does not model an actual program’s income tests, caps, transfers or carryforward.'},
  {id:'credit-settlement-payments',type:'line',title:'Changing prior payments changes settlement without changing the credit’s tax benefit',unit:'money',xUnit:'money',xLabel:'Tax payments already made (CAD)',series:[series('No selected credit · settlement',paidRows,'baseline'),series('Non-refundable case · settlement',paidRows,'nonrefundable',true),series('Refundable comparison · settlement',paidRows,'refundable')],note:'Tax and available credit stay fixed across these alternative prior-payment amounts. Zero separates owing from a modeled refund. Increasing tax already paid moves each settlement down equally; it does not create additional tax relief or a new gain in household wealth. Curves show a range of payment assumptions, while the metric uses the selected payment input.'}
 ]};
}
