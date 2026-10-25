import {remittanceCase} from './planning-payment-options-data.js';
export const paymentOptionDefinitions={
  cardRewards:{title:'Explore cash-back categories, a cap and annual costs',fields:[
    ['spend','Existing annual eligible purchases (CAD)',24000,0,120000,1000],['bonusShare','Share eligible for the bonus category (%)',40,0,100,5],
    ['bonusRate','Premium card: bonus-category cash back (%)',3,0,10,.25],['baseRate','Premium card: other cash back (%)',1,0,5,.25],
    ['bonusCap','Annual purchase amount eligible for bonus rate (CAD)',10000,0,100000,1000],['annualFee','Premium card annual fee (CAD)',120,0,1000,10],
    ['plainRate','No-fee comparison card: cash back on all purchases (%)',1,0,5,.25],['commonInterest','Independently entered annual interest paid on either card (CAD)',0,0,5000,50]
  ]},
  cashDiscount:{title:'Compare the same purchase, starting cash and monthly budget',fields:[
    ['price','All-in purchase price before a cash discount (CAD)',10000,100,100000,500],['cashDiscount','Discount available only for paying in full now (%)',5,0,20,.5],
    ['setupFee','Financing fee paid now in addition to instalments (CAD)',100,0,3000,25],['financeMonths','Number of equal month-end instalments',24,3,60,1],
    ['netReturn','Hypothetical effective annual account return after tax and costs (%)',3,0,8,.25]
  ]},
  remittanceBudget:{title:'Compare the CAD needed to deliver the same net foreign-currency amount',fields:[
    ['netForeign','Net amount the recipient needs per transfer (FCU)',1000,0,20000,100],['recipientFee','Recipient charge deducted in foreign-currency units (FCU)',0,0,100,1],
    ['referenceRate','Hypothetical reference rate: CAD per one FCU',1.4,.01,10,.01],['markupA','Service A: markup added to the reference CAD/FCU rate (%)',3,0,10,.25],
    ['feeA','Service A: sender fee paid in CAD (CAD)',0,0,100,1],['markupB','Service B: markup added to the reference CAD/FCU rate (%)',.5,0,10,.25],
    ['feeB','Service B: sender fee paid in CAD (CAD)',10,0,100,1],['transferCount','Number of identical transfers in the budget period',12,1,24,1]
  ]}
};

export function rewardBudget(d){
  const bonusPurchases=Math.min(d.spend*d.bonusShare/100,d.bonusCap),basePurchases=d.spend-bonusPurchases;
  const bonus=bonusPurchases*d.bonusRate/100,base=basePurchases*d.baseRate/100,gross=bonus+base;
  const plainGross=d.spend*d.plainRate/100,premiumNet=gross-d.annualFee-d.commonInterest,plainNet=plainGross-d.commonInterest;
  return {bonusPurchases,basePurchases,bonus,base,gross,plainGross,premiumNet,plainNet,advantage:premiumNet-plainNet};
}

// Both choices start with price + fee in cash and have the same monthly resources.
// The financed purchase is paid from that monthly budget; the cash buyer saves it.
export function cashDiscountPath(d){
  const initial=d.price+d.setupFee,cashPrice=d.price*(1-d.cashDiscount/100),payment=d.price/d.financeMonths;
  const monthlyRate=Math.expm1(Math.log1p(d.netReturn/100)/12);
  let paidNow=initial-cashPrice,financed=initial-d.setupFee;
  const rows=[{x:0,paidNow,financed,loan:d.price,paidNowNet:paidNow,financedNet:financed-d.price}];
  for(let month=1;month<=d.financeMonths;month++){
    paidNow=paidNow*(1+monthlyRate)+payment;financed*=1+monthlyRate;
    const loan=d.price*(1-month/d.financeMonths);
    rows.push({x:month,paidNow,financed,loan,paidNowNet:paidNow,financedNet:financed-loan});
  }
  return {rows,initial,cashPrice,payment,financedPrice:d.price+d.setupFee,extraCost:d.price+d.setupFee-cashPrice,advantage:financed-paidNow};
}

// Rates are CAD per FCU. A markup raises the CAD needed, rather than reducing it.
// The sender funds the common recipient charge so net receipt stays unchanged.
export function transferBudget(d,markup,fee){
  if(d.netForeign===0)return {quote:d.referenceRate*(1+markup/100),principal:0,recipient:0,markupCost:0,fee:0,total:0,extra:0,annualTotal:0,annualExtra:0};
  const foreign=d.netForeign+d.recipientFee,quote=d.referenceRate*(1+markup/100);
  const principal=d.netForeign*d.referenceRate,recipient=d.recipientFee*d.referenceRate,markupCost=foreign*d.referenceRate*markup/100;
  const total=foreign*quote+fee,extra=total-principal;
  return {quote,principal,recipient,markupCost,fee,total,extra,annualTotal:total*d.transferCount,annualExtra:extra*d.transferCount};
}

