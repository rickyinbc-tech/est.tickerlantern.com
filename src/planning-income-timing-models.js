export const incomeTimingDefinitions={
  helocPlan:{title:'Explore interest-only payments, principal repayment and a rate change',fields:[
    ['balance','Opening HELOC balance (CAD)',60000,0,500000,5000],['apr','Initial nominal annual rate (%)',7,0,18,.25],
    ['laterApr','Nominal annual rate after the change (%)',9,0,18,.25],['changeAfter','Completed months before the rate changes',12,0,60,1],
    ['principalMonthly','Principal repaid each month above interest (CAD)',300,0,5000,50],['years','Comparison horizon (years)',10,5,20,1]
  ]},
  pensionIndex:{title:'Explore fixed, capped and fully inflation-matched income',fields:[
    ['pension','Starting annual pension income (CAD, before tax)',36000,0,150000,1000],['spending','Starting annual spending basket (CAD)',36000,0,150000,1000],
    ['inflation','Constant annual spending inflation (%)',3,0,8,.25],['indexCap','Annual indexing cap in the capped illustration (%)',2,0,8,.25],
    ['years','Years after the starting income amount',25,5,40,1]
  ]},
  paydayCalendar:{title:'Explore a dated biweekly-pay and monthly-bill calendar',fields:[
    ['pay','Net receipt on each modeled payday (CAD)',2000,0,10000,100],['firstPayday','First January 2027 payday, day of month',8,1,14,1],
    ['monthlyBill','Combined fixed bills paid once each month (CAD)',1800,0,15000,100],['billDay','Monthly fixed-bill day, same day each month',1,1,28,1],
    ['dailySpend','Other spending on every calendar day (CAD)',60,0,500,5],['cash','Accessible cash on 1 January before any flows (CAD)',500,0,100000,100]
  ]}
};

// Interest is paid in full each month; principal is a separate fixed amount.
// No unused payment is redrawn, and no payment is collected after payoff.
export function helocSchedule(input,principalMonthly=input.principalMonthly){
  let balance=input.balance,interest=0,principal=0,paid=0;
  const rows=[{x:0,value:balance,interest:0,principal:0,paid:0,charge:0,payment:0,rate:input.apr}];
  for(let month=1;month<=input.years*12;month++){
    const rate=month>input.changeAfter?input.laterApr:input.apr;
    const charge=balance*rate/1200,repayment=Math.min(balance,principalMonthly),payment=charge+repayment;
    interest+=charge;principal+=repayment;paid+=payment;balance=Math.max(0,balance-repayment);
    rows.push({x:month,value:balance,interest,principal,paid,charge,payment,rate});
  }
  return {rows,balance,interest,principal,paid};
}

// Index 0 is the starting annual amount; index N has N completed increases.
// Gaps are positive funding needs, not withdrawals from a simulated portfolio.
export function pensionIndexPath(input,mode='capped'){
  const inflation=input.inflation/100;
  const growth=mode==='fixed'?0:mode==='full'?inflation:Math.min(input.inflation,input.indexCap)/100;
  const rows=Array.from({length:input.years+1},(_,year)=>{
    const price=(1+inflation)**year,income=input.pension*(1+growth)**year,cost=input.spending*price;
    return {x:year,income,cost,real:income/price,gap:Math.max(0,cost-income)};
  });
  return {rows,growth,end:rows.at(-1)};
}

export function paydayBudget(input){
  const start=Date.UTC(2027,0,1),dayMs=86400000;
  const months=Array.from({length:12},(_,month)=>({month:month+1,paydays:0,income:0,bills:0,daily:0,spending:0}));
  let movement=0,lowest=0,received=0,spent=0;
  const rows=[{x:0,date:'2027-01-01 opening',before:input.cash,end:input.cash,income:0,bill:0,cumulativeIncome:0,cumulativeSpending:0}];
  for(let day=1;day<=365;day++){
    const date=new Date(start+(day-1)*dayMs),month=months[date.getUTCMonth()];
    const bill=date.getUTCDate()===input.billDay?input.monthlyBill:0;
    const income=day>=input.firstPayday&&(day-input.firstPayday)%14===0?input.pay:0;
    // Conservatively pay bills and daily costs before any same-day salary receipt.
    movement-=bill+input.dailySpend;spent+=bill+input.dailySpend;
    const before=movement+input.cash;lowest=Math.min(lowest,movement);
    movement+=income;received+=income;
    month.paydays+=day>=input.firstPayday&&(day-input.firstPayday)%14===0?1:0;
    month.income+=income;month.bills+=bill;month.daily+=input.dailySpend;month.spending+=bill+input.dailySpend;
    rows.push({x:day,date:date.toISOString().slice(0,10),before,end:movement+input.cash,income,bill,cumulativeIncome:received,cumulativeSpending:spent});
  }
  const required=-lowest;
  return {rows,months,received,spent,required,extra:Math.max(0,required-input.cash),ending:input.cash+movement,paydays:months.reduce((s,m)=>s+m.paydays,0)};
}

