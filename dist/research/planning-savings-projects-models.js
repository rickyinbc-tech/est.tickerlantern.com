// Original educational scenarios. No observed returns, product quotes or private records.
const monthlyRate=annual=>Math.expm1(Math.log1p(annual/100)/12);
export const savingsProjectDefinitions={
  annualPremium:{title:'Compare annual prepayment with twelve monthly bills',fields:[
    ['annual','All-in annual premium paid at time zero (CAD)',1200,0,50000,100],['surcharge','Extra total cost of monthly billing (% of annual price)',10,0,30,1],
    ['cashReturn','Assumed effective annual return on retained cash (%)',4,0,10,.5]
  ]},
  phasedInvest:{title:'Compare two schedules for money already available',fields:[
    ['capital','Lump sum available at time zero (CAD)',60000,0,1000000,5000],['phaseMonths','Equal beginning-of-month purchases',6,1,12,1],
    ['months','Common investment horizon in months',24,12,120,1],['assetReturn','Assumed effective annual investment return (%)',6,-20,20,.5],
    ['cashReturn','Assumed effective annual return on waiting cash (%)',2,0,6,.25]
  ]},
  renovationCash:{title:'Explore a renovation payment calendar and a cost overrun',fields:[
    ['project','Base project price including known taxes and fees (CAD)',40000,0,300000,1000],['overrun','Additional approved cost as a share of base price (%)',15,0,50,5],
    ['cash','Accessible project cash at the start (CAD)',20000,0,300000,1000],['monthly','Monthly project saving available before that month’s bills (CAD)',4000,0,20000,250],
    ['prepareMonths','Whole months of saving before the deposit is due',0,0,24,1]
  ]}
};

export function annualPremiumPath(input){
  const payment=input.annual*(1+input.surcharge/100)/12,r=monthlyRate(input.cashReturn);
  let prepaid=0,monthly=input.annual,prepaidInterest=0,monthlyInterest=0;
  const rows=[{x:0,prepaid,monthly,prepaidPaid:input.annual,monthlyPaid:0}];
  for(let month=1;month<=12;month++){
    const a=prepaid*r,b=monthly*r;prepaid+=a+payment;monthly+=b;
    prepaidInterest+=a;monthlyInterest+=b;
    rows.push({x:month,prepaid,monthly,prepaidPaid:input.annual,monthlyPaid:month*payment});
  }
  let effective=null;
  if(input.annual>0){
    let lo=0,hi=1;
    for(let n=0;n<100;n++){
      const rate=(lo+hi)/2,pv=Array.from({length:12},(_,i)=>payment/(1+rate)**(i+1)).reduce((a,b)=>a+b,0);
      if(pv>input.annual)lo=rate;else hi=rate;
    }
    effective=input.surcharge===0?0:(1+(lo+hi)/2)**12-1;
  }
  return {rows,payment,prepaid,monthly,prepaidInterest,monthlyInterest,advantage:prepaid-monthly,extra:payment*12-input.annual,effective};
}

export function phasedInvestmentPath(input,phaseMonths=input.phaseMonths,assetReturn=input.assetReturn){
  const r=monthlyRate(assetReturn),c=monthlyRate(input.cashReturn),purchase=input.capital/phaseMonths;
  let invested=0,cash=input.capital,cashInterest=0,deployed=0;
  const rows=[{x:0,total:cash,invested,cash,deployed}];
  for(let month=1;month<=input.months;month++){
    const transfer=month<=phaseMonths?purchase:0;
    cash-=transfer;invested+=transfer;deployed+=transfer;
    if(Math.abs(cash)<1e-8)cash=0;
    const interest=cash*c;cash+=interest;cashInterest+=interest;invested*=1+r;
    rows.push({x:month,total:invested+cash,invested,cash,deployed});
  }
  return {rows,invested,cash,cashInterest,deployed,total:invested+cash};
}

