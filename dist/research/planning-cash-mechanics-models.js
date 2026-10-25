export const cashMechanicsDefinitions={
  mortgageFrequency:{title:'Compare payment frequency and the annual cash commitment',fields:[
    ['principal','Starting mortgage principal (CAD)',400000,0,2000000,10000],['rate','Hypothetical nominal rate, compounded semi-annually (%)',5,0,12,.25],
    ['amortYears','Original amortization (years)',25,5,40,1]
  ]},
  promoSavings:{title:'Explore a savings promotion and the rate after it ends',fields:[
    ['initial','Opening savings in either account (CAD)',20000,0,500000,1000],['monthly','Deposit at the end of each model month (CAD)',500,0,5000,50],
    ['promoRate','Annual quoted rate on the eligible promotional balance (%)',5,0,10,.25],['baseRate','Annual quoted rate after promotion and on any excess balance (%)',2,0,10,.25],
    ['steadyRate','Annual quoted rate in the comparison account (%)',3,0,10,.25],['promoMonths','Number of opening months at the promotional rate',4,1,12,1],
    ['cap','Maximum balance receiving the promotional rate (CAD)',50000,0,500000,5000],['horizonMonths','Comparison horizon (whole months)',24,12,60,1]
  ]},
  cardFxRefund:{title:'Follow foreign purchase amounts, conversion costs and a later refund',fields:[
    ['foreignAmount','Original purchase amount, in foreign currency units (FCU)',1000,0,20000,100],['buyRate','Purchase conversion reference, CAD per FCU',1.35,.1,3,.01],
    ['purchaseFee','Purchase conversion cost, percent of reference CAD amount (%)',2.5,0,8,.25],['refundRate','Refund conversion reference, CAD per FCU',1.30,.1,3,.01],
    ['refundShare','Share of the original foreign purchase refunded (%)',100,0,100,10],['refundFee','Refund deduction, percent of reference CAD credit (%)',0,0,8,.25],
    ['feeReturn','Share of original purchase fee returned on the refunded portion (%)',0,0,100,10]
  ]}
};

export function mortgageFrequencyPlan(input,mode='monthly'){
  const n=input.amortYears*12,r=Math.expm1(Math.log1p(input.rate/200)/6);
  const monthly=input.principal===0?0:r===0?input.principal/n:input.principal*r/-Math.expm1(-n*Math.log1p(r));
  const frequency=mode==='monthly'?12:26,periodRate=Math.expm1(Math.log1p(input.rate/200)*2/frequency);
  const payment=mode==='monthly'?monthly:mode==='regular'?monthly*12/26:monthly/2;
  let balance=input.principal,interest=0,paid=0,firstInterest=0,firstPrincipal=0,periods=0;
  const rows=[{x:0,value:balance,interest:0,paid:0}];
  for(let period=1;balance>0&&period<=input.amortYears*frequency+frequency;period++){
    const charge=balance*periodRate,actual=Math.min(payment,balance+charge),principal=actual-charge;
    interest+=charge;paid+=actual;balance=Math.max(0,balance-principal);if(balance<1e-7)balance=0;
    if(period<=frequency){firstInterest+=charge;firstPrincipal+=principal;}
    periods=period;rows.push({x:period/frequency,value:balance,interest,paid});
  }
  return {rows,monthly,payment,frequency,scheduledAnnual:payment*frequency,interest,paid,balance,periods,years:periods/frequency,firstInterest,firstPrincipal};
}

export function savingsPromotion(input,steady=false){
  let balance=input.initial,interest=0,contributions=input.initial;
  const rows=[{x:0,value:balance,interest:0,contributions,charge:0}];
  for(let month=1;month<=input.horizonMonths;month++){
    const eligible=!steady&&month<=input.promoMonths?Math.min(balance,input.cap):0;
    const charge=steady?balance*input.steadyRate/1200:(eligible*input.promoRate+(balance-eligible)*input.baseRate)/1200;
    interest+=charge;contributions+=input.monthly;balance+=charge+input.monthly;
    rows.push({x:month,value:balance,interest,contributions,charge});
  }
  const years=Array.from({length:Math.ceil(input.horizonMonths/12)},(_,i)=>{
    const start=i*12,end=Math.min(input.horizonMonths,start+12);
    return {label:'Months '+(start+1)+'–'+end,value:rows[end].interest-rows[start].interest};
  });
  return {rows,years,balance,interest,contributions,firstYear:rows[12].interest};
}