const series=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function incomeTimingResult(kind,input){
  if(kind==='helocPlan'){
    const interestOnly=helocSchedule(input,0),repay=helocSchedule(input),months=input.years*12;
    const samples=[...new Set([1,Math.min(months,input.changeAfter+1),months])];
    return {metrics:[['Interest-only ending debt',interestOnly.balance,'money'],['With principal repayment: ending debt',repay.balance,'money'],['Interest paid: interest-only / repayment',null,'custom',interestOnly.interest.toLocaleString('en-CA',{maximumFractionDigits:2})+' / '+repay.interest.toLocaleString('en-CA',{maximumFractionDigits:2})+' CAD']],note:'Hypothetical HELOC balance, not an offer or lender statement. Interest is opening monthly debt × nominal annual rate ÷ 12, paid at month-end. The second path also pays fixed principal, capped at the debt remaining. The new rate starts in the month after the selected completed months. No new draws, fees, daily accrual, tax or lender minimum-payment rules. Totals cover only the selected horizon; remaining debt is still owed.',charts:[
      {id:'heloc-debt-path',type:'line',title:'Debt outstanding under the same rate path',unit:'money',xLabel:'Completed months',series:[series('Interest only',interestOnly.rows,'value'),series('Interest plus principal',repay.rows,'value',{dash:true})],note:'Interest is fully paid in both paths. Only the second path reduces principal. No redraw of repaid amounts is assumed.'},
      {id:'heloc-interest-path',type:'line',title:'Cumulative interest paid within the horizon',unit:'money',xLabel:'Completed months',series:[series('Interest only',interestOnly.rows,'interest'),series('Interest plus principal',repay.rows,'interest',{dash:true})],note:'Interest alone is an expense comparison. It excludes principal repayment and excludes interest after the horizon.'},
      {id:'heloc-monthly-payment',type:'groupbar',title:'Actual cash payment in selected months',unit:'money',seriesNames:['Interest only','Interest plus principal'],rows:samples.map(month=>({label:'Month '+month+' · '+repay.rows[month].rate+'% nominal rate',values:[interestOnly.rows[month].payment,repay.rows[month].payment]})),note:'The principal-repayment path needs more current cash. Interest can rise when rates change even as debt falls. A repaid balance has no further payment.'},
      {id:'heloc-interest-matrix',type:'heatmap',title:'Total interest across later rates and principal payments',unit:'money',columns:['$0 / mo','$100','$300','$500'],rows:[4,7,10,13].map(laterApr=>({label:laterApr+'% later',values:[0,100,300,500].map(principalMonthly=>helocSchedule({...input,laterApr},principalMonthly).interest)})),note:'Rows replace the rate after the change; columns replace the fixed monthly principal amount above interest. Opening balance, initial rate, change timing and horizon remain selected. These are conditional costs, with no likelihood assigned.'}
    ]};
  }
  if(kind==='pensionIndex'){
    const fixed=pensionIndexPath(input,'fixed'),capped=pensionIndexPath(input),full=pensionIndexPath(input,'full');
    const cases=[['Fixed income',fixed],['Capped indexing',capped],['Full inflation match',full]];
    return {metrics:[['Capped annual income at the horizon',capped.end.income,'money'],['Same income in starting-year dollars',capped.end.real,'money'],['Annual spending gap at the horizon',capped.end.gap,'money']],note:'Hypothetical gross annual pension and separate spending basket, with constant assumed inflation. Starting year is index 0; each later index adds one completed annual increase. Fixed income grows 0%; capped indexing uses the lower of selected inflation and cap; full matching uses selected inflation. No plan entitlement, taxes, mortality, survivor change, bridge-benefit expiry, investment return or funding portfolio is calculated.',charts:[
      {id:'pension-nominal-path',type:'line',title:'Annual pension amounts in future dollars',unit:'money',xLabel:'Completed annual increases',series:cases.map(([name,p],i)=>series(name,p.rows,'income',i===1?{dash:true}:{})),note:'All three cases start with exactly the same annual pension. “Full inflation match” is a reference path, not a claim that any pension plan provides it.'},
      {id:'pension-real-path',type:'line',title:'Annual income in starting-year purchasing power',unit:'money',unitLabel:'CAD per year, in starting-year dollars',xLabel:'Completed annual increases',series:cases.map(([name,p],i)=>series(name,p.rows,'real',i===1?{dash:true}:{})),note:'Each annual income is divided by (1 + assumed inflation) raised to completed years. Do not subtract inflation again from these real amounts.'},
      {id:'pension-spending-gap',type:'groupbar',title:'Annual spending and income at the selected horizon',unit:'money',unitLabel:'CAD per year, at the selected future year',seriesNames:['Spending basket','Pension income','Positive funding gap'],rows:cases.map(([label,p])=>({label,values:[p.end.cost,p.end.income,p.end.gap]})),note:'These are side-by-side comparisons, not additive stacks. Gap is max(spending minus income, zero). Surplus income does not become an assumed portfolio or offset earlier gaps.'},
      {id:'pension-real-matrix',type:'heatmap',title:'Capped income at the horizon in starting-year dollars',unit:'money',columns:['0% cap','1%','2%','3%'],rows:[1,2,3,5].map(inflation=>({label:inflation+'% inflation',values:[0,1,2,3].map(indexCap=>pensionIndexPath({...input,inflation,indexCap}).end.real)})),note:'Rows replace constant inflation; columns replace the indexing cap. Starting income and horizon stay selected. A cap above inflation does not increase income beyond inflation in this illustrative formula.'}
    ]};
  }
  if(kind==='paydayCalendar'){
    const p=paydayBudget(input),monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return {metrics:[['Modeled paydays in 2027',p.paydays,'integer'],['Starting cash needed for every payment',p.required,'money'],['Additional cash beyond the selected reserve',p.extra,'money']],note:'Invented 2027 calendar, not an employer payroll schedule. Pay arrives every 14 days from the selected January day, without holiday shifts. Fixed bills occur on the chosen day of every month; other spending occurs on all 365 calendar days. Bills and daily costs precede any same-day payday. Net receipts are entered independently; no payroll deduction, interest, overdraft or borrowing facility is calculated. Negative cash means an unfunded requirement.',charts:[
      {id:'payday-monthly-receipts',type:'line',title:'Monthly receipts and outgoings on the dated calendar',unit:'money',xLabel:'2027 calendar month',xMin:1,xTicks:[1,3,6,9,12].map(m=>({value:m,label:monthNames[m-1]})),series:[{name:'Net salary received',rows:p.months.map(m=>({x:m.month,value:m.income}))},{name:'Fixed bills plus daily spending',dash:true,rows:p.months.map(m=>({x:m.month,value:m.spending}))}],note:'Connected monthly totals are not a daily cash path. Two-payday and three-payday months can differ. Daily spending also changes with the number of days in a month.'},
      {id:'payday-daily-cash',type:'line',title:'Cash before and after each day’s salary receipt',unit:'money',xLabel:'Calendar day of 2027',series:[series('After costs, before pay',p.rows,'before'),series('After any salary receipt',p.rows,'end',{dash:true})],note:'Each day records costs first and salary second. The required opening reserve uses the lowest pre-receipt point, even if end-of-day cash is positive. Lines connect daily observations.'},
      {id:'payday-annual-bridge',type:'waterfall',title:'Reconcile the year-end cash position',unit:'money',rows:[{label:'Starting accessible cash',value:input.cash},{label:p.paydays+' net salary receipts',value:p.received},{label:'Twelve fixed-bill payments',value:-input.monthlyBill*12},{label:'365 days of other spending',value:-input.dailySpend*365}],totalLabel:'Cash remaining, or unfunded endpoint',note:'A positive endpoint does not establish that earlier bills were funded. These are account cash flows, not a salary-versus-salary employment comparison.'},
      {id:'payday-timing-matrix',type:'heatmap',title:'Required opening reserve across payday and bill dates',unit:'money',columns:['Jan 1','Jan 4','Jan 8','Jan 14'],rows:[1,7,14,21].map(billDay=>({label:'Bill day '+billDay,values:[1,4,8,14].map(firstPayday=>paydayBudget({...input,billDay,firstPayday}).required)})),note:'Columns replace the first January payday and continue that 14-day sequence through 2027. Rows replace the monthly bill date. Pay and costs stay selected. Changing the first date can change the number of in-year receipts; each cell uses its actual calendar, not an assumed equal annual salary.'}
    ]};
  }
  throw Error('Unknown income-and-timing planning topic.');
}