export function renovationCalendar(input,frontLoaded=false){
  const shares=frontLoaded?[.5,.25,.15,.1]:[.1,.3,.3,.3],offsets=[0,2,4,6];
  const extraCost=input.project*input.overrun/100,horizon=input.prepareMonths+6;
  let cash=input.cash,lowest=cash,paid=0;
  const rows=[];
  for(let month=0;month<=horizon;month++){
    const saving=month>0?input.monthly:0;cash+=saving;
    const before=cash,offset=month-input.prepareMonths,index=offsets.indexOf(offset);
    const baseBill=index<0?0:input.project*shares[index],changeBill=offset===1?extraCost:0;
    cash-=baseBill+changeBill;paid+=baseBill+changeBill;lowest=Math.min(lowest,cash);
    rows.push({x:month,before,after:cash,saving,baseBill,changeBill,paid});
  }
  return {rows,extraCost,horizon,paid,ending:cash,extra:Math.max(0,-lowest)};
}

export function savingsProjectResult(kind,input){
  if(kind==='annualPremium'){
    const p=annualPremiumPath(input);
    return {metrics:[['Total extra paid under monthly billing',p.extra,'money'],['Year-end cash: annual minus monthly billing',p.advantage,'money'],['Cash-flow-equivalent effective annual rate',p.effective,'percent']],note:'Hypothetical identical twelve-month insurance coverage. The annual price includes all known taxes and fees and is paid immediately. Monthly billing divides the annual price plus the entered total surcharge into twelve equal month-end bills, with no initial deposit. Both cases start with cash equal to the annual price and receive identical new monthly budget resources equal to the monthly bill. The annual payer saves those resources; the monthly payer uses them to pay each bill. Existing cash earns the selected effective annual return, converted monthly, before each month-end receipt and payment. No cancellation, refund, missed payment, renewal, different coverage, financing fee beyond the entered surcharge, tax on interest or use of cash for another purpose is modeled. The effective rate equates the annual price with the present value of twelve month-end bills; it is a mathematical comparison, not a quoted or legally disclosed APR. Zero annual price makes that rate undefined.',charts:[
      {id:'premium-payments',type:'line',title:'Compare cumulative payments over the same coverage year',unit:'money',xLabel:'Completed months of the policy year',series:[{name:'Annual prepayment',rows:p.rows.map(r=>({x:r.x,value:r.prepaidPaid}))},{name:'Monthly billing',step:true,dash:true,rows:p.rows.map(r=>({x:r.x,value:r.monthlyPaid}))}],note:'Annual prepayment occurs at time zero. Monthly bills occur at the end of months 1 through 12. The difference in final payments is the total surcharge, not its effective annual financing rate.'},
      {id:'premium-cash',type:'line',title:'Track the cash retained and the cash rebuilt',unit:'money',xLabel:'Completed months · cash after receipts and bills',series:[{name:'Annual payer: cash rebuilt',rows:p.rows.map(r=>({x:r.x,value:r.prepaid}))},{name:'Monthly payer: cash retained',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.monthly}))}],note:'Both households start with the annual-price amount before the payment choice and receive the same monthly resources. The annual payer begins the plotted path after paying that price. The monthly payer holds the original cash and pays bills from new monthly resources. All cash remains accessible; an insurance prepayment itself is not treated as liquid cash.'},
      {id:'premium-advantage',type:'waterfall',title:'Reconcile the year-end cash difference',unit:'money',rows:[{label:'Monthly-billing surcharge avoided',value:p.extra},{label:'Interest on the annual payer’s rebuilt cash',value:p.prepaidInterest},{label:'Interest on the monthly payer’s retained cash',value:-p.monthlyInterest}],totalLabel:'Annual minus monthly year-end cash',note:'A positive total means the annual payer has more cash at the common endpoint. A negative total means monthly billing retains more cash under the entered return assumption. Both received the same initial and monthly resources and the same assumed coverage.'},
      {id:'premium-cash-matrix',type:'heatmap',title:'Year-end annual-payment advantage across surcharge and cash return',unit:'money',signed:true,columns:['0% cash','2%','4%','8%'],rows:[0,5,10,20].map(surcharge=>({label:surcharge+'% extra',values:[0,2,4,8].map(cashReturn=>annualPremiumPath({...input,surcharge,cashReturn}).advantage)})),note:'Rows replace the total monthly-billing surcharge; columns replace the effective annual cash return. Annual price stays selected. Positive cells favor annual payment on final cash only. A positive result does not establish that using the starting cash is affordable or suitable.'}
    ]};
  }
  if(kind==='phasedInvest'){
    const lump=phasedInvestmentPath(input,1),phase=phasedInvestmentPath(input),periods=input.phaseMonths;
    return {metrics:[['All-at-once final total, including cash',lump.total,'money'],['Phased final total, including waiting-cash interest',phase.total,'money'],['Phased minus all-at-once final value',phase.total-lump.total,'money']],note:'Hypothetical money is fully available at time zero. Both paths use the same capital and common endpoint. All-at-once buys before the first month’s return. Phased purchases occur before each of the first selected months’ returns, in equal portions of original capital. Cash earns its own effective annual assumed return converted monthly, after that month’s purchase; interest stays in cash and is never added to a later purchase. Asset returns are also effective annual assumptions converted monthly. Every total includes both the investment and remaining cash. No outside contributions, withdrawals, transaction fees, taxes, bid-ask spread, inflation, currency change or account limits. Constant-return paths are controlled examples, not market data, forecasts, probabilities or evidence that one schedule always wins.',charts:[
      {id:'phased-deployment',type:'line',title:'The schedules put the same capital to work at different times',unit:'money',xLabel:'Months since the first purchase · cumulative principal',series:[{name:'All-at-once purchases',step:true,rows:[{x:0,value:input.capital},{x:input.months,value:input.capital}]},{name:'Phased purchases',step:true,dash:true,rows:[...Array.from({length:periods},(_,i)=>({x:i,value:input.capital*(i+1)/periods})),{x:input.months,value:input.capital}]}],note:'This deployment chart starts immediately after both first purchases at time zero. Later phased purchases occur at months 1 through the purchase count minus one. This is cumulative purchase principal, not market value. Cash interest does not increase planned purchases.'},
      {id:'phased-total-path',type:'line',title:'Compare investment plus waiting cash at every month-end',unit:'money',xLabel:'Completed months from the same starting capital',series:[{name:'All-at-once total',rows:lump.rows.map(r=>({x:r.x,value:r.total}))},{name:'Phased total',dash:true,rows:phase.rows.map(r=>({x:r.x,value:r.total}))}],note:'Waiting cash is included throughout. Comparing only the invested slice would understate the phased strategy’s resources. Both curves start at the entered capital before the first purchase.'},
      {id:'phased-direction-cases',type:'groupbar',title:'Changing the assumed market direction changes the comparison',unit:'money',seriesNames:['All-at-once total','Phased total'],rows:[-10,0,10].map(assetReturn=>({label:assetReturn+'% effective annual investment return',values:[phasedInvestmentPath(input,1,assetReturn).total,phasedInvestmentPath(input,periods,assetReturn).total]})),note:'Fixed alternative return assumptions replace the selected asset return. The selected cash return, capital, purchase count and common horizon stay unchanged. These are smooth hypothetical paths with no random volatility, observed market sample or estimated likelihood.'},
      {id:'phased-gap-matrix',type:'heatmap',title:'Phased minus all-at-once value across return and purchase count',unit:'money',signed:true,columns:['3 buys','6 buys','9 buys','12 buys'],rows:[-10,0,5,10].map(assetReturn=>({label:assetReturn+'% return',values:[3,6,9,12].map(count=>phasedInvestmentPath(input,count,assetReturn).total-phasedInvestmentPath(input,1,assetReturn).total)})),note:'Positive cells mean the phased total is larger; negative cells mean the all-at-once total is larger. Each row replaces asset return and each column replaces the number of beginning-of-month purchases. Cash return and the final date remain selected. No cell is a recommendation.'}
    ]};
  }
  if(kind==='renovationCash'){
    const staged=renovationCalendar(input),front=renovationCalendar(input,true);
    return {metrics:[['Project price plus the selected extra cost',staged.paid,'money'],['Extra starting cash needed · 10/30/30/30 schedule',staged.extra,'money'],['Extra starting cash needed · 50/25/15/10 schedule',front.extra,'money']],note:'Hypothetical six-month construction period after the selected preparation months. Base price includes all known taxes and fees. The reference base-price schedule pays 10% at the deposit date, then 30% two, four and six months later; the alternative pays 50%, 25%, 15%, 10% on those same dates. These are invented comparison schedules, not recommended deposits or legal contract terms. The selected additional approved cost is paid one month after the deposit in both cases. Monthly saving arrives before that month’s bills; month zero has no saving receipt. Accessible project cash earns zero. The required extra is the largest negative project balance over the full calendar, with no automatic borrowing or cash injection. No financing, rebates, property-value gain, insurance claim, legal holdback or emergency fund is assumed. Preparation adds saving months; prices and the six-month build duration stay fixed.',charts:[
      {id:'renovation-due-calendar',type:'stackbar',title:'Put the extra bill beside the original payment milestones',unit:'money',seriesNames:['Base-price payment','Additional approved cost'],rows:staged.rows.filter(r=>r.baseBill||r.changeBill).map(r=>({label:'Month '+r.x+' from the planning start',values:[r.baseBill,r.changeBill]})),note:'The payment dates are month '+input.prepareMonths+' for the deposit, then two, four and six months later. The separate extra bill arrives one month after the deposit. The reference split totals exactly 100% of the base price.'},
      {id:'renovation-cash-path',type:'line',title:'An earlier payment can deepen the cash gap without changing total cost',unit:'money',xLabel:'Months from planning start · balance after bills',series:[{name:'10/30/30/30 schedule',rows:staged.rows.map(r=>({x:r.x,value:r.after}))},{name:'50/25/15/10 schedule',dash:true,rows:front.rows.map(r=>({x:r.x,value:r.after}))}],note:'The same project, extra bill, starting cash, monthly saving and endpoint apply to both paths. If the deposit is due immediately, month zero already reflects it. Negative balances are unfunded needs, rather than an approved credit facility. Extra starting cash is measured at the lowest point, not only at the endpoint.'},
      {id:'renovation-ending-bridge',type:'waterfall',title:'Reconcile the final balance separately from the worst funding date',unit:'money',rows:[{label:'Starting accessible project cash',value:input.cash},{label:'Saving across '+staged.horizon+' months',value:input.monthly*staged.horizon},{label:'Base project payments',value:-input.project},{label:'Additional approved cost',value:-staged.extraCost}],totalLabel:'Ending project cash · both schedules',note:'Both schedules pay the same total and therefore finish with the same balance under the zero-return cash assumption. An ending surplus does not establish that every earlier bill was affordable.'},
      {id:'renovation-reserve-matrix',type:'heatmap',title:'Extra starting cash across overrun assumptions and preparation time',unit:'money',columns:['0 mo wait','3 mo','6 mo','12 mo'],rows:[0,10,15,25].map(overrun=>({label:overrun+'% extra',values:[0,3,6,12].map(prepareMonths=>renovationCalendar({...input,overrun,prepareMonths}).extra)})),note:'Uses the reference 10/30/30/30 schedule. Rows replace the extra cost percentage; columns replace preparation months before the deposit. Starting cash, monthly saving and base price stay selected. A longer wait adds saving receipts and shifts every bill together; it does not assume price inflation, a contractor’s availability or a guaranteed completion date.'}
    ]};
  }
  throw Error('Unknown saving-and-project planning topic.');
}
