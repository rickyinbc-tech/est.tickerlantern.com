import {income2024} from './planning-rate-benchmarks-data.js';
export const rateBenchmarkDefinitions={
  incomeBenchmark:{title:'Keep observed income medians separate from a hypothetical cash budget',fields:[
    ['monthlyCash','Independently entered monthly after-tax cash resources (CAD)',6000,0,20000,100],['otherAnnual','Other annual cash, excluded from the monthly input (CAD)',0,0,100000,500],
    ['fixedMonthly','Monthly fixed spending (CAD)',3500,0,15000,100],['variableMonthly','Monthly variable spending (CAD)',1400,0,10000,100],
    ['annualBills','Other annual bills, excluded from monthly spending (CAD)',3000,0,50000,500],['annualGoal','Selected annual saving goal (CAD)',6000,0,50000,500]
  ]},
  discountYield:{title:'Explore holding-period profit and explicitly defined annualisations',fields:[
    ['face','Amount paid at maturity (CAD)',10000,1000,100000,1000],['pricePct','Purchase price as % of maturity amount',98.9,90,100,.1],
    ['days','Whole days from purchase to maturity',180,30,365,1],['comparisonRate','Comparison account effective annual return (%)',3,0,10,.25]
  ]},
  balloonPlan:{title:'Put the final balloon beside regular payments and a funding plan',fields:[
    ['loan','Opening loan principal (CAD)',25000,0,200000,1000],['apr','Fixed nominal annual loan interest (%)',7,0,20,.25],
    ['balloonShare','Principal left for the balloon as % of opening loan',40,0,80,5],['balloonMonths','Whole months until the balloon date',48,12,84,1],
    ['fundCash','Cash already allocated to the balloon fund (CAD)',2000,0,100000,500],['fundMonthly','Selected month-end balloon-fund saving (CAD)',100,0,3000,25],
    ['fundRate','Hypothetical effective annual fund return after tax and costs (%)',2,0,8,.25]
  ]}
};

export function incomeCashBudget(d){
  const resources=12*d.monthlyCash+d.otherAnnual,spending=12*(d.fixedMonthly+d.variableMonthly)+d.annualBills;
  const unassigned=resources-spending-d.annualGoal;
  return {resources,spending,unassigned,gap:Math.max(0,-unassigned)};
}

// All annualisations below deliberately use a 365-day year. They are mathematical
// comparisons, not a claim about a particular security's quotation convention.
export function discountYieldPlan(d){
  const price=d.face*d.pricePct/100,profit=d.face-price,periodReturn=profit/price;
  const simpleAnnual=periodReturn*365/d.days,faceAnnual=profit/d.face*365/d.days;
  const effectiveAnnual=Math.expm1(Math.log(d.face/price)*365/d.days);
  const accountEnd=price*(1+d.comparisonRate/100)**(d.days/365);
  return {price,profit,periodReturn,simpleAnnual,faceAnnual,effectiveAnnual,accountEnd};
}

export function balloonFunding(d){
  const n=d.balloonMonths,r=d.apr/1200,balloon=d.loan*d.balloonShare/100;
  const discount=(1+r)**-n,annuityFactor=r===0?n:-Math.expm1(-n*Math.log1p(r))/r;
  const ordinary=d.loan/annuityFactor,regular=(d.loan-balloon*discount)/annuityFactor;
  const q=Math.expm1(Math.log1p(d.fundRate/100)/12),fundFactor=(1+q)**n;
  const savingFactor=q===0?n:Math.expm1(n*Math.log1p(q))/q;
  const requiredExact=Math.max(0,(balloon-d.fundCash*fundFactor)/savingFactor);
  const requiredMonthly=Math.max(0,Math.ceil((requiredExact-1e-9)*100)/100);
  let full=d.loan,partial=d.loan,fund=d.fundCash,interestFull=0,interestBalloon=0;
  const rows=[{x:0,full,partial,fund,target:balloon}];
  for(let month=1;month<=n;month++){
    const fullCharge=full*r,partialCharge=partial*r;interestFull+=fullCharge;interestBalloon+=partialCharge;
    full=Math.max(0,full+fullCharge-ordinary);partial=Math.max(0,partial+partialCharge-regular);
    fund=fund*(1+q)+d.fundMonthly;
    if(month===n){full=0;partial=balloon;}
    rows.push({x:month,full,partial,fund,target:balloon});
  }
  return {rows,balloon,ordinary,regular,requiredMonthly,fund,shortfall:Math.max(0,balloon-fund),fundAfterBalloon:fund-balloon,interestFull,interestBalloon};
}

