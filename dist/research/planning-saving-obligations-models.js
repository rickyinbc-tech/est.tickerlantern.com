export const savingObligationDefinitions={
  gicMaturities:{title:'Explore a five-rung maturity schedule and annual cash needs',fields:[
    ['capital','Capital invested at the start, split into five equal rungs (CAD)',50000,0,500000,5000],['rate','Hypothetical effective annual rate on every term (%)',4,0,8,.25],
    ['annualNeed','Cash needed at each year-end, after that year’s maturity (CAD)',12000,0,100000,1000],['cash','Separate starting liquid reserve (CAD)',5000,0,100000,1000]
  ]},
  cesgCatchup:{title:'Explore basic CESG catch-up under a simplified contribution history',fields:[
    ['startAge','Age the beneficiary turns in the first modeled calendar year',13,0,17,1],['previousYears','Earlier CAD 2,500 contribution years, capped at prior calendar years',4,0,17,1],
    ['annualContribution','Annual contribution request once saving begins (CAD)',5000,0,15000,500],['delayYears','Whole calendar years to wait before new contributions',0,0,5,1]
  ]},
  hbpRepay:{title:'Explore designated HBP repayments and income inclusions',fields:[
    ['balance','Confirmed opening HBP balance (CAD)',30000,0,60000,1000],['remainingYears','Required repayment years remaining, including the first modeled year',15,1,15,1],
    ['firstYear','First calendar year shown; confirm the due year separately',2031,2026,2050,1],['annualRepayment','Annual amount available to designate as an HBP repayment (CAD)',1500,0,10000,250],
    ['firstExtra','Extra designated repayment in the first modeled required year (CAD)',3000,0,60000,1000],['taxAllowance','Assumed tax-budget percentage applied to income inclusions (%)',30,0,60,5]
  ]}
};
export const savingObligationRules={reviewed:'2026-10-25',cesgRate:.2,cesgAnnualRoom:500,cesgCatchupCap:1000,cesgLifetime:7200,respContributions:50000};

export function maturityBudget(input,ladder=true){
  const rate=input.rate/100,rung=input.capital/5;
  let cash=0,lowest=0,totalProceeds=0,totalInterest=0;
  const rows=[{x:0,before:input.cash,after:input.cash,proceeds:0,principal:0,interest:0}];
  for(let year=1;year<=5;year++){
    const principal=ladder?rung:year===5?input.capital:0,proceeds=principal*(1+rate)**year,interest=proceeds-principal;
    totalProceeds+=proceeds;totalInterest+=interest;cash+=proceeds;
    const before=cash+input.cash;cash-=input.annualNeed;lowest=Math.min(lowest,cash);
    rows.push({x:year,before,after:cash+input.cash,proceeds,principal,interest});
  }
  const required=Math.max(0,-lowest);
  return {rows,totalProceeds,totalInterest,required,extra:Math.max(0,required-input.cash),ending:cash+input.cash};
}
export function cesgSchedule(input){
  const previousYears=Math.min(input.previousYears,input.startAge),priorContributions=previousYears*2500,priorGrant=Math.min(7200,previousYears*500);
  let contributions=priorContributions,grants=priorGrant,carry=input.startAge*500-priorGrant,newContributions=0,newGrants=0,unplaced=0;
  // Earlier funded years are explicitly the earliest previous calendar years.
  // They therefore meet the pre-age-16 history condition whenever at least one exists.
  let contributionsThrough15=Math.min(previousYears,16)*2500,years100Through15=Math.min(previousYears,16);
  const rows=[];
  for(let age=input.startAge;age<=17;age++){
    carry+=500;
    const request=age>=input.startAge+input.delayYears?input.annualContribution:0;
    const placed=Math.min(request,Math.max(0,50000-contributions));
    const eligible=age<16||contributionsThrough15>=2000||years100Through15>=4;
    const grant=eligible?Math.min(placed*.2,1000,carry,Math.max(0,7200-grants)):0;
    contributions+=placed;grants+=grant;carry-=grant;newContributions+=placed;newGrants+=grant;unplaced+=request-placed;
    if(age<=15){contributionsThrough15+=placed;if(placed>=100)years100Through15++;}
    rows.push({x:age,request,placed,grant,eligible,carry,contributions,grants});
  }
  return {rows,previousYears,priorContributions,priorGrant,contributions,grants,carry,newContributions,newGrants,unplaced,contributionRoom:Math.max(0,50000-contributions),grantHeadroom:Math.max(0,7200-grants)};
}
export function hbpSchedule(input){
  let balance=input.balance,repayments=0,inclusions=0,tax=0;
  const rows=[];
  for(let i=0;i<input.remainingYears;i++){
    const opening=balance,minimum=opening/(input.remainingYears-i),request=input.annualRepayment+(i===0?input.firstExtra:0),designated=Math.min(opening,request);
    const inclusion=Math.max(0,minimum-designated),allowance=inclusion*input.taxAllowance/100;
    balance=Math.max(0,opening-designated-inclusion);if(balance<1e-8)balance=0;
    repayments+=designated;inclusions+=inclusion;tax+=allowance;
    rows.push({x:input.firstYear+i,opening,minimum,designated,inclusion,allowance,balance,repayments,inclusions});
  }
  return {rows,repayments,inclusions,tax,balance,cash:repayments+tax};
}

