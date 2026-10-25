import { mortgageMonthlyRate, mortgagePayment } from './planning-more-models.js';

export const pensionWithdrawalProtectionDefinitions={
  bridgeExpiry:{title:'Map a temporary pension ending before a later CPP payment begins',fields:[
    ['lifetime','Assumed lifetime pension: monthly net cash (CAD)',2200,0,15000,100],
    ['bridge','Assumed temporary bridge: monthly net cash until the January age-65 boundary (CAD)',700,0,5000,50],
    ['cpp','Independently entered CPP monthly net cash from its selected start (CAD)',1000,0,3000,50],
    ['cppStart','Assumed January age when CPP cash starts; no benefit adjustment is calculated',67,65,70,1],
    ['other','Other monthly net income, held constant (CAD)',500,0,10000,100],
    ['expenses','Initial monthly spending (CAD)',3500,0,20000,100],
    ['inflation','Annual increase in spending only (%)',0,0,6,.5],['cash','Initial liquid reserve (CAD)',20000,0,300000,1000]
  ]},
  withdrawalMix:{title:'Compare two sources for the same pre-tax portfolio withdrawal',fields:[
    ['portfolio','Starting investment portfolio (CAD)',300000,1000,3000000,10000],
    ['equityWeight','Starting equity share (%)',70,0,100,5],['target','Entered target equity share (%)',60,0,100,5],
    ['withdrawal','Requested one-time withdrawal, before tax and costs (CAD)',30000,0,1000000,5000]
  ]},
  debtLifeCover:{title:'Compare two hypothetical first-term protection contracts against the same debt',fields:[
    ['balance','Starting mortgage principal (CAD)',400000,0,2000000,10000],['rate','Unchanged nominal mortgage rate, compounded semiannually (%)',5,0,12,.25],
    ['amortYears','Mortgage amortization (whole years)',25,1,30,1],['coverYears','Comparison horizon within assumed level-premium policy terms (whole years)',10,1,20,1],
    ['creditorPremium','Hypothetical monthly mortgage-life premium while debt remains (CAD)',60,0,500,5],
    ['levelCover','Hypothetical individual level death benefit (CAD)',400000,0,3000000,10000],
    ['levelPremium','Hypothetical monthly individual-policy premium during the horizon (CAD)',40,0,500,5]
  ]}
};

const series=(name,rows,dash=false,step=false)=>({name,rows,dash,step});
const cad=value=>'CAD '+value.toLocaleString('en-CA',{maximumFractionDigits:2});

export function bridgeExpiryPlan(input,{cppStart=input.cppStart,bridge=input.bridge}={}){
  const rows=[{x:0,month:0,age:60,income:input.lifetime+bridge+input.other,spending:input.expenses,cash:input.cash,flow:0}];
  let cumulative=0,lowest=0,totalIncome=0,totalSpending=0;
  // January after a December 60th birthday; the bridge's final month is
  // December of the year turning 65. First post-bridge month is month 61.
  for(let month=1;month<=180;month++){
    const year=Math.floor((month-1)/12),age=60+year;
    const temporary=month<=60?bridge:0,cppCash=month>(cppStart-60)*12?input.cpp:0;
    const income=input.lifetime+temporary+cppCash+input.other,spending=input.expenses*(1+input.inflation/100)**year;
    const flow=income-spending;cumulative+=flow;lowest=Math.min(lowest,cumulative);totalIncome+=income;totalSpending+=spending;
    rows.push({x:month/12,month,age,income,spending,flow,cash:input.cash+cumulative,temporary,cppCash});
  }
  return {rows,required:-lowest,extra:Math.max(0,-lowest-input.cash),ending:input.cash+cumulative,totalIncome,totalSpending};
}

