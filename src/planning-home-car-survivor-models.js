import { installmentPayment } from './planning-life-events-models.js';

export const homeCarSurvivorDefinitions={
  energyUpgrade:{title:'Explore an incremental home-energy upgrade cash plan',fields:[
    ['cost','Additional upgrade cost paid at time zero (CAD)',10000,0,50000,1000],['saving','First-year gross energy-bill saving assumption (CAD)',1200,0,5000,100],
    ['maintenance','Additional annual maintenance, held constant (CAD)',100,0,2000,50],['growth','Annual growth in the avoided energy bill (%)',2,0,6,.5],
    ['discount','Nominal annual discount-rate assumption (%)',4,0,10,.5],['years','Full years of operation in the comparison',15,1,30,1]
  ]},
  carLease:{title:'Compare a lease return with buying and selling at the same date',fields:[
    ['price','All-in purchase price including taxes and financed fees (CAD)',42000,5000,150000,1000],['down','Purchase down payment requested (CAD)',5000,0,50000,1000],
    ['rate','Purchase loan: nominal annual interest assumption (%)',6,0,18,.5],['loanMonths','Purchase loan amortization (monthly periods)',60,12,84,12],
    ['months','Full lease term and common comparison window (months)',48,12,60,12],['leaseUpfront','Lease cash at signing, excluding monthly payments/deposits (CAD)',2000,0,20000,500],
    ['leasePayment','Quoted all-in monthly lease payment (CAD)',550,0,2000,50],['leaseEnd','Total assumed charges when returning the lease (CAD)',500,0,15000,250],
    ['resale','Owned car: sale proceeds net of selling/closure charges, before debt (CAD)',22000,0,150000,1000],
    ['buyExtra','Monthly buyer costs beyond the identical costs omitted (CAD)',50,0,1000,25],['leaseExtra','Monthly lessee costs beyond the identical costs omitted (CAD)',0,0,1000,25]
  ]},
  survivorCash:{title:'Explore a survivor household’s income and receipt timing',fields:[
    ['beforeIncome','Two-person household: current monthly net income (CAD)',6000,0,20000,250],['beforeCosts','Two-person household: current monthly running costs (CAD)',5000,0,20000,250],
    ['afterIncome','Independent estimate of ongoing survivor net monthly income (CAD)',4300,0,15000,100],['afterCosts','Survivor household: monthly running budget (CAD)',3800,0,15000,100],
    ['delayedPart','Portion of that ongoing net income initially not received (CAD)',1500,0,10000,100],['delay','Initial full months without the selected income portion',3,0,12,1],
    ['transition','One-time transition cash outflow at time zero (CAD)',8000,0,50000,1000],['cash','Starting liquid cash confirmed accessible to the survivor (CAD)',10000,0,200000,1000],
    ['months','Monthly periods in the cash comparison',24,12,60,12]
  ]}
};

export function energyUpgradePlan(input,savingScale=1){
  let cash=-input.cost,pv=-input.cost,pvEnergy=0,pvMaintenance=0,recovered=input.cost===0?0:null,discountedRecovered=input.cost===0?0:null;
  const rows=[{x:0,cash,pv,energy:0,net:0}];
  for(let year=1;year<=input.years;year++){
    const energy=input.saving*savingScale*(1+input.growth/100)**(year-1),net=energy-input.maintenance,divisor=(1+input.discount/100)**year;
    cash+=net;pvEnergy+=energy/divisor;pvMaintenance+=input.maintenance/divisor;pv+=net/divisor;
    if(Math.abs(cash)<1e-7)cash=0;if(Math.abs(pv)<1e-7)pv=0;
    if(recovered===null&&cash>=0)recovered=year;if(discountedRecovered===null&&pv>=0)discountedRecovered=year;
    rows.push({x:year,cash,pv,energy,net});
  }
  return {rows,cash,pv,pvEnergy,pvMaintenance,recovered,discountedRecovered,firstNet:input.saving*savingScale-input.maintenance};
}
export function leaseBuyComparison(input){
  const down=Math.min(input.down,input.price),financed=input.price-down,payment=installmentPayment(financed,input.rate,input.loanMonths);
  let debt=financed,paid=0,interest=0,buyCash=down,leaseCash=input.leaseUpfront;
  const rows=[{x:0,buy:buyCash,lease:leaseCash,debt}];
  for(let month=1;month<=input.months;month++){
    const charge=debt*input.rate/1200,actual=Math.min(payment,debt+charge);interest+=charge;paid+=actual;debt=Math.max(0,debt+charge-actual);if(debt<1e-7)debt=0;
    buyCash+=actual+input.buyExtra;leaseCash+=input.leasePayment+input.leaseExtra;
    if(month===input.months){buyCash+=debt-input.resale;leaseCash+=input.leaseEnd;}
    rows.push({x:month,buy:buyCash,lease:leaseCash,debt});
  }
  return {down,financed,payment,debt,interest,paid,rows,buyCost:buyCash,leaseCost:leaseCash,difference:leaseCash-buyCash,terminalEquity:input.resale-debt};
}
export function survivorCashPlan(input){
  const delayed=Math.min(input.delayedPart,input.afterIncome);let position=-input.transition,lowest=Math.min(0,position);
  const rows=[{x:0,before:position+input.cash,end:position+input.cash,income:0}];
  for(let month=1;month<=input.months;month++){
    position-=input.afterCosts;lowest=Math.min(lowest,position);const before=position+input.cash;
    const income=input.afterIncome-(month<=input.delay?delayed:0);position+=income;rows.push({x:month,before,end:position+input.cash,income});
  }
  const required=Math.max(0,-lowest);
  return {rows,delayed,ongoing:input.afterIncome-input.afterCosts,beforeSurplus:input.beforeIncome-input.beforeCosts,required,extra:Math.max(0,required-input.cash),ending:position+input.cash};
}