export function savingObligationResult(kind,input){
  if(kind==='gicMaturities'){
    const ladder=maturityBudget(input),bullet=maturityBudget(input,false);
    return {metrics:[['Ladder: total interest paid at maturities',ladder.totalInterest,'money'],['Ladder: additional starting liquid cash needed',ladder.extra,'money'],['Single five-year term: additional starting cash needed',bullet.extra,'money']],note:'Hypothetical fixed-rate, non-cashable deposits with no default. Capital is invested at time zero. The ladder buys five equal principal amounts with original terms of one to five years; the comparison buys one five-year term. Every term uses the same entered effective annual rate, compounded annually and paid with principal only at maturity. No renewal or reinvestment occurs. Each year’s maturity arrives before that year-end cash need. The separate reserve earns zero. No interim spending, early redemption, automatic rollover, tax, account withdrawal rule, fee, deposit-insurance calculation or rate offer is modeled. Negative cash is an unmet funding need, not automatic borrowing. Returned principal is cash released, not interest income.',charts:[
      {id:'gic-maturity-parts',type:'stackbar',title:'Each rung returns principal as well as interest',unit:'money',seriesNames:['Original principal returned','Interest paid at maturity'],rows:ladder.rows.slice(1).map(r=>({label:'End of year '+r.x,values:[r.principal,r.interest]})),note:'Five equal principal amounts are invested once, at the start. Each earns the selected annual rate for its own original term. Interest is not paid out in the earlier years. These rates are assumptions, not currently available GIC quotations.'},
      {id:'gic-cash-reconciliation',type:'waterfall',title:'Maturity proceeds include the capital already committed',unit:'money',rows:[{label:'Separate starting cash reserve',value:input.cash},{label:'Original principal returned',value:input.capital},{label:'Total ladder interest received',value:ladder.totalInterest},{label:'Five annual cash needs',value:-5*input.annualNeed}],totalLabel:'Cash after the fifth annual bill',note:'The initial invested capital returns through the maturities; it is not counted as both a new saving contribution and an income gain. The ending total includes all five bills. It does not prove that earlier dates were funded.'},
      {id:'gic-maturity-cash-paths',type:'line',title:'A later large maturity cannot fund an earlier bill',unit:'money',xLabel:'Years after the initial purchases',series:[{name:'Five-rung ladder · cash after bills',rows:ladder.rows.map(r=>({x:r.x,value:r.after}))},{name:'One five-year term · cash after bills',rows:bullet.rows.map(r=>({x:r.x,value:r.after})),dash:true}],note:'Both choices start with identical invested capital and a separate identical reserve, face the same annual needs and use the same rate. Cash receives a maturity before that year’s bill. The single term has no release before year five. No added cash is injected when the graph becomes negative; the headline quantifies the additional starting cash that would prevent those shortfalls.'},
      {id:'gic-needs-reserve',type:'heatmap',title:'Ladder funding gaps across annual needs and starting reserves',unit:'money',columns:['$0','$5k','$10k','$20k'],rows:[10000,12000,15000,20000].map(annualNeed=>({label:'$'+annualNeed/1000+'k / yr',values:[0,5000,10000,20000].map(cash=>maturityBudget({...input,annualNeed,cash}).extra)})),note:'Rows replace the cash need at each of five year-ends; columns replace the separate starting reserve. Invested capital and the hypothetical common rate stay selected. Cells measure extra starting cash, rather than the final deficit alone. A monthly or earlier bill calendar could require more accessible cash.'}
    ]};
  }
  if(kind==='cesgCatchup'){
    const p=cesgSchedule(input),source='https://www.canada.ca/en/services/benefits/education/education-savings/estimating-amounts.html';
    return {metrics:[['New basic CESG over the modeled calendar years',p.newGrants,'money'],['New contributions placed within the lifetime limit',p.newContributions,'money'],['CESG lifetime headroom after the age-17 year',p.grantHeadroom,'money']],note:'Simplified hypothetical history with basic CESG only. Assume Canadian residence and basic eligibility from birth through the calendar year of age 17, valid SIN and promoter arrangements, and no other RESP transactions. The selected earlier contribution years are capped at the number of prior calendar years and placed in the earliest such years, with CAD 2,500 per year and no withdrawals. Earlier basic grants are CAD 500 per funded year, capped at the CAD 7,200 lifetime maximum; no additional CESG was ever received. Unused basic room therefore starts at CAD 500 times prior calendar years less earlier grants. Each modeled year adds CAD 500 of basic room. New grants are 20% of placed contributions, subject to available room, CAD 1,000 per year, the shared lifetime CESG cap and the special pre-age-16 contribution-history condition. New contributions stop at the CAD 50,000 lifetime total; excess requests are unplaced. Delayed years still accrue basic room. No investment return, additional CESG, CLB, provincial benefit, transfer, withdrawal, repayment of grants, real account eligibility or payment-processing lag is calculated. Unused room after age 17 does not extend the grant deadline.',charts:[
      {id:'cesg-contribution-rule',type:'groupbar',title:'A larger contribution needs unused room to produce catch-up grants',unit:'money',seriesNames:['No earlier unused basic room','Enough earlier unused basic room'],rows:[1000,2500,5000].map(amount=>({label:'CAD '+amount.toLocaleString('en-CA')+' contribution',values:[Math.min(amount*.2,500),Math.min(amount*.2,1000)]})),source,sourceLabel:'Government of Canada · Basic CESG and carry-forward rules',evidence:'Rule illustration · eligibility and lifetime headroom assumed',note:'Fixed reference examples use the published basic 20% rate and ordinary/catch-up annual constraints. Assume all eligibility conditions and at least CAD 1,000 of lifetime grant headroom. These are grant dollars, not total contributions plus grants. No additional CESG is included; changing the scenario history does not change this reference.'},
      {id:'cesg-annual-funding',type:'stackbar',title:'Separate family contributions from new basic grant dollars',unit:'money',seriesNames:['New contribution placed','New basic CESG'],rows:p.rows.map(r=>({label:'Calendar year turning '+r.x,values:[r.placed,r.grant]})),note:'The age label identifies the calendar year, not a birthday deadline. Zero-contribution waiting years remain visible. Contributions can continue in this model even when a grant condition is not met, but no grant is credited then. Requests stop at the remaining lifetime contribution capacity.'},
      {id:'cesg-lifetime-path',type:'line',title:'Annual catch-up capacity and the lifetime ceiling are different constraints',unit:'money',xMin:input.startAge,xLabel:'Age reached in the calendar year',series:[{name:'Total basic CESG, including earlier grants',rows:p.rows.map(r=>({x:r.x,value:r.grants}))},{name:'CESG lifetime ceiling',rows:[{x:input.startAge,value:7200},{x:17,value:7200}],dash:true}],xTicks:[...new Set([input.startAge,Math.round((input.startAge+17)/2),17])].map(value=>({value,label:String(value)})),note:'Each point is after that calendar year’s modeled contribution and grant, including earlier basic grants in the total. The projection ends after the calendar year turning 17, with no age-18 grant credited. The lifetime ceiling would also include additional CESG in a real account, which is excluded from this simplified history.'},
      {id:'cesg-separate-limits',type:'bar',title:'Unused grant room is not remaining contribution capacity',unit:'money',rows:[{label:'Lifetime contribution room left',value:p.contributionRoom},{label:'Unused basic grant room at end',value:p.carry},{label:'CESG lifetime headroom left',value:p.grantHeadroom}],note:'These are separate ledgers. Unused basic room may exceed remaining lifetime grant headroom and cannot be used after the age-17 calendar-year deadline. Contribution room is based on family contributions, not grants or investment value. It is not a promise of a future grant.'},
      {id:'cesg-delay-budget',type:'heatmap',title:'New grants across waiting periods and annual contribution requests',unit:'money',columns:['$2.5k','$3.5k','$5k','$7.5k'],rows:[0,1,2,3].map(delayYears=>({label:delayYears+' yr wait',values:[2500,3500,5000,7500].map(annualContribution=>cesgSchedule({...input,delayYears,annualContribution}).newGrants)})),note:'Rows replace the delay before new contributions; columns replace the annual request. Starting age and the simplified earlier history stay selected. Every case ends after the calendar year turning 17 and applies the same lifetime limits and age-16/17 history test. Unused room alone cannot overcome either the annual cap or an unmet eligibility condition.'}
    ]};
  }
  if(kind==='hbpRepay'){
    const p=hbpSchedule(input),endYear=input.firstYear+input.remainingYears-1;
    return {metrics:[['Contributions actually designated as HBP repayments',p.repayments,'money'],['Shortfalls included in RRSP income',p.inclusions,'money'],['Repayment cash plus the assumed tax allowance',p.cash,'money']],note:'Hypothetical schedule beginning in an already confirmed required repayment year, with the entered HBP balance and 1–15 years remaining. The year field is a label and does not derive a due date from a withdrawal year. Each year’s minimum is opening balance divided by required years remaining. Designated repayment is the annual amount plus the first-year extra where applicable, capped at balance. A shortfall below the minimum becomes an income inclusion and reduces the HBP balance without adding money to an RRSP. Extra designated repayments reduce later minima; they do not skip the remaining schedule. First-year extra occurs in this modeled required year, not before the repayment period. Designated repayments are not deducted again. The flat percentage on income inclusions is a separate budget allowance, not withholding or a tax-return calculation. No investment growth, earlier transactions, eligibility test, changed residency, death, age-71/72 exception, new withdrawal, missed designation or other special repayment situation is modeled. Reconcile the actual CRA statement and filing requirements.',charts:[
      {id:'hbp-minimum-designated',type:'line',title:'Recalculate the minimum after extra repayments',unit:'money',xMin:input.firstYear,xLabel:'Required repayment calendar year',xTicks:[...new Set([input.firstYear,Math.floor((input.firstYear+endYear)/2),endYear])].map(value=>({value,label:String(value)})),series:[{name:'Minimum required for that year',rows:p.rows.map(r=>({x:r.x,value:r.minimum}))},{name:'Contribution designated as repayment',rows:p.rows.map(r=>({x:r.x,value:r.designated})),dash:true}],note:'The first selected extra is added to that year’s regular repayment. Later minima use the remaining balance and the remaining original repayment years. After the balance is cleared, both amounts remain zero in the rest of the displayed schedule. Unrounded arithmetic is used; confirm actual annual amounts on the CRA statement.'},
      {id:'hbp-cumulative-discharge',type:'line',title:'Money returned to an RRSP differs from amounts included in income',unit:'money',xMin:input.firstYear,xLabel:'Required repayment calendar year',xTicks:[...new Set([input.firstYear,Math.floor((input.firstYear+endYear)/2),endYear])].map(value=>({value,label:String(value)})),series:[{name:'Cumulative designated repayments',rows:p.rows.map(r=>({x:r.x,value:r.repayments}))},{name:'Cumulative income inclusions',rows:p.rows.map(r=>({x:r.x,value:r.inclusions})),dash:true}],note:'Both reduce the recorded HBP balance, but only the first series is cash contributed and designated to the plan. Income inclusion is neither a contribution nor a grant. The tax-budget percentage does not change either balance-reduction series.'},
      {id:'hbp-balance-reconciliation',type:'waterfall',title:'A cleared HBP balance can contain two different types of reduction',unit:'money',rows:[{label:'Opening HBP balance',value:input.balance},{label:'Designated repayment reductions',value:-p.repayments},{label:'Income-inclusion reductions',value:-p.inclusions}],totalLabel:'HBP balance after the schedule',note:'The final balance reaches zero over the selected required years under these rules. That does not establish that the whole opening withdrawal was restored to an RRSP. Actual cash outlay is designated repayments plus any tax actually resulting from inclusions, not the inclusion amount itself paid to CRA.'},
      {id:'hbp-tax-budget-matrix',type:'heatmap',title:'Assumed tax allowances across regular and first-year repayments',unit:'money',columns:['$0 extra','$3k','$6k','$10k'],rows:[0,1000,2000,3000].map(annualRepayment=>({label:'$'+annualRepayment/1000+'k / yr',values:[0,3000,6000,10000].map(firstExtra=>hbpSchedule({...input,annualRepayment,firstExtra}).tax)})),note:'Rows replace the regular annual repayment; columns replace the extra in the first modeled required year. The opening balance, years remaining and assumed tax-budget percentage stay selected. Cells total that flat allowance on income inclusions; they are not tax estimates, savings recommendations or a comparison of investment outcomes.'}
    ]};
  }
  throw Error('Unknown saving-and-obligations planning topic.');
}
