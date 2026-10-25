import { wealthSource } from './planning-wealth-data.js';
export const wealthCareerDefinitions={
  wealthContext:{title:'Keep the survey observations separate from your own balance sheet',fields:[
    ['home','Hypothetical home value (CAD)',600000,0,3000000,10000],['pension','Hypothetical pension asset value, not annual income (CAD)',200000,0,2000000,10000],
    ['cash','Immediately available, uncommitted cash (CAD)',15000,0,500000,1000],['debt','Total debt outstanding (CAD)',350000,0,2000000,10000],
    ['expenses','Monthly essential cash spending (CAD)',3000,100,20000,100]
  ]},
  careerTraining:{title:'Compare retraining with continuing in the current job over ten years',fields:[
    ['tuition','Upfront course, equipment and other extra costs (CAD)',12000,0,100000,500],['study','Whole months of training',6,1,36,1],
    ['delay','Whole search months after training at the same reduced income',3,0,24,1],['income','Current monthly take-home income (CAD)',4000,0,20000,100],
    ['retained','Share of current take-home income retained during training and search (%)',50,0,100,5],['uplift','Extra monthly take-home income once the new job begins (CAD)',700,0,5000,50],
    ['extraCosts','Additional monthly work costs once the new job begins (CAD)',150,0,2000,50],['discount','Nominal effective annual discount rate (%)',4,0,12,.5]
  ]},
  pensionBuyback:{title:'Compare independently quoted buyback payments and pension increases',fields:[
    ['lump','Quoted upfront buyback cost (CAD)',30000,0,200000,1000],['instalment','Quoted monthly deduction, including all quoted charges (CAD)',350,0,3000,25],
    ['paymentYears','Whole years of monthly deductions',10,1,20,1],['wait','Whole years before the first pension year begins',10,0,20,1],
    ['benefit','Quoted first-year additional monthly pension, gross (CAD)',250,0,3000,25],['index','Assumed annual increase in the additional pension (%)',2,0,5,.5],
    ['discount','Nominal effective annual discount rate (%)',4,0,12,.5]
  ]}
};
const series=(name,rows,dash=false)=>({name,rows,dash});
const monthlyDiscount=rate=>Math.expm1(Math.log1p(rate/100)/12);
export function trainingPlan(input,{delay=input.delay,uplift=input.uplift}={}){
  const transition=input.study+delay,foregone=input.income*(1-input.retained/100),gain=uplift-input.extraCosts;
  const rate=monthlyDiscount(input.discount),cost=input.tuition+foregone*transition;
  let cumulative=-input.tuition,npv=-input.tuition;
  const rows=[{x:0,value:cumulative}];
  for(let month=1;month<=120;month++){
    const delta=month<=transition?-foregone:gain;
    cumulative+=delta;npv+=delta/(1+rate)**month;rows.push({x:month,value:cumulative});
  }
  const recovery=cost===0&&gain>=0?0:gain>0?transition+Math.ceil((cost-1e-8)/gain):null;
  return {rows,transition,foregone,gain,cost,npv,ending:cumulative,recovery:recovery!=null&&recovery<=120?recovery:null,
    grossExtra:(120-transition)*uplift,workCosts:(120-transition)*input.extraCosts};
}
export function pensionBuybackPlan(input,receiptYears=30,benefit=input.benefit){
  const waitMonths=input.wait*12,paymentMonths=input.paymentYears*12,horizon=waitMonths+receiptYears*12,rate=monthlyDiscount(input.discount);
  let upfront=-input.lump,instalments=0,pvBenefits=0,pvInstalments=0;
  const upfrontRows=[{x:0,value:upfront}],instalmentRows=[{x:0,value:0}];
  for(let month=1;month<=horizon;month++){
    const pension=month>waitMonths?benefit*(1+input.index/100)**Math.floor((month-waitMonths-1)/12):0;
    const payment=month<=paymentMonths?input.instalment:0;
    upfront+=pension;instalments+=pension-payment;pvBenefits+=pension/(1+rate)**month;pvInstalments+=payment/(1+rate)**month;
    if(month%12===0){upfrontRows.push({x:month/12,value:upfront});instalmentRows.push({x:month/12,value:instalments});}
  }
  return {upfrontRows,instalmentRows,pvBenefits,pvInstalments,upfrontNPV:pvBenefits-input.lump,instalmentNPV:pvBenefits-pvInstalments,
    totalInstalments:input.instalment*paymentMonths,remainingPayments:Math.max(0,paymentMonths-horizon)*input.instalment};
}
export function wealthCareerResult(kind,input){
  if(kind==='wealthContext'){
    const net=input.home+input.pension+input.cash-input.debt;
    return {metrics:[['Hypothetical net worth',net,'money'],['Immediately available cash',input.cash,'money'],['Cash / monthly essential spending',input.cash/input.expenses,'decimal']],note:'Two fixed survey charts use constant 2023 dollars and are unchanged by your inputs. The two teaching charts are hypothetical. The balance sheet includes only the entered home, pension asset value, liquid cash and debt; it excludes all other assets, selling costs and taxes. No wealth percentile, retirement adequacy or borrowing capacity is calculated. Only cash is treated as immediately spendable; it earns zero and has no prior earmark. Coverage assumes unchanged expenses, no income and no debt repayment beyond expenses already entered.',charts:[
      {id:'wealth-age-medians',type:'groupbar',title:'Median net worth by age of the major income recipient',unit:'money',unitLabel:'Constant 2023 Canadian dollars · survey medians',tableUnit:'constant 2023 CAD',seriesNames:['2019 survey','2023 survey'],rows:wealthSource.ages.map(r=>({label:r.label,values:[r.before,r.after]})),source:wealthSource.table,note:wealthSource.scope+' Released 29 October 2024; reviewed 25 October 2026. Separate cross-sections, not the same families aging through time.'},
      {id:'wealth-province-medians',type:'bar',title:'Provincial medians describe different populations',unit:'money',unitLabel:'Constant 2023 Canadian dollars · 2023 survey',tableUnit:'constant 2023 CAD',rows:[...wealthSource.provinces].sort((a,b)=>b.value-a.value),source:wealthSource.infographic,note:'2023 SFS, ten provinces; same survey population exclusions as the age chart. Released 29 October 2024; reviewed 25 October 2026. No adjustment for age, home ownership, family composition or local costs. The national median is not an average of these medians. Uncertainty intervals are not supplied in the cited infographic.'},
      {id:'wealth-toy-distribution',type:'bar',title:'Five invented families: the mean and the median differ',unit:'money',rows:[40000,80000,120000,160000,1100000].map((value,i)=>({label:'Invented family '+(i+1),value})),note:'Entirely invented teaching sample, not Canadian microdata: CAD 40,000, 80,000, 120,000, 160,000 and 1,100,000. Mean = CAD 300,000; median = CAD 120,000. Changing the last value alone to CAD 2,100,000 raises the mean to CAD 500,000 while leaving the median unchanged. This does not estimate any population distribution.'},
      {id:'wealth-personal-ledger',type:'waterfall',title:'Your hypothetical balance sheet is different from spendable cash',unit:'money',rows:[{label:'Home value',value:input.home},{label:'Pension asset value',value:input.pension},{label:'Uncommitted liquid cash',value:input.cash},{label:'All entered debt',value:-input.debt}],totalLabel:'Hypothetical net worth',note:'This is one internally consistent invented balance sheet, not a sum of survey medians. Pension capital value is not annual pension income. Home and pension assets are not treated as available cash; no sale, withdrawal or loan is assumed. The cash-coverage metric above uses only the entered liquid cash.'}
    ]};
  }
  if(kind==='careerTraining'){
    const p=trainingPlan(input);
    return {metrics:[['Tuition plus foregone take-home income',p.cost,'money'],['Nominal cost recovery from the start',null,'custom',p.recovery==null?'Not within 120 months':p.recovery+' months'],['Ten-year incremental present value',p.npv,'money']],note:'Hypothetical comparison with remaining in the current job for 120 months. Upfront costs are paid at time zero. Reduced take-home income lasts through both training and the job-search delay; no new-job uplift arrives before then. Later monthly gain equals the extra take-home income less extra work costs. All recurring cash differences occur at month-end. Baseline earnings, prices and assumed cash amounts otherwise remain fixed. No tax credit, grant, borrowing, investment return or probability of employment is assumed. Foregone income is an opportunity cost, not an invoice or the cash reserve needed to live. Discounting uses the entered effective annual nominal rate.',charts:[
      {id:'training-investment-cost',type:'waterfall',title:'The investment includes income you give up',unit:'money',rows:[{label:'Course, equipment and other upfront costs',value:input.tuition},{label:'Foregone take-home income while studying',value:p.foregone*input.study},{label:'Foregone take-home income while searching',value:p.foregone*input.delay}],totalLabel:'Total incremental cost before the new job',note:'Compared with continuing at current take-home income. Ordinary living expenses common to both choices cancel from this incremental calculation. A separate household cash budget still needs to fund them.'},
      {id:'training-recovery-path',type:'line',title:'Track the cumulative difference against staying in the current job',unit:'money',xLabel:'Months since training begins',series:[series('Retraining: cumulative incremental cash',p.rows),series('Stay in current job: comparison baseline',p.rows.map(r=>({x:r.x,value:0})),true)],note:'A crossing of zero means nominal incremental cost recovery within the 120-month window, not that you have money for every bill. The line can keep falling after training if extra work costs exceed the assumed income uplift.'},
      {id:'training-ten-year-reconciliation',type:'waterfall',title:'Reconcile the entire ten-year incremental cash total',unit:'money',rows:[{label:'Upfront training costs',value:-input.tuition},{label:'Income foregone in training and search',value:-p.foregone*p.transition},{label:'Extra take-home income after the transition',value:p.grossExtra},{label:'Additional work costs after the transition',value:-p.workCosts}],totalLabel:'Ten-year nominal incremental cash',note:'Every scenario ends 120 months after the start. A longer transition leaves fewer higher-income months; the horizon is not restarted at graduation. This endpoint is undiscounted and differs from the present-value metric.'},
      {id:'training-delay-uplift-grid',type:'heatmap',title:'Ten-year present value across income uplifts and search delays',unit:'money',signed:true,columns:[0,400,700,1000].map(v=>'+$'+v+'/mo'),rows:[0,3,6,12].map(delay=>({label:delay+' search mo',values:[0,400,700,1000].map(uplift=>trainingPlan(input,{delay,uplift}).npv)})),note:'Columns replace the extra monthly take-home income; rows replace the search delay after the selected training period. All other inputs stay selected. Values are discounted incremental cash in CAD at the start. These are stress scenarios, not observed wages, employment probabilities or confidence intervals.'}
    ]};
  }
  if(kind==='pensionBuyback'){
    const p=pensionBuybackPlan(input);
    return {metrics:[['Total quoted monthly deductions',p.totalInstalments,'money'],['Upfront option: incremental present value',p.upfrontNPV,'money'],['Instalment option: incremental present value',p.instalmentNPV,'money']],note:'Hypothetical gross cash comparison from the election date, assuming both fully completed payment options buy the same separately quoted additional pension. Upfront cost is paid now; deductions begin at month one. Pension payments begin at the end of month (waiting years × 12 + 1), rise once after each twelve payments, and continue for thirty receipt years conditional on survival. Monthly discounting uses the effective annual nominal rate. All scheduled deductions fit inside this full horizon. Quoted deductions are entered directly, not derived from a loan rate. No tax deduction, PSPA, RRSP transfer, eligibility, bridge-benefit change, survivor benefit, death probability, refund, investment alternative or plan approval is calculated. Present value is conditional cash arithmetic, not actuarial value or a recommendation.',charts:[
      {id:'buyback-payment-totals',type:'bar',title:'Compare the upfront amount with all scheduled deductions',unit:'money',rows:[{label:'Upfront payment',value:input.lump},{label:'Monthly deductions × scheduled months',value:p.totalInstalments}],note:'Nominal gross amounts: both alternatives are assumed to purchase identical service and benefits. An actual instalment quote may include interest and insurance. This tool does not infer those charges or establish that either quote is available.'},
      {id:'buyback-cumulative-cash',type:'line',title:'Draw the cash commitment before the pension increase starts',unit:'money',xLabel:'Whole years since election',series:[series('Upfront option: cumulative gross net cash',p.upfrontRows),series('Instalment option: cumulative gross net cash',p.instalmentRows,true)],note:'Annual endpoints of a monthly ledger; upfront payment appears at year zero. Deductions may overlap pension receipt if their term exceeds the wait. This is incremental buyback cash only, not a household account balance, investment value or liquidity guarantee. Benefits stop at the displayed horizon, not at a modeled death.'},
      {id:'buyback-present-value-parts',type:'groupbar',title:'Bring payment and benefit streams to the same date',unit:'money',seriesNames:['Payment present value','Additional pension present value'],rows:[{label:'Upfront option',values:[input.lump,p.pvBenefits]},{label:'Instalment option',values:[p.pvInstalments,p.pvBenefits]}],note:'All amounts are discounted to the election date. The same pension stream is assumed under both options. Subtract payment value from benefit value to reconcile each headline NPV. A positive value is not a mortality-weighted result or a complete comparison with investing.'},
      {id:'buyback-receipt-horizon-grid',type:'heatmap',title:'Upfront-option present value depends on the pension receipt horizon',unit:'money',signed:true,columns:[100,250,400].map(v=>'$'+v+'/mo'),rows:[10,20,30].map(years=>({label:years+' yr',values:[100,250,400].map(benefit=>pensionBuybackPlan(input,years,benefit).upfrontNPV)})),note:'Columns replace the first-year additional monthly pension; rows replace the number of receipt years. Waiting years, annual increase, upfront cost and discount rate stay selected. No survival probability is assigned. This grid uses only the upfront cost and is separate from the two-option, thirty-receipt-year comparison.'}
    ]};
  }
  throw Error('Unknown wealth or career topic.');
}