export function withdrawalAllocation(input,{request=input.withdrawal,target=input.target}={}){
  const total=input.portfolio,equity=total*input.equityWeight/100,bonds=total-equity,paid=Math.min(total,request),remaining=total-paid;
  const minimumEquitySale=Math.max(0,paid-bonds),maximumEquitySale=Math.min(equity,paid);
  const equitySale=Math.max(minimumEquitySale,Math.min(maximumEquitySale,equity-remaining*target/100));
  const directed={equitySale,bondSale:paid-equitySale,equity:equity-equitySale,bonds:bonds-(paid-equitySale)};
  const proportional={equitySale:paid*input.equityWeight/100,bondSale:paid*(1-input.equityWeight/100),equity:equity*(remaining/total),bonds:bonds*(remaining/total)};
  return {total,equity,bonds,paid,remaining,unfunded:request-paid,directed,proportional,
    directedWeight:remaining>0?directed.equity/remaining:null,proportionalWeight:remaining>0?proportional.equity/remaining:null,
    residual:directed.equity-remaining*target/100};
}

export function debtLifePlan(input){
  const rate=mortgageMonthlyRate(input.rate),payment=mortgagePayment(input.balance,input.rate,input.amortYears*12);
  let balance=input.balance,creditorPaid=0,levelPaid=0,interest=0,loanPaid=0;
  const rows=[{x:0,balance,creditorLimit:balance,levelLimit:input.levelCover,creditorPaid,levelPaid}];
  for(let month=1;month<=input.coverYears*12;month++){
    const active=balance>1e-8,charge=active?balance*rate:0,paid=active?Math.min(payment,balance+charge):0;
    interest+=charge;loanPaid+=paid;balance=Math.max(0,balance+charge-paid);if(balance<1e-7)balance=0;
    if(active)creditorPaid+=input.creditorPremium;levelPaid+=input.levelPremium;
    rows.push({x:month/12,balance,creditorLimit:balance,levelLimit:input.levelCover,creditorPaid,levelPaid});
  }
  return {rows,payment,balance,interest,loanPaid,creditorPaid,levelPaid,levelToDebt:Math.min(input.levelCover,balance),
    levelResidual:Math.max(0,input.levelCover-balance),levelShortfall:Math.max(0,balance-input.levelCover)};
}