const series=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function rateBenchmarkResult(kind,d){
  if(kind==='incomeBenchmark'){
    const p=incomeCashBudget(d);
    const observedNote='2024 CIS · Canada including territories · 2024 constant CAD. Released 29 April 2026; checked 25 October 2026. Source quality A (excellent); numeric confidence intervals unavailable in this extract.';
    return {metrics:[['Hypothetical annual cash resources',p.resources,'money'],['Unassigned cash after spending and selected saving goal',p.unassigned,'money'],['Annual funding gap',p.gap,'money']],note:'Two official charts stay fixed while the hypothetical cash budget changes. The source distinguishes economic-family units from persons outside an economic family; its combined median is not a sum of subgroup medians. The editable budget is independently entered nominal CAD, not an estimate of a survey percentile or tax liability. Monthly and annual inputs must not overlap. Saving is a separate allocation, not consumption. No inflation conversion, payment-date buffer, benefit entitlement or budget recommendation is calculated.',charts:[
      {id:'income-survey-units',type:'bar',title:'Median after-tax income for different survey units',unit:'money',unitLabel:'2024 constant CAD per survey unit · 2024 medians',tableUnit:'2024 constant CAD',rows:income2024.units.map(r=>({label:r.label,value:r.value})),source:income2024.url,sourceLabel:'Statistics Canada · Table 11-10-0190-01',note:observedNote+' The combined row includes the other groups; do not sum these medians.'},
      {id:'income-survey-age',type:'bar',title:'Age group and family unit are separate dimensions',unit:'money',unitLabel:'2024 constant CAD per family or unattached person',tableUnit:'2024 constant CAD',rows:income2024.ageGroups.map(r=>({label:r.label,value:r.value})),source:income2024.url,sourceLabel:'Statistics Canada · Table 11-10-0190-01',note:observedNote+' Family senior status uses the highest earner’s age; other bars use individual ages. No size or living-cost adjustment.'},
      {id:'income-personal-budget',type:'waterfall',title:'Hypothetical resources, spending and a separate saving allocation',unit:'money',rows:[{label:'Twelve months of entered cash resources',value:12*d.monthlyCash},{label:'Other non-overlapping annual resources',value:d.otherAnnual},{label:'Twelve months of fixed spending',value:-12*d.fixedMonthly},{label:'Twelve months of variable spending',value:-12*d.variableMonthly},{label:'Other annual bills',value:-d.annualBills},{label:'Selected saving goal',value:-d.annualGoal}],totalLabel:'Unassigned cash, or unfunded annual plan',note:'No survey median seeds this ledger. The saving goal is a use of available cash that remains a household asset if actually saved. An annual surplus does not prove that bills are funded on their dates.'},
      {id:'income-budget-matrix',type:'heatmap',title:'Unassigned annual cash across resource and spending assumptions',unit:'money',columns:['$1,000 variable / mo','$1,400','$1,800','$2,200'],rows:[3000,4500,6000,7500].map(monthlyCash=>({label:'$'+monthlyCash.toLocaleString('en-CA')+' cash / mo',values:[1000,1400,1800,2200].map(variableMonthly=>incomeCashBudget({...d,monthlyCash,variableMonthly}).unassigned)})),note:'Rows replace monthly cash resources; columns replace monthly variable spending. Fixed spending, other resources, annual bills and the saving goal remain selected. These cells are hypothetical budgets, not income-distribution estimates or confidence intervals.'}
    ]};
  }
  if(kind==='discountYield'){
    const p=discountYieldPlan(d);
    return {metrics:[['Cash gain during the selected holding period',p.profit,'money'],['Return over the selected holding period',p.periodReturn,'percent'],['Effective annualised mathematical equivalent',p.effectiveAnnual,'percent']],note:'Hypothetical discount security held to a known maturity payment, with purchase price between 90% and 100% of that amount. No fees, tax, default, early sale or actual quote. All annualisations deliberately use 365 days. Price-based simple annualisation divides profit by purchase price; face-based annualisation divides by maturity amount. The effective annualised equivalent compounds the holding-period factor to a year and does not establish an available reinvestment rate. The comparison account uses the same initial cash and selected holding days at an assumed effective annual rate.',charts:[
      {id:'discount-maturity-bridge',type:'waterfall',title:'Reconcile the maturity amount with the cash initially invested',unit:'money',rows:[{label:'Purchase price invested today',value:p.price},{label:'Gain paid through the maturity amount',value:p.profit}],totalLabel:'Cash received at maturity',note:'The maturity receipt includes the original invested capital. The gain is earned over the selected days; it is not an additional annual cash payment.'},
      {id:'discount-annualisation-conventions',type:'bar',title:'The same cash gain under three explicit annualisation formulas',unit:'percent',unitLabel:'Annualised percentage · explicitly different conventions',rows:[{label:'Simple, purchase-price denominator',value:p.simpleAnnual},{label:'Simple, maturity-amount denominator',value:p.faceAnnual},{label:'Effective, repeated holding-period factor',value:p.effectiveAnnual}],note:'Every bar uses the same price, maturity amount and 365-day year. The labels define the formulas; they do not identify a particular market’s quoted yield convention.'},
      {id:'discount-common-horizon',type:'groupbar',title:'Compare the same initial cash at the same end date',unit:'money',seriesNames:['Discount security maturity receipt','Comparison account ending amount'],rows:[{label:d.days+' days after the same initial investment',values:[d.face,p.accountEnd]}],note:'Both start with the selected purchase-price amount. The account grows at the independently entered effective annual return for days / 365 of a year. This is before tax and fees, with no provider or execution terms verified.'},
      {id:'discount-days-price',type:'heatmap',title:'Effective annualised equivalent across discounts and holding days',unit:'percent',unitLabel:'Effective annualised mathematical equivalents',columns:['0.5% price discount','1%','2%','5%'],rows:[30,90,180,365].map(days=>({label:days+' days',values:[.5,1,2,5].map(discount=>discountYieldPlan({...d,days,pricePct:100-discount}).effectiveAnnual)})),note:'Rows replace holding days; columns replace the discount from the maturity amount. A large annualised number over a short period is not a year’s cash gain or a forecast of repeatable trades. No probability or actual auction rate is assigned.'}
    ]};
  }
  if(kind==='balloonPlan'){
    const p=balloonFunding(d),n=d.balloonMonths;
    return {metrics:[['Regular monthly payment with the balloon',p.regular,'money'],['Monthly fund saving required under the selected return',p.requiredMonthly,'money'],['Funding shortfall at the balloon date',p.shortfall,'money']],note:'One invented fixed-rate loan with monthly interest before each equal month-end payment. A selected principal amount remains as a separate balloon immediately after the final regular payment. The no-balloon comparison amortizes the same principal over the same months at the same rate. The fund is separate cash: its monthly return is converted from the entered effective annual net rate; each deposit arrives before the final balloon is due. No fees, missed payments, refinance approval, asset sale, collateral value or guaranteed fund return is assumed. The debt chart ends before payment of the balloon.',charts:[
      {id:'balloon-remaining-principal',type:'line',title:'Principal after regular payments, before the final balloon',unit:'money',xLabel:'Completed regular-payment months',series:[series('Fully amortizing loan',p.rows,'full'),series('Loan with a final balloon',p.rows,'partial',{dash:true})],note:'The balloon line deliberately ends with principal still owed. The final point is not debt forgiveness or the balance after the lump-sum payment.'},
      {id:'balloon-payment-dates',type:'groupbar',title:'The ordinary payment and the full last-month loan commitment',unit:'money',seriesNames:['Fully amortizing loan','Loan with final balloon'],rows:[{label:'One ordinary payment month',values:[p.ordinary,p.regular]},{label:'Final month, including any balloon',values:[p.ordinary,p.regular+p.balloon]}],note:'Only payments to the lender are shown. Transfers into the separate fund are additional budget allocations; funding a payment in advance does not remove it from the final loan bill.'},
      {id:'balloon-fund-progress',type:'line',title:'Selected fund saving against the principal due at maturity',unit:'money',xLabel:'Completed fund-saving months',series:[series('Allocated cash plus savings and assumed return',p.rows,'fund'),series('Balloon principal due',p.rows,'target',{dash:true})],note:'Fund return accrues before each month-end deposit. The final deposit is available before the balloon payment. Selected deposits continue through the term, so excess remains as cash. The required-saving metric is rounded up to a cent. A gap is an unfunded need; no replacement loan, sale proceeds or automatic overdraft fills it.'},
      {id:'balloon-fund-matrix',type:'heatmap',title:'Final balloon funding gap across returns and saving amounts',unit:'money',columns:['$0 fund saving / mo','$100','$200','$300'],rows:[0,2,4,6].map(fundRate=>({label:fundRate+'% net fund return',values:[0,100,200,300].map(fundMonthly=>balloonFunding({...d,fundRate,fundMonthly}).shortfall)})),note:'Rows replace the effective annual fund return after tax and costs; columns replace month-end saving. Loan principal, rate, term, balloon share and initial fund cash stay selected. Zero means the modeled fund reaches the balloon; it does not establish that every regular loan payment is affordable.'}
    ]};
  }
  throw Error('Unknown rate-and-benchmark planning topic.');
}