export function foreignCardCash(input){
  const base=input.foreignAmount*input.buyRate,purchaseCost=base*input.purchaseFee/100,charged=base+purchaseCost;
  const share=input.refundShare/100,foreignRefund=input.foreignAmount*share,refundBase=foreignRefund*input.refundRate;
  const refundCost=refundBase*input.refundFee/100,feeCredit=purchaseCost*share*input.feeReturn/100,credited=refundBase-refundCost+feeCredit;
  return {base,purchaseCost,charged,foreignRefund,refundBase,refundCost,feeCredit,credited,net:charged-credited};
}

const series=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function cashMechanicsResult(kind,input){
  if(kind==='mortgageFrequency'){
    const cases=[['Monthly',mortgageFrequencyPlan(input)],['Regular biweekly',mortgageFrequencyPlan(input,'regular')],['Accelerated biweekly',mortgageFrequencyPlan(input,'accelerated')]];
    const monthly=cases[0][1],accelerated=cases[2][1];
    return {metrics:[['Calculated monthly payment',monthly.payment,'money'],['Extra scheduled cash per year: accelerated',accelerated.scheduledAnnual-monthly.scheduledAnnual,'money'],['Interest difference: monthly minus accelerated',monthly.interest-accelerated.interest,'money']],note:'Hypothetical rate stays unchanged for the entire amortization; this is not a mortgage quote or renewal forecast. Nominal rate compounds semi-annually and is converted to 12 or 26 equal periods per model year. Monthly payment amortizes the starting principal over the selected years; regular biweekly is monthly × 12 ÷ 26, accelerated biweekly is monthly ÷ 2. Interest accrues on opening debt and payments occur at period-end. Final payment is capped. No fees, tax, prepayment restrictions, daily calendar, holiday shift or cents rounding.',charts:[
      {id:'frequency-debt-path',type:'line',title:'Remaining debt with three payment schedules',unit:'money',xLabel:'Model years from the opening balance',series:cases.map(([name,p],i)=>series(name,p.rows,'value',i===1?{dash:true}:{})),note:'Each curve ends at its own payoff date. A model year contains exactly 12 monthly or 26 biweekly periods; it is not an exact dated 14-day calendar.'},
      {id:'frequency-first-year',type:'stackbar',title:'First model-year cash: principal and interest',unit:'money',seriesNames:['Principal repaid','Interest'],rows:cases.map(([label,p])=>({label,values:[p.firstPrincipal,p.firstInterest]})),note:'Regular biweekly preserves the monthly schedule’s total scheduled annual payment. Accelerated biweekly schedules thirteen monthly-payment equivalents each year, rather than twelve.'},
      {id:'frequency-lifetime-interest',type:'bar',title:'Interest paid to the modeled payoff date',unit:'money',rows:cases.map(([label,p])=>({label:label+' · '+p.years.toFixed(2)+' model years',value:p.interest})),note:'Totals use a constant rate until payoff, including a reduced final payment. Faster payoff can combine payment timing with a higher annual contribution to debt.'},
      {id:'frequency-interest-matrix',type:'heatmap',title:'Lifetime interest across assumed rates and payment methods',unit:'money',columns:['Monthly','Regular','Accel.'],rows:[2,4,6,8].map(rate=>({label:rate+'% rate',values:['monthly','regular','accelerated'].map(mode=>mortgageFrequencyPlan({...input,rate},mode).interest)})),note:'Each row replaces the nominal semi-annual-compounding rate and recalculates the base monthly payment using the same principal and amortization. The grid therefore changes payment amounts as well as interest rates. No likelihood is assigned.'}
    ]};
  }
  if(kind==='promoSavings'){
    const promo=savingsPromotion(input),steady=savingsPromotion(input,true);
    return {metrics:[['Promotion account: first twelve months’ interest',promo.firstYear,'money'],['Promotion account: full-horizon interest',promo.interest,'money'],['Ending balance advantage over steady account',promo.balance-steady.balance,'money']],note:'Two hypothetical savings accounts receive the same initial deposit and month-end contributions. Quoted rates are nominal annual percentages divided by 12; interest is credited monthly on opening balances. For the opening promotional months, the entered promotional rate applies up to the eligible-balance cap and the base rate applies above it; afterward the base rate applies to all funds. The steady account uses its own constant rate. No actual product, eligibility test, new-money rule, fees, tax, access delay or deposit-coverage determination is modeled.',charts:[
      {id:'promotion-balance-path',type:'line',title:'Account balances and money contributed',unit:'money',xLabel:'Completed model months',series:[series('Promotion then base rate',promo.rows,'value'),series('Steady-rate account',steady.rows,'value',{dash:true}),series('Money contributed',promo.rows,'contributions')],note:'Contributions are equal across accounts. The gap between contributed capital and account value is credited interest under the selected rules, before tax and fees.'},
      {id:'promotion-interest-path',type:'line',title:'Cumulative interest credited under each rate path',unit:'money',xLabel:'Completed model months',series:[series('Promotion then base rate',promo.rows,'interest'),series('Steady-rate account',steady.rows,'interest',{dash:true})],note:'The promotional rate ends after the selected opening months. The existing balance remains in that account at the base rate; no automatic transfer to a new offer is assumed.'},
      {id:'promotion-annual-interest',type:'groupbar',title:'Interest credited in successive parts of the comparison',unit:'money',seriesNames:['Promotion account','Steady-rate account'],rows:promo.years.map((r,i)=>({label:r.label,values:[r.value,steady.years[i].value]})),note:'Each bar pair covers up to twelve model months. A final shorter block is labelled by its actual month range, and its interest is not annualized.'},
      {id:'promotion-ending-matrix',type:'heatmap',title:'Ending balance difference: promotion account minus steady account',unit:'money',signed:true,columns:['1% base','2%','3%','4%'],rows:[1,3,6,12].map(promoMonths=>({label:promoMonths+' mo promo',values:[1,2,3,4].map(baseRate=>savingsPromotion({...input,promoMonths,baseRate}).balance-steady.balance)})),note:'Rows replace opening promotional months; columns replace the base rate. Promotion rate, cap, deposits, steady comparison rate and horizon stay selected. Negative cells mean a lower ending balance than the steady account, not a loss of principal or a probability.'}
    ]};
  }
  if(kind==='cardFxRefund'){
    const p=foreignCardCash(input);
    return {metrics:[['CAD charged on purchase',p.charged,'money'],['CAD credited on the selected refund',p.credited,'money'],['Net CAD cash paid after the refund',p.net,'money']],note:'Hypothetical conversion references, fees and refund treatment; no live exchange rate or issuer policy is supplied. CAD per foreign currency unit (FCU) is multiplied by the foreign amount. Purchase cost is added to its reference CAD amount; a selected refund deduction is subtracted from its reference CAD credit. Any original-fee rebate is a separate proportional credit. These are scenario assumptions, not network settlement calculations. Partial refunds leave part of the purchase unreturned.',charts:[
      {id:'card-fx-cash-bridge',type:'waterfall',title:'Reconcile purchase cash, the refund and retained conversion costs',unit:'money',rows:[{label:'Purchase at its conversion reference',value:p.base},{label:'Original purchase conversion cost',value:p.purchaseCost},{label:'Refund at its later reference',value:-p.refundBase},{label:'Deduction from refund reference',value:p.refundCost},{label:'Original purchase fee credited back',value:-p.feeCredit}],totalLabel:'Net CAD cash paid after refund',note:'Positive steps add to net cash paid; negative steps reduce it. With a full refund, the endpoint isolates conversion and fee differences in this scenario. A partial-refund endpoint also includes payment for the unreturned portion.'},
      {id:'card-fx-posted-amounts',type:'groupbar',title:'Reference conversion amounts beside modeled account entries',unit:'money',seriesNames:['Reference CAD conversion','Modeled posted CAD amount'],rows:[{label:'Purchase debit',values:[p.base,p.charged]},{label:'Refund credit',values:[p.refundBase,p.credited]}],note:'Both a debit and a credit are shown as positive amounts for size comparison. Their opposite effects on cash are explicit in the waterfall.'},
      {id:'card-fx-checkout-quotes',type:'bar',title:'Compare a foreign-currency charge with hypothetical CAD checkout quotes',unit:'money',rows:[{label:'Foreign charge plus selected purchase cost',value:p.charged},...[2,4,6].map(markup=>({label:'CAD checkout quote · '+markup+'% markup',value:p.base*(1+markup/100)}))],note:'All checkout illustrations use the same purchase conversion reference. The CAD quotes include hypothetical 2%, 4% or 6% markups and assume no additional issuer charge. They are not live offers; actual CAD-settled foreign transactions can have other fees. No refund or credit-card interest is included in this purchase-only comparison.'},
      {id:'card-fx-refund-matrix',type:'heatmap',title:'Net CAD cash paid across refund rates and original-fee rebates',unit:'money',signed:true,columns:['0% rebate','50%','100%'],rows:[.9,.95,1,1.05].map(factor=>{const refundRate=input.buyRate*factor;return {label:refundRate.toFixed(3)+' CAD',values:[0,50,100].map(feeReturn=>foreignCardCash({...input,refundRate,feeReturn}).net)};}),note:'Each row is a refund reference equal to 90%, 95%, 100% or 105% of the selected purchase reference, in CAD per FCU. Columns replace the returned share of the original fee. The selected refund share and refund deduction remain fixed. A negative endpoint means more CAD credited than originally charged; it is not a refund guarantee.'}
    ]};
  }
  throw Error('Unknown cash-mechanics planning topic.');
}