export function pensionWithdrawalProtectionResult(kind,input){
  if(kind==='bridgeExpiry'){
    const p=bridgeExpiryPlan(input),incomeRows=p.rows.slice(1).map(r=>({x:(r.month-1)/12,value:r.income})),expenseRows=p.rows.slice(1).map(r=>({x:(r.month-1)/12,value:r.spending}));
    const ages=[...new Set([60,64,65,input.cppStart,70])].sort((a,b)=>a-b);
    return {metrics:[['Temporary monthly cash removed at the age-65 boundary',input.bridge,'money'],['Total starting reserve required by this calendar',p.required,'money'],['Additional reserve beyond entered cash',p.extra,'money']],note:'Hypothetical fifteen-year net-cash ledger with January ages 60–74 and a December birthday. The temporary bridge pays through the December turning 65 and stops the following January. CPP starts in January at the entered whole age. All income figures are independently entered net cash, held constant; no statutory pension calculation, CPP age adjustment, income indexing, OAS, GIS, final tax, mortality or benefit eligibility is calculated. Only spending increases annually in January. Monthly receipts arrive before that month’s spending; reserve earns zero and negative cash is an unmet funding need, not an automatic loan. The ending balance alone does not establish that every earlier month was funded.',charts:[
      {id:'bridge-expiry-income-parts',type:'stackbar',title:'Temporary and later income do not share the same start and end dates',unit:'money',unitLabel:'Assumed monthly net cash · January reference points',seriesNames:['Lifetime pension + other income','Temporary bridge','Entered CPP cash'],rows:ages.map(age=>({label:'January age '+age,values:[input.lifetime+input.other,age<65?input.bridge:0,age>=input.cppStart?input.cpp:0]})),note:'The first segment combines the separately entered lifetime pension and other income to keep three readable components. The chart does not equate the bridge with the CPP amount. Every amount is a scenario input, not a quoted government benefit.'},
      {id:'bridge-expiry-monthly-budget',type:'line',title:'Put the spending line beside the income step-down and step-up',unit:'money',unitLabel:'Assumed monthly cash in CAD',xLabel:'Years from age-60 January',series:[series('Monthly net income',incomeRows,false,true),series('Monthly spending',expenseRows,true,true)],note:'The age-65 January boundary is year 5. CPP begins at the selected later January; amounts are held unchanged across the matrix for timing sensitivity only. Actual CPP amounts must be separately re-entered for each start-age quote.'},
      {id:'bridge-expiry-reserve-calendar',type:'line',title:'A positive ending reserve can still hide an earlier shortfall',unit:'money',xLabel:'Years from age-60 January',series:[series('Liquid reserve / unmet funding need',p.rows.map(r=>({x:r.x,value:r.cash}))),series('Zero cash boundary',[{x:0,value:0},{x:15,value:0}],true)],note:'Each point is after a modeled month’s receipts and spending. The minimum cumulative cash flow determines the required starting reserve. No investment sales, borrowing or earlier access to future payments is assumed.'},
      {id:'bridge-expiry-reserve-grid',type:'heatmap',title:'Starting reserve required under different temporary amounts and later start dates',unit:'money',columns:[65,67,70].map(age=>'Age '+age),rows:[500,700,900].map(bridge=>({label:'$'+bridge+'/mo',values:[65,67,70].map(cppStart=>bridgeExpiryPlan(input,{bridge,cppStart}).required)})),note:'Rows replace monthly bridge cash; columns replace CPP start age. Other income, the CPP amount, spending and spending growth remain selected. Cells show the full reserve required, not additional cash above the entered reserve. This is not a comparison of actual age-adjusted CPP benefits or an optimal claiming-age calculation.'}
    ]};
  }
  if(kind==='withdrawalMix'){
    const p=withdrawalAllocation(input);
    return {metrics:[['Cash withdrawn, before tax and costs',p.paid,'money'],['Directed withdrawal: equity share remaining',p.directedWeight,'percent'],['Requested withdrawal left unfunded',p.unfunded,'money']],note:'Hypothetical two-asset portfolio with one immediate withdrawal, no price movement, tax, fees, settlement delay or account restriction. A proportional withdrawal sells each asset in its starting weight. The directed rule chooses a feasible equity sale that minimizes distance to the entered target after taking the same cash out; it cannot sell extra assets and reinvest proceeds. Requested cash is capped at total assets and any unfunded remainder is reported. A fully spent portfolio has no remaining allocation. The chosen target is a reader assumption, not a recommended risk level or a forecast.',charts:[
      {id:'withdrawal-mix-holdings',type:'stackbar',title:'Compare the same starting assets and the same cash leaving',unit:'money',seriesNames:['Equity holdings','Bond holdings'],rows:[{label:'Before withdrawal',values:[p.equity,p.bonds]},{label:'After proportional withdrawal',values:[p.proportional.equity,p.proportional.bonds]},{label:'After directed withdrawal',values:[p.directed.equity,p.directed.bonds]}],note:'Both post-withdrawal totals equal the starting portfolio less the same funded withdrawal. The withdrawn cash is no longer part of either remaining portfolio. Asset labels represent broad hypothetical buckets, not specific products.'},
      {id:'withdrawal-mix-sale-sources',type:'groupbar',title:'The choice changes which assets provide the withdrawal',unit:'money',seriesNames:['Equity sold','Bonds sold'],rows:[{label:'Proportional rule',values:[p.proportional.equitySale,p.proportional.bondSale]},{label:'Directed rule',values:[p.directed.equitySale,p.directed.bondSale]}],note:'Each pair sums to the same cash withdrawal. The directed rule is constrained to nonnegative sales within the assets held. It does not silently buy the underweight asset or sell more than the spending need.'},
      {id:'withdrawal-mix-equity-shares',type:'bar',title:'A directed withdrawal can move toward a target without reaching it',unit:'percent',unitLabel:'Equity share of the remaining investment portfolio',rows:[{label:'Before withdrawal',value:input.equityWeight/100},{label:'After proportional withdrawal',value:p.proportionalWeight},{label:'After directed withdrawal',value:p.directedWeight},{label:'Entered target',value:input.target/100}],note:'Proportional selling preserves the original weight when assets remain. With zero remaining assets, the two post-withdrawal weights are unavailable, not zero. An entered target is a comparison reference, not proof of suitability.'},
      {id:'withdrawal-mix-residual-grid',type:'heatmap',title:'Equity surplus or shortfall still left after using the withdrawal',unit:'money',signed:true,columns:[0,10,25,50].map(percent=>percent+'% out'),rows:[30,50,70,90].map(target=>({label:target+'% eq',values:[0,10,25,50].map(percent=>withdrawalAllocation(input,{request:input.portfolio*percent/100,target}).residual)})),note:'Columns replace the withdrawal with a percentage of starting assets; rows replace the equity target. Positive CAD is equity still above target after the directed withdrawal; negative CAD is equity below target. Reaching the target would require a separate asset exchange of that magnitude, with an equal opposite change in bonds. No extra exchange, tax or cost is executed in the model.'}
    ]};
  }
  if(kind==='debtLifeCover'){
    const p=debtLifePlan(input);
    return {metrics:[['Mortgage remaining at the comparison date',p.balance,'money'],['Mortgage-life premiums paid through the horizon',p.creditorPaid,'money'],['Individual-policy premiums paid through the horizon',p.levelPaid,'money']],note:'Hypothetical contracts, not insurance quotations. Both are assumed in force with any modeled death claim fully eligible and accepted. Mortgage-life limit equals the scheduled debt; an individual policy has the entered fixed benefit. Premiums are assumed flat for the comparison horizon; the mortgage-life premium stops after the month the debt is fully paid, while the individual premium continues. The same mortgage uses an unchanged nominal rate compounded semiannually, converted to an equivalent monthly rate, with month-end payments. No renewal-rate change, underwriting, policy exclusion, taxes, death probability, cash surrender value, investment alternative, portability decision or claims advice is modeled. Displayed claims are conditional amounts, not expected receipts.',charts:[
      {id:'debt-life-limit-paths',type:'line',title:'A declining debt limit and a level life benefit follow different paths',unit:'money',xLabel:'Years from start',series:[series('Debt / assumed mortgage-life limit',p.rows.map(r=>({x:r.x,value:r.balance}))),series('Entered individual level benefit',p.rows.map(r=>({x:r.x,value:r.levelLimit})),true)],note:'Limits are shown immediately after each scheduled mortgage payment. The first curve represents both the debt and the assumed debt-linked limit. A level benefit can be smaller than the debt; no amount is inferred from medical or financial eligibility.'},
      {id:'debt-life-premium-calendar',type:'line',title:'Premiums are a separate cash commitment from a conditional claim',unit:'money',xLabel:'Years from start',series:[series('Cumulative mortgage-life premiums',p.rows.map(r=>({x:r.x,value:r.creditorPaid}))),series('Cumulative individual-policy premiums',p.rows.map(r=>({x:r.x,value:r.levelPaid})),true)],note:'These are alternative premium schedules, not two policies assumed purchased together. Premiums are not deposits into a savings balance. No future claim is guaranteed and no premium is subtracted from a contractual death benefit here.'},
      {id:'debt-life-conditional-payout-use',type:'stackbar',title:'At the selected date, separate money toward debt from residual family cash',unit:'money',seriesNames:['Amount applied to mortgage','Residual available after assumed mortgage repayment'],rows:[{label:'Accepted mortgage-life claim',values:[p.balance,0]},{label:'Accepted individual level claim',values:[p.levelToDebt,p.levelResidual]}],note:'Assumes death immediately after the final shown payment, both contracts still in force, and a fully accepted claim. The mortgage-life claim goes to the lender. For the individual policy, the named beneficiary is assumed to choose mortgage repayment first; that is a scenario use of cash, not an automatic legal payment instruction. Debt left under the individual-policy example is '+cad(p.levelShortfall)+'.'},
      {id:'debt-life-benefit-debt-gap',type:'waterfall',title:'A level benefit can leave a surplus or a mortgage funding shortfall',unit:'money',rows:[{label:'Assumed accepted individual death benefit',value:input.levelCover},{label:'Outstanding mortgage at selected date',value:-p.balance}],totalLabel:'Benefit less mortgage debt',note:'A positive endpoint is cash left after the assumed full mortgage repayment. A negative endpoint is debt not covered by this benefit, not a negative insurance payment or an automatic loan. This comparison excludes other estate assets, debts and family needs and is not a complete coverage recommendation.'}
    ]};
  }
  throw Error('Unknown pension, withdrawal or protection topic.');
}
