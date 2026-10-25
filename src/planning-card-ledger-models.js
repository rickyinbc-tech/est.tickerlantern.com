export const cardLedgerDefinitions={cardLedger:{title:'Reconcile purchases, card repayments and transfers over twelve months',fields:[
  ['ledgerIncome','Monthly take-home receipts (CAD)',5000,0,20000,250],
  ['ledgerCashShare','Share of receipts spent directly from chequing (%)',60,0,100,5],
  ['ledgerCardShare','Share of the remaining receipts spent on the card (%)',40,0,100,5],
  ['ledgerSaveShare','Share of the after-purchase surplus transferred to savings (%)',50,0,100,5],
  ['ledgerChecking','Opening chequing balance (CAD)',10000,0,100000,1000],
  ['ledgerSaving','Opening separate savings balance (CAD)',5000,0,100000,1000]
]}};
export function cardPurchaseLedger(i){
  const cashPurchase=i.ledgerIncome*i.ledgerCashShare/100;
  const cardPurchase=(i.ledgerIncome-cashPurchase)*i.ledgerCardShare/100;
  const surplus=i.ledgerIncome-cashPurchase-cardPurchase,transfer=surplus*i.ledgerSaveShare/100;
  let checking=i.ledgerChecking,saving=i.ledgerSaving,payable=0,consumption=0,purchaseOutflow=0;
  const opening=checking+saving;
  const rows=[{x:0,checking,saving,payable,consumption,purchaseOutflow,net:opening,transfer:0,repayment:0}];
  for(let month=1;month<=12;month++){
    const repayment=payable;
    checking+=i.ledgerIncome-cashPurchase-repayment-transfer;saving+=transfer;
    payable=cardPurchase;consumption+=cashPurchase+cardPurchase;purchaseOutflow+=cashPurchase+repayment;
    rows.push({x:month,checking,saving,payable,consumption,purchaseOutflow,net:checking+saving-payable,transfer,repayment});
  }
  const yearEnd={...rows.at(-1)},repayment=payable;
  checking-=repayment;purchaseOutflow+=repayment;payable=0;
  rows.push({x:13,checking,saving,payable,consumption,purchaseOutflow,net:checking+saving,transfer:0,repayment});
  return {cashPurchase,cardPurchase,surplus,transfer,opening,rows,yearEnd,settled:rows.at(-1)};
}
export function cardLedgerResult(kind,i){
  if(kind!=='cardLedger')throw Error('Unknown card-ledger topic.');
  const p=cardPurchaseLedger(i),series=(name,key,dash=false)=>({name,dash,rows:p.rows.map(r=>({x:r.x,value:r[key]}))});
  return {metrics:[['Purchases consumed during months 1–12',p.yearEnd.consumption,'money'],['Card purchase liability at month 12',p.yearEnd.payable,'money'],['Increase in listed net financial assets',p.yearEnd.net-p.opening,'money']],note:'Original twelve-month bookkeeping illustration. Each month receives take-home income first, pays the preceding month’s card purchases, pays direct chequing purchases, makes the new card purchases and transfers the selected share of the after-purchase surplus to separate savings. The card starts at zero and its purchases are repaid in the following model month without interest or fees; this is an authored timing assumption, not a statement-date or grace-period calculation. All purchases are consumed services/goods with no retained asset value. Spending percentages are nested: the card share applies only to income left after direct purchases; the saving share applies only after both purchase categories. These definitions keep total consumption within income. Position 13 settles the last card bill only, with no new income, purchase or savings transfer; it is not a forecast of a thirteenth ordinary month. Bank balances earn no return. Listed net financial assets equal chequing plus savings minus the card purchase liability, not a complete household net-worth statement. Monthly aggregates do not establish cash availability on actual payment dates.',charts:[
    {id:'card-ledger-period-flows',type:'groupbar',title:'Consumption and purchase-related bank outflows occur at different times',unit:'money',seriesNames:['Purchases consumed','Bank paid to merchants / card issuer'],rows:[
      {label:'Month 1',values:[p.cashPurchase+p.cardPurchase,p.cashPurchase]},
      {label:'Each of months 2–12',values:[p.cashPurchase+p.cardPurchase,p.cashPurchase+p.cardPurchase]},
      {label:'13 · final bill settlement only',values:[0,p.cardPurchase]}
    ],note:'The middle row is the amount in EACH of eleven ordinary months, not their combined total. Bank outflows exclude transfers between the two household bank accounts. Position 13 is a settlement-only event outside the twelve-month consumption window.'},
    {id:'card-ledger-cumulative',type:'line',title:'The unpaid purchase liability reconciles the cumulative timing gap',unit:'money',xLabel:'Month · 13 = settlement only',series:[series('Cumulative purchases consumed','consumption'),series('Cumulative purchase-related bank outflow','purchaseOutflow',true)],note:'At month 12, cumulative consumption minus merchant/card bank outflow equals the last month’s unpaid card purchases. Settlement closes that gap without adding consumption. Connecting lines summarize month-end totals, not daily transaction timing.'},
    {id:'card-ledger-recording-rules',type:'bar',title:'Three recording rules give different totals for the same twelve months',unit:'money',rows:[
      {label:'Purchases recorded once',value:p.yearEnd.consumption},
      {label:'Bank payments only',value:p.yearEnd.purchaseOutflow},
      {label:'Purchases plus repayments',value:p.yearEnd.consumption+11*p.cardPurchase}
    ],note:'Bank payments alone are a valid measure of this window’s purchase-related CASH outflow, but they are not the window’s consumption total. Adding the eleven card repayments to purchases counts settled card purchases twice. Settlement position 13 is excluded from all three twelve-month totals.'},
    {id:'card-ledger-wealth-bridge',type:'waterfall',title:'Consumption reduces the listed net position; internal transfers do not',unit:'money',totalLabel:'Month 12 · net financial assets',rows:[
      {label:'Opening net financial assets',value:p.opening},
      {label:'Twelve take-home receipts',value:12*i.ledgerIncome},
      {label:'Direct purchases consumed',value:-12*p.cashPurchase},
      {label:'Card purchases consumed',value:-12*p.cardPurchase},
      {label:'Savings transfers · net effect',value:0},
      {label:'Card repayments · net effect',value:0}
    ],note:'A card repayment reduces cash and the purchase liability by equal amounts. A savings transfer reduces chequing and increases savings equally. Both have zero immediate effect on this consolidated net position; they remain real account movements. The purchase liability counts even while the bill is still within its assumed payment window.'},
    {id:'card-ledger-balances',type:'groupbar',title:'Keep both bank accounts and the remaining card liability in the snapshot',unit:'money',seriesNames:['Chequing asset','Savings asset','Card purchase liability'],rows:[
      {label:'Opening',values:[i.ledgerChecking,i.ledgerSaving,0]},
      {label:'End of month 12',values:[p.yearEnd.checking,p.yearEnd.saving,p.yearEnd.payable]},
      {label:'After final settlement only',values:[p.settled.checking,p.settled.saving,0]}
    ],note:'These are separate balance categories, not additive positive resources. Subtract the card liability from the two bank assets. Final settlement reduces chequing and the liability together; savings and the consolidated net amount stay unchanged. Actual due dates still require a dated cash plan.'}
  ]};
}