export function homeCarSurvivorResult(kind,input){
  if(kind==='energyUpgrade'){
    const p=energyUpgradePlan(input);
    return {metrics:[['Incremental upfront cash cost',input.cost,'money'],['First full year cash cost is recovered',p.recovered,'integer',p.recovered===null?'Not within horizon':undefined],['Net present value at the selected discount rate',p.pv,'money']],note:'Hypothetical incremental upgrade versus a defined baseline, not an engineering assessment or energy-price forecast. The cost control is additional cash paid now, after distinguishing any baseline work that would happen anyway; no future grant receipt is assumed. First-year avoided energy spending grows at the selected nominal annual rate, while additional maintenance stays constant in nominal CAD. Both occur at year-end. All benefits are assumed to continue for the selected full years, with no replacement cost or terminal property-value credit. NPV discounts those nominal cash flows at the selected nominal rate; it is not an internal rate of return or a guaranteed yield. Zero upfront cost gives recovery at year zero even if later flows are negative. No financing, rebate eligibility, taxes, carbon calculation, weather model, equipment sizing or comfort/health valuation is calculated.',charts:[
      {id:'energy-first-year',type:'waterfall',title:'Separate first-year bill savings from additional maintenance',unit:'money',rows:[{label:'Avoided energy spending',value:input.saving},{label:'Additional maintenance',value:-input.maintenance}],totalLabel:'First-year net cash benefit',note:'The first-year bill saving is an estimate supplied to the model, not a measured result. Only additional maintenance relative to the baseline is subtracted. Existing costs common to both choices cancel, and the initial project cost is handled separately rather than treated as an annual bill.'},
      {id:'energy-cash-payback',type:'line',title:'Cash payback and discounted recovery answer different questions',unit:'money',xLabel:'Full operating years',series:[{name:'Cumulative undiscounted cash difference',rows:p.rows.map(r=>({x:r.x,value:r.cash}))},{name:'Cumulative discounted cash difference',rows:p.rows.map(r=>({x:r.x,value:r.pv})),dash:true}],note:'Both curves begin at the upfront incremental cost. Annual avoided bills and maintenance enter at each year-end. Recovery is the first full-year endpoint at or above zero inside this horizon; no within-year receipt date is inferred. Discounting values later cash at the chosen time-value rate and does not change the actual amount received.'},
      {id:'energy-present-value',type:'waterfall',title:'Reconcile the present value of benefits and costs',unit:'money',rows:[{label:'Additional upfront project cost',value:-input.cost},{label:'PV of avoided energy spending',value:p.pvEnergy},{label:'PV of extra maintenance',value:-p.pvMaintenance}],totalLabel:'Net present value',note:'Positive NPV means projected benefits exceed modeled costs after discounting at the selected rate; negative means they do not. The result depends on that rate, savings realization and the operating horizon. It excludes any sale-price premium, equipment failure or financial incentive not already settled in the upfront quote.'},
      {id:'energy-cost-realization',type:'heatmap',signed:true,title:'NPV across upfront costs and realized bill savings',unit:'money',columns:['$5k','$10k','$15k','$20k'],rows:[.5,.75,1,1.25].map(scale=>({label:scale*100+'%',values:[5000,10000,15000,20000].map(cost=>energyUpgradePlan({...input,cost},scale).pv)})),note:'Rows realize the stated percentage of the selected first-year gross bill-saving estimate; columns replace additional upfront cost. Maintenance, energy-price growth, discount rate and years remain selected. These are sensitivities, not probabilities of achieving savings or estimates for a particular technology.'}
    ]};
  }
  if(kind==='carLease'){
    const p=leaseBuyComparison(input);
    return {metrics:[['Buy-and-sell net cash cost at the common date',p.buyCost,'money'],['Lease-and-return cash cost over the full term',p.leaseCost,'money'],['Lease cost minus buy-and-sell cost',p.difference,'money']],note:'Hypothetical full-term comparison ending with no vehicle owned and no purchase-loan balance: the purchased car is sold and remaining principal paid; the leased car is returned. Price and lease payment are all-in quote inputs, with no tax calculation. Purchase down payment is capped at price. The loan uses constant nominal annual interest divided by twelve, monthly payments and unrounded intermediate amounts; payments stop at payoff. Lease signing cash excludes monthly instalments and refundable deposits; instalments arrive at month-end in the model. Return charges are separately entered. Sale proceeds are net of selling and loan-closure charges but before repaying principal. Identical operating costs cancel; selected additional monthly costs are included for each option. No lease buyout, residual-value shortfall guarantee beyond entered charges, early termination, refundable deposit, approval, mileage forecast, discounting or investment return is modeled.',charts:[
      {id:'lease-first-payment',type:'bar',title:'Compare the first month’s recurring cash commitment',unit:'money',rows:[{label:'Buy: loan payment plus extra costs',value:p.payment+input.buyExtra},{label:'Lease: quoted payment plus extras',value:input.leasePayment+input.leaseExtra}],note:'This is the first month, not a promise that the purchase-loan payment continues for the entire lease term. It stops after payoff. Common operating costs are omitted only because they are assumed identical; any differences belong in the extra-cost inputs. Upfront and terminal amounts appear in the other graphics.'},
      {id:'lease-buy-ledger',type:'waterfall',title:'Buying and selling requires both the asset and loan payoff',unit:'money',rows:[{label:'Purchase down payment applied',value:p.down},{label:'Loan payments within window',value:p.paid},{label:'Additional buyer running costs',value:input.buyExtra*input.months},{label:'Remaining principal paid at sale',value:p.debt},{label:'Net sale proceeds before debt',value:-input.resale}],totalLabel:'Buy-and-sell net cash cost',note:'Down payment, loan payments and remaining principal equal all-in purchase price plus interest. Do not add purchase price again. Sale proceeds are credited only at the terminal date. If remaining debt exceeds sale proceeds, the difference is extra closing cash needed, not a loan balance erased by the sale.'},
      {id:'lease-return-ledger',type:'waterfall',title:'The return-at-term lease has a different ending transaction',unit:'money',rows:[{label:'Lease cash at signing',value:input.leaseUpfront},{label:'All monthly lease instalments',value:input.leasePayment*input.months},{label:'Additional lessee running costs',value:input.leaseExtra*input.months},{label:'Entered lease-return charges',value:input.leaseEnd}],totalLabel:'Lease-and-return cash cost',note:'The car is assumed returned at the stated full term, with no buyout and no additional residual-value obligation beyond entered return charges. This is a contract assumption, not a rule for every lease. Review wear, distance, administration and other terms before entering the expected total.'},
      {id:'lease-cumulative-cash',type:'line',title:'A later sale credit does not fund earlier car payments',unit:'money',xLabel:'Months to the common exit date',series:[{name:'Buy: cumulative net cash outflow',rows:p.rows.map(r=>({x:r.x,value:r.buy}))},{name:'Lease: cumulative net cash outflow',rows:p.rows.map(r=>({x:r.x,value:r.lease})),dash:true}],note:'Lines include signing cash and recurring payments. At the final point only, buying adds remaining-loan payoff and subtracts sale proceeds, while leasing adds return charges. The owned-car line can therefore fall at exit. Its expected resale value cannot pay an earlier instalment before a sale actually occurs.'},
      {id:'lease-resale-payment',type:'heatmap',signed:true,title:'Lease minus buy-and-sell cost across payment and resale assumptions',unit:'money',columns:['$15k','$20k','$25k','$30k'],rows:[450,550,650,750].map(leasePayment=>({label:'$'+leasePayment,values:[15000,20000,25000,30000].map(resale=>leaseBuyComparison({...input,leasePayment,resale}).difference)})),note:'Rows replace the all-in monthly lease quote; columns replace net terminal sale proceeds before loan principal. Other inputs stay selected. Positive cells mean leasing costs more in this model; negative means buying and selling costs more. No resale value, payment quote or ability to sell for that amount is guaranteed.'}
    ]};
  }
  if(kind==='survivorCash'){
    const p=survivorCashPlan(input);
    return {metrics:[['Ongoing survivor monthly surplus / shortfall',p.ongoing,'money'],['Starting cash required within this horizon',p.required,'money'],['Additional starting cash needed',p.extra,'money']],note:'Hypothetical retirement survivor-household cash stress, not a pension, insurance, support or tax calculation. Before-household income and costs provide context only. Ongoing after-death net income is entered independently from confirmed or separately estimated payments; no automatic survivor percentage or addition of public pensions is used. The initially unreceived portion is capped at that ongoing income as a cash-budget convention. It is absent for the selected first full months, then received monthly; no catch-up arrears payment is assumed. This does not determine benefit entitlement. Transition outflow occurs at time zero; running bills are paid at each month’s start and net income arrives at month-end. All amounts remain constant and the model stops at the selected horizon. Negative balances are unmet needs, not approved borrowing. No death date forecast, probate access, benefit eligibility, inflation, later arrears, tax reassessment or investment return is calculated.',charts:[
      {id:'survivor-running-budget',type:'groupbar',title:'Income and expenses need independent after-death estimates',unit:'money',seriesNames:['Monthly net income','Monthly running costs'],rows:[{label:'Two-person household before',values:[input.beforeIncome,input.beforeCosts]},{label:'Survivor household · ongoing',values:[input.afterIncome,input.afterCosts]}],note:'The ongoing survivor amounts are not calculated by halving the old budget or applying a pension percentage. This chart excludes transition cash and temporary receipt gaps. The actual continuing payments, tax position and spending needs require separate confirmation.'},
      {id:'survivor-cash-timing',type:'line',title:'A positive ongoing budget can still need a cash bridge',unit:'money',xLabel:'Months in the survivor cash plan',series:[{name:'Cash after start-of-month bills',rows:p.rows.map(r=>({x:r.x,value:r.before}))},{name:'Cash after month-end receipts',rows:p.rows.map(r=>({x:r.x,value:r.end})),dash:true}],note:'Month zero is cash after the transition outflow. Before each month’s receipts, running bills have already been paid. Initially unreceived income is excluded from receipts for the selected delay; no later arrears is inserted automatically. A positive later balance cannot fund an earlier bill without another source.'},
      {id:'survivor-delay-buffer',type:'bar',title:'Compare the starting cash required by different receipt gaps',unit:'money',rows:[0,1,3,6,12].map(delay=>({label:delay+' initial full-month receipt gap',value:survivorCashPlan({...input,delay}).required})),note:'Only the initial gap changes. The delayed income portion, other ongoing income, bills, transition cost and selected horizon stay fixed. Even zero gap means income arrives after the first month’s bills. These are cash stress assumptions, not agency processing standards or a prediction that benefits are lost.'},
      {id:'survivor-income-budget',type:'heatmap',title:'Additional starting cash across survivor income and spending',unit:'money',columns:['$3.5k','$4k','$4.5k','$5k'],rows:[3000,3500,4000,4500].map(afterCosts=>({label:'$'+afterCosts/1000+'k',values:[3500,4000,4500,5000].map(afterIncome=>survivorCashPlan({...input,afterCosts,afterIncome}).extra)})),note:'Rows replace monthly survivor running costs; columns replace independently estimated ongoing monthly net income. The selected unreceived portion remains fixed but cannot exceed total income. Receipt gap, transition outflow, accessible starting cash and horizon stay selected. These are funding gaps, not benefit awards or tax estimates.'}
    ]};
  }
  throw Error('Unknown home, car or survivor planning topic.');
}