const series=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function paymentOptionResult(kind,d){
  if(kind==='cardRewards'){
    const p=rewardBudget(d),spends=Array.from({length:25},(_,i)=>i*5000),mixes=[0,25,50,75,100];
    return {metrics:[['Premium card: gross cash back',p.gross,'money'],['Premium card: cash back less fee and interest',p.premiumNet,'money'],['Premium advantage over the no-fee comparison',p.advantage,'money']],note:'Invented cash-back terms for the same existing purchases on two hypothetical cards. Bonus eligibility is capped by annual purchase dollars; excess bonus-category purchases earn the base rate. All rewards are redeemed at their entered cash value. The same independently entered interest amount is deducted from both choices, without calculating actual interest, grace periods or repayment. No new spending, points valuation, merchant surcharge, welcome offer or additional benefits are modeled.',charts:[
      {id:'rewards-net-bridge',type:'waterfall',title:'Cash back after the annual fee and entered interest',unit:'money',rows:[{label:'Cash back on capped bonus purchases',value:p.bonus},{label:'Cash back on all other purchases',value:p.base},{label:'Premium card annual fee',value:-d.annualFee},{label:'Entered annual interest',value:-d.commonInterest}],totalLabel:'Net cash back after entered costs',note:'A negative endpoint means these entered costs exceed the cash back. Purchase principal is not a reward expense and is excluded from this bridge.'},
      {id:'rewards-spend-path',type:'line',title:'Net cash back across alternative existing spending amounts',unit:'money',xLabel:'Existing eligible annual purchases (CAD)',xUnit:'money',series:[{name:'Premium card',rows:spends.map(spend=>({x:spend,value:rewardBudget({...d,spend}).premiumNet}))},{name:'No-fee comparison',dash:true,rows:spends.map(spend=>({x:spend,value:rewardBudget({...d,spend}).plainNet}))}],note:'Each point is a separate budget. Category share, bonus cap, rates, annual fee and common interest stay selected. The cap can flatten the premium card’s incremental advantage; increasing spending is not a saving strategy.'},
      {id:'rewards-category-mix',type:'line',title:'The same annual total with a different category mix',unit:'money',xLabel:'Bonus-category share of purchases (%)',series:[{name:'Premium card',rows:mixes.map(bonusShare=>({x:bonusShare,value:rewardBudget({...d,bonusShare}).premiumNet}))},{name:'No-fee comparison',dash:true,rows:mixes.map(bonusShare=>({x:bonusShare,value:rewardBudget({...d,bonusShare}).plainNet}))}],note:'The annual purchase total stays selected. Bonus purchases above the cap earn the base rate; changing the mix does not remove that cap or make ineligible merchants eligible.'},
      {id:'rewards-fee-mix',type:'heatmap',title:'Premium advantage after different fees and purchase mixes',unit:'money',columns:['$0 annual fee','$60','$120','$240'],rows:[0,25,50,75].map(bonusShare=>({label:bonusShare+'% bonus mix',values:[0,60,120,240].map(annualFee=>rewardBudget({...d,bonusShare,annualFee}).advantage)})),note:'Positive favours the premium card for entered cash back and fees; negative favours the no-fee comparison. Common interest cancels from this relative difference but can make both cards’ absolute net cash back negative. No approval or product recommendation is implied.'}
    ]};
  }
  if(kind==='cashDiscount'){
    const p=cashDiscountPath(d);
    return {metrics:[['Cash purchase price now',p.cashPrice,'money'],['Equal monthly financing payment',p.payment,'money'],['Financing advantage at the common end date',p.advantage,'money']],note:'One invented all-in purchase, no financed interest and no down payment. Cash discount applies only to immediate full payment; a separate financing fee is paid upfront. Both choices start with purchase price plus the financing fee in cash and receive the same monthly amount, equal to one instalment. The cash buyer saves that monthly amount; the financed buyer uses it for the payment. Accounts earn the same constant entered return after tax and costs before each month-end flow. Both finish with the same item and no purchase debt. No actual credit terms, statutory APR, late charges, default, resale value or return guarantee is calculated.',charts:[
      {id:'discount-total-payments',type:'groupbar',title:'Nominal purchase payments before account returns',unit:'money',seriesNames:['Cash price paid now','Instalments plus upfront financing fee'],rows:[{label:'Same all-in item',values:[p.cashPrice,p.financedPrice]}],note:'The financing cost difference includes the forgone cash discount and the entered upfront fee. No interest is charged on the instalment principal in this hypothetical contract.'},
      {id:'discount-account-path',type:'line',title:'Cash retained and saved under the same monthly resources',unit:'money',xLabel:'Completed purchase months',series:[series('Pay now, then save the monthly amount',p.rows,'paidNow'),series('Finance, retaining initial cash',p.rows,'financed',{dash:true})],note:'These are account balances. The financed choice still owes purchase debt before the last month; a higher cash balance alone is not a net-worth advantage.'},
      {id:'discount-net-position',type:'line',title:'Subtract the remaining purchase debt from the accounts',unit:'money',xLabel:'Completed purchase months',series:[series('Pay-now account, no purchase debt',p.rows,'paidNowNet'),series('Financing account less purchase debt',p.rows,'financedNet',{dash:true})],note:'Only the account and this purchase debt are included. The identical purchased item is excluded from both paths. Debt falls by an equal principal amount after each payment and reaches zero at the common end date.'},
      {id:'discount-return-matrix',type:'heatmap',title:'Financing advantage at the common end date',unit:'money',columns:['0% cash discount','2%','5%','10%'],rows:[0,2,4,6,8].map(netReturn=>({label:netReturn+'% net return',values:[0,2,5,10].map(cashDiscount=>cashDiscountPath({...d,netReturn,cashDiscount}).advantage)})),note:'Rows replace the effective annual account return after tax and costs; columns replace the cash discount. Price, financing fee and term stay selected. Positive favours financing in this invented account comparison; negative favours immediate payment. Returns are assumptions, not offered rates or probabilities.'}
    ]};
  }
  if(kind==='remittanceBudget'){
    const a=transferBudget(d,d.markupA,d.feeA),b=transferBudget(d,d.markupB,d.feeB),amounts=[1,100,250,500,1000,2000,5000,10000,20000];
    return {metrics:[['Service A: CAD needed for the budget period',a.annualTotal,'money'],['Service B: CAD needed for the budget period',b.annualTotal,'money'],['CAD saved using B instead of A; negative means dearer',a.annualTotal-b.annualTotal,'money']],note:'One fixed official case chart is separate from the editable hypothetical model. The model uses generic foreign-currency units (FCU), not a live currency quote. A markup increases a reference CAD-per-FCU rate. The sender funds a common recipient charge so both services deliver the selected net amount. Sender fees are additional CAD charges. All transfers repeat identical inputs with no rate movement, taxes, funding charges or delivery delay. A zero net target means no transfer and no charge.',charts:[
      {id:'remittance-official-case',type:'stackbar',title:'FCAC case: a zero transfer fee can coexist with conversion cost',unit:'money',seriesNames:['Sender transfer fee','Conversion markup above the case reference'],rows:remittanceCase.rows.map(r=>({label:r.label,values:[r.fee,r.markup]})),evidence:'Official worked example · dated quotes',source:remittanceCase.url,sourceLabel:'FCAC · original case and footnotes',note:'USD 1,000 net receipt; quotes recorded 23 June 2026. Published 23 October 2026; reviewed 25 October 2026. Anonymized case, not a representative survey or current offer. Fixed when controls change.'},
      {id:'remittance-period-budget',type:'groupbar',title:'Model: total CAD budget versus reference principal',unit:'money',seriesNames:['Net recipient amount at the reference rate','Total CAD paid including entered charges'],rows:[{label:'Hypothetical service A',values:[a.principal*d.transferCount,a.annualTotal]},{label:'Hypothetical service B',values:[b.principal*d.transferCount,b.annualTotal]}],note:'These are side-by-side totals, not additive stacks. Each service delivers the same net foreign-currency amount. The difference includes sender fees, rate markup and funding of the recipient charge across the selected number of identical transfers.'},
      {id:'remittance-amount-cost',type:'line',title:'Model: extra CAD cost at different net recipient amounts',unit:'money',xLabel:'Net recipient amount per transfer (FCU)',xUnit:'integer',xMin:1,series:[{name:'Service A: extra CAD per transfer',rows:amounts.map(netForeign=>({x:netForeign,value:transferBudget({...d,netForeign},d.markupA,d.feeA).extra}))},{name:'Service B: extra CAD per transfer',dash:true,rows:amounts.map(netForeign=>({x:netForeign,value:transferBudget({...d,netForeign},d.markupB,d.feeB).extra}))}],note:'Extra cost is total CAD paid less the net recipient amount translated at the reference rate. Only positive transfer amounts are plotted; zero means no transfer and is excluded from this curve. The flat sender fee and recipient charge are not prorated.'},
      {id:'remittance-amount-markup',type:'heatmap',title:'Model: CAD saved with B over the selected budget period',unit:'money',columns:['B markup 0%','0.5%','1.5%','3%'],rows:[250,500,1000,2500].map(netForeign=>({label:netForeign+' FCU net',values:[0,.5,1.5,3].map(markupB=>transferBudget({...d,netForeign},d.markupA,d.feeA).annualTotal-transferBudget({...d,netForeign},markupB,d.feeB).annualTotal)})),note:'Rows replace the net recipient amount; columns replace service B’s rate markup. All other selected terms, including the number of transfers, stay fixed. Positive favours B on these costs alone. Delivery, reliability and applicable protections require separate review.'}
    ]};
  }
  throw Error('Unknown payment-options planning topic.');
}
