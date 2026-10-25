export const fundingChoiceDefinitions={
  disabilityIncome:{title:'Explore a disability-income cash schedule',fields:[
    ['expenses','Monthly household spending (CAD, net)',4500,0,15000,100],['ongoing','Continuing monthly household income (CAD, net)',1500,0,15000,100],
    ['sick','Temporary salary or sick-pay receipts (CAD/month, net)',2500,0,10000,100],['sickMonths','Initial months with those temporary receipts',2,0,12,1],
    ['benefit','Monthly insurance benefit after tax and offsets (CAD)',2200,0,10000,100],['wait','Full months before modeled insurance payments',3,0,12,1],
    ['benefitMonths','Number of monthly insurance payments modeled',6,0,36,1],['months','Months in the cash schedule',12,1,36,1],
    ['upfront','One-time cost before the first month (CAD)',1000,0,30000,500],['reserve','Starting cash allocated to this plan (CAD)',10000,0,200000,1000]
  ]},
  currencyGoal:{title:'Explore a goal priced in another currency',fields:[
    ['foreignCost','Bill at today’s price (foreign currency units, FCU)',20000,0,200000,1000],['foreignInflation','Annual price increase in that foreign currency (%)',3,0,10,.5],
    ['fx','CAD paid per one foreign currency unit',1.4,.001,5,.01],['markup','Conversion charge on translated CAD amount (%)',2,0,10,.25],
    ['flat','One-time conversion fee (CAD)',25,0,500,5],['initial','Starting CAD savings for the goal',5000,0,250000,1000],
    ['monthly','Monthly CAD saving at month-end',500,0,10000,50],['months','Months until the single bill is paid',36,6,120,1],
    ['rate','Assumed effective annual CAD savings return (%)',2,-5,8,.5]
  ]},
  annuityIncome:{title:'Explore an illustrative annuity cash flow',fields:[
    ['capital','Liquid capital before the allocation (CAD)',500000,0,2000000,10000],['allocation','Share allocated to the illustrative annuity (%)',40,0,100,5],
    ['quote','Hypothetical monthly payment per CAD 100,000 premium',550,100,1000,25],['years','Years of payments to illustrate, conditional on survival',30,5,40,1],
    ['inflation','Annual purchasing-power inflation assumption (%)',2,0,6,.5]
  ]}
};
export function disabilityCash(input){
  let position=-input.upfront,sickTotal=0,benefitTotal=0;const rows=[{x:0,value:position+input.reserve,position}],incomeRows=[];
  for(let month=1;month<=input.months;month++){
    const sick=month<=input.sickMonths?input.sick:0,benefit=month>input.wait&&month<=input.wait+input.benefitMonths?input.benefit:0;
    const income=input.ongoing+sick+benefit;position+=income-input.expenses;sickTotal+=sick;benefitTotal+=benefit;
    rows.push({x:month,value:position+input.reserve,position});incomeRows.push({x:month,income,sick,benefit,expenses:input.expenses});
  }
  const required=Math.max(0,-Math.min(...rows.map(r=>r.position)));
  return {rows,incomeRows,required,extra:Math.max(0,required-input.reserve),ending:position+input.reserve,sickTotal,benefitTotal};
}
export function currencyBill(input){
  const foreign=input.foreignCost*(1+input.foreignInflation/100)**(input.months/12),base=foreign*input.fx,charge=base*input.markup/100,fee=foreign>0?input.flat:0;
  return {foreign,base,charge,fee,total:base+charge+fee};
}
export function currencySaving(input){
  const bill=currencyBill(input),r=Math.expm1(Math.log1p(input.rate/100)/12),factor=(1+r)**input.months,annuity=r===0?input.months:Math.expm1(input.months*Math.log1p(r))/r;
  const requiredMonthly=Math.max(0,(bill.total-input.initial*factor)/annuity);
  let value=input.initial;const rows=[{x:0,value}];for(let month=1;month<=input.months;month++){value=value*(1+r)+input.monthly;rows.push({x:month,value});}
  return {bill,rows,ending:value,requiredMonthly,gap:Math.max(0,bill.total-value)};
}
export function annuityCash(input){
  const premium=input.capital*input.allocation/100,monthly=premium/100000*input.quote;
  // All receipts assume the annuitant remains alive; no mortality weighting or estate benefit.
  const rows=Array.from({length:input.years+1},(_,x)=>({x,receipts:monthly*x*12,monthly,realMonthly:monthly/(1+input.inflation/100)**x}));
  return {premium,monthly,liquid:input.capital-premium,rows,receiptMonths:premium>0?Math.ceil(100000/input.quote):null,payoutRatio:12*input.quote/100000};
}
export function fundingChoiceResult(kind,input){
  if(kind==='disabilityIncome'){
    const p=disabilityCash(input),none=disabilityCash({...input,benefit:0});
    return {metrics:[['Starting cash needed for the selected schedule',p.required,'money'],['Additional cash beyond selected reserve',p.extra,'money'],['Ending cash position',p.ending,'money']],note:'Hypothetical month-end household cash ledger. Temporary salary/sick-pay receipts arrive in the initial selected months. Insurance first pays after the full selected waiting months and then pays for the selected number of months, limited by the illustrated horizon. Benefit input is assumed approved and available after all taxes and offsets; the model does not apply coordination rules. Continuing income, temporary pay and net insurance receipts are added as entered, including any overlap. Setup cost is paid at time zero. No interest, inflation, claim assessment, medical eligibility, premium, statutory benefit, recovery date or administrative delay is calculated. Negative cash positions represent unfunded needs, not an approved loan.',charts:[
      {id:'disability-income',type:'line',title:'Waiting, temporary pay and benefit duration create different phases',unit:'money',xMin:1,xLabel:'Month of the cash schedule',series:[{name:'Household spending',rows:p.incomeRows.map(r=>({x:r.x,value:r.expenses})),step:true},{name:'Total entered net receipts',rows:p.incomeRows.map(r=>({x:r.x,value:r.income})),step:true,dash:true}],note:'Monthly totals, not daily balances. Continuing income is present throughout; temporary pay applies first; insurance begins in month waiting-period + 1. The insurance duration is a scenario, not a forecast of recovery or a statement of a policy’s maximum benefit period.'},
      {id:'disability-sources',type:'bar',title:'Add only the income that reaches the modeled household schedule',unit:'money',rows:[{label:'Continuing income across the horizon',value:input.ongoing*input.months},{label:'Temporary salary / sick-pay receipts',value:p.sickTotal},{label:'Net insurance receipts within the horizon',value:p.benefitTotal}],note:'Totals are truncated to the selected horizon. These amounts are additive assumptions after any necessary coordination; the calculator does not determine whether overlapping receipts are permitted. Do not enter a gross policy headline as though it were spendable net cash.'},
      {id:'disability-cash',type:'line',title:'The cash reserve must cover the path, including unpaid months',unit:'money',xLabel:'Months after the one-time starting cost',series:[{name:'With entered insurance receipts',rows:p.rows},{name:'No insurance receipts',rows:none.rows,dash:true}],note:'Both paths use identical starting cash, expenses and non-insurance income. Month zero is after the upfront cost. Positive monthly surpluses stay in cash. The no-receipt path is a stress comparison, not a prediction that a claim will be declined.'},
      {id:'disability-matrix',type:'heatmap',title:'Additional cash across waiting times and payment counts',unit:'money',columns:['Wait 0','Wait 1','Wait 3','Wait 6'],rows:[0,3,6,12].map(benefitMonths=>({label:benefitMonths+' paid mo',values:[0,1,3,6].map(wait=>disabilityCash({...input,wait,benefitMonths}).extra)})),note:'Columns count full unpaid waiting months; rows count modeled insurance payments after waiting. Each cell is additional starting cash beyond the selected reserve over the selected horizon. Other income and costs stay fixed. A zero cell does not establish adequate coverage outside this schedule.'}
    ]};
  }
  if(kind==='currencyGoal'){
    const p=currencySaving(input);
    return {metrics:[['Translated future bill including charges (CAD)',p.bill.total,'money'],['Additional amount needed at the deadline (CAD)',p.gap,'money'],['Monthly CAD saving required under the assumptions',p.requiredMonthly,'money']],note:'Hypothetical single future bill in a consistently defined foreign currency unit (FCU). Foreign-currency price rises at the selected annual rate for months / 12 years. The terminal exchange-rate assumption is CAD per FCU; a percentage charge is added to the translated CAD amount, then one flat fee. No fee applies when the bill is zero. CAD savings earn a constant effective annual return converted to a monthly rate, with month-end deposits. Conversion occurs once at the deadline; no foreign-currency saving, interim exchanges, tax or rate forecast is modeled. The selected rate and conversion charges are assumptions, not Bank of Canada observations or provider quotations.',charts:[
      {id:'currency-saving',type:'line',title:'Compare CAD savings with the translated terminal bill',unit:'money',xLabel:'Months until the payment date',series:[{name:'Selected CAD savings schedule',rows:p.rows},{name:'Future bill at the selected terminal rate',rows:p.rows.map(r=>({x:r.x,value:p.bill.total})),dash:true}],note:'The flat comparison line is the already projected bill at the deadline, not its price at each earlier month. All chart amounts are CAD. The savings balance remains in CAD until the single conversion; the bill’s currency and the savings currency therefore remain different exposures.'},
      {id:'currency-bridge',type:'waterfall',title:'Translate the foreign bill and add conversion costs once',unit:'money',rows:[{label:'Current price translated to CAD',value:input.foreignCost*input.fx},{label:'Foreign-price increase in CAD',value:p.bill.base-input.foreignCost*input.fx},{label:'Percentage conversion charge',value:p.bill.charge},{label:'One-time conversion fee',value:p.bill.fee}],totalLabel:'CAD needed at the deadline',note:'Every step is already in CAD. Foreign-price inflation changes the number of foreign units owed; the exchange rate translates them; charges are then added. The percentage field is a cost add-on to the chosen reference rate, not a universal convention for quoting a provider’s spread.'},
      {id:'currency-rates',type:'bar',title:'A higher CAD-per-unit rate makes the same foreign bill cost more',unit:'money',rows:[.8,.9,1,1.1,1.2].map(scale=>({label:'CAD '+Number((input.fx*scale).toPrecision(4))+' / FCU'+(scale===1?' · selected':''),value:currencyBill({...input,fx:input.fx*scale}).total})),note:'The foreign bill, horizon and charge assumptions are identical across bars. Only the terminal rate changes. A rising CAD-per-FCU quote means each foreign unit requires more Canadian dollars; this is a cost scenario, not a probability distribution.'},
      {id:'currency-matrix',type:'heatmap',title:'Monthly CAD saving required under rate and deadline scenarios',unit:'money',columns:['12 mo','24 mo','36 mo','60 mo'],rows:[.8,1,1.2,1.4].map(scale=>({label:scale===1?'Base FX':(scale<1?'−':'+')+Math.round(Math.abs(scale-1)*100)+'% FX',values:[12,24,36,60].map(months=>currencySaving({...input,fx:input.fx*scale,months}).requiredMonthly)})),note:'Rows scale the selected CAD-per-unit rate; columns change the deadline. The foreign price also compounds for each new duration. Starting CAD savings, annual CAD return and charges stay fixed. Cells solve for month-end saving with a zero floor; they are not the currently selected contribution or a hedge recommendation.'}
    ]};
  }
  if(kind==='annuityIncome'){
    const p=annuityCash(input);
    return {metrics:[['Hypothetical gross monthly payment',p.monthly,'money'],['Nominal receipts reach premium after (months)',p.receiptMonths,'months',p.receiptMonths===null?'No premium allocated':undefined],['Liquid capital left after the allocation',p.liquid,'money']],note:'Illustrative immediate level-payment life-only annuity, not an available quote. Premium is the selected share of starting liquid capital; monthly payment scales linearly from the entered amount per CAD 100,000. Payments begin at month-end and every illustrated receipt assumes the annuitant remains alive. No guarantee period, survivor continuation, death benefit, cash surrender value, mortality probabilities, investment of receipts, tax, fees, insurer protection or alternative portfolio return is calculated. Unallocated capital is shown at purchase only, with no subsequent growth or spending. Fixed payments are deflated by the selected annual inflation assumption for the purchasing-power comparison.',charts:[
      {id:'annuity-allocation',type:'waterfall',title:'An income contract changes the amount remaining liquid',unit:'money',rows:[{label:'Liquid capital before allocation',value:input.capital},{label:'Premium allocated to illustrative contract',value:-p.premium}],totalLabel:'Liquid capital remaining',note:'The premium is exchanged for the modeled income contract. It is not labelled a loss, fee or disappearance of wealth. The contract is not valued here, so the endpoint is liquid capital rather than total net worth or a liquidation value.'},
      {id:'annuity-receipts',type:'line',title:'Cumulative receipts depend on how many payments occur',unit:'money',xLabel:'Years after purchase, conditional on survival',series:[{name:'Cumulative gross payments if alive',rows:p.rows.map(r=>({x:r.x,value:r.receipts}))},{name:'Original premium for comparison',rows:p.rows.map(r=>({x:r.x,value:p.premium})),dash:true}],note:'Annual points summarize monthly payments. The crossing compares undiscounted cash receipts with the original premium; it is not an investment break-even rate, net profit, expected return or ability to recover the premium on demand. No payment after death or terminal contract value is assumed.'},
      {id:'annuity-purchasing-power',type:'line',title:'A fixed nominal payment can buy less as prices rise',unit:'money',unitLabel:'Monthly payment: nominal CAD and purchase-date CAD',xLabel:'Years after purchase',series:[{name:'Fixed nominal monthly amount',rows:p.rows.map(r=>({x:r.x,value:r.monthly}))},{name:'Monthly amount in purchase-date purchasing power',rows:p.rows.map(r=>({x:r.x,value:r.realMonthly})),dash:true}],note:'At year t, purchasing power equals the fixed monthly payment divided by (1 + inflation)^t. The year-zero point shows the initial payment amount for comparison, not a payment received at purchase. No indexed annuity quote is inferred.'},
      {id:'annuity-matrix',type:'heatmap',title:'Total receipts as a share of premium: timing is not yield',unit:'percent',unitLabel:'Cumulative gross receipts / original premium (%)',columns:['5 years','10 years','20 years','30 years'],rows:[400,550,700,850].map(quote=>({label:'$'+quote+'/mo',values:[5,10,20,30].map(years=>quote*12*years/100000)})),note:'Fixed comparison grid using CAD 100,000 of premium and the displayed hypothetical monthly payments. Every cell assumes all payments are received while alive. A value above 100% is cumulative nominal cash, not annual return, gain after opportunity cost, survival probability or an advertised product rate. The grid is independent of the selected allocation.'}
    ]};
  }
  throw Error('Unknown funding-choice topic.');
}
