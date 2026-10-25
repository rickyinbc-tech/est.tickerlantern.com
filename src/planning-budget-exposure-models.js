import { cpi2025 } from './planning-budget-exposure-data.js';

export const budgetExposureDefinitions={
  personalBasket:{title:'Explore a budget exposed to the observed 2025 category changes',fields:[
    ['shelter','Starting monthly shelter amount (CAD)',1800,0,10000,100],
    ['food','Starting monthly food amount (CAD)',800,0,5000,50],
    ['transport','Starting monthly transportation amount (CAD)',500,0,5000,50],
    ['household','Monthly household operations, furnishings and equipment (CAD)',250,0,5000,50],
    ['clothing','Starting monthly clothing and footwear amount (CAD)',100,0,2000,25],
    ['health','Starting monthly health and personal care amount (CAD)',200,0,5000,25],
    ['recreation','Starting monthly recreation, education and reading amount (CAD)',300,0,5000,50],
    ['alcohol','Monthly alcoholic beverages, tobacco and cannabis amount (CAD)',50,0,2000,25]
  ]},
  payCalendar:{title:'Explore automatic saving dates and the operating buffer',fields:[
    ['netPay','Net amount of each paycheque (CAD)',2300,0,10000,100],
    ['firstPayDay','First January payday; repeats every 14 days',8,1,14,1],
    ['billDay','Day of each month when the fixed bills leave',1,1,28,1],
    ['fixedBills','Total fixed monthly bills on that day (CAD)',2800,0,8000,100],
    ['otherSpending','Other spending per average month (CAD)',1500,0,8000,100],
    ['savingTransfer','Savings moved out each month (CAD)',500,0,5000,100],
    ['savingDay','Day of each month when the savings transfer leaves',28,1,28,1],
    ['cash','Opening operating-account cash on January 1 (CAD)',2000,0,30000,500]
  ]},
  raiseBudget:{title:'Explore income growth, price changes and lifestyle expansion',fields:[
    ['netIncome','Starting monthly take-home income (CAD)',5000,500,30000,100],
    ['expenses','Starting monthly living expenses (CAD)',4200,0,30000,100],
    ['netGrowth','Annual increase in take-home income (%)',3,0,10,.5],
    ['priceGrowth','Annual price increase on the existing spending basket (%)',2,0,8,.5],
    ['lifestyleGrowth','Additional annual expansion in spending quantity or quality (%)',2,0,8,.5],
    ['years','Whole years in the comparison',20,2,30,1],
    ['returnRate','Hypothetical effective annual return on saved surpluses (%)',5,-5,10,.5]
  ]}
};

export function basketExposure(input){
  const rows=cpi2025.rows.map(r=>({...r,base:input[r.key],change:input[r.key]*r.rate/100,repriced:input[r.key]*(1+r.rate/100)}));
  const base=rows.reduce((s,r)=>s+r.base,0),change=rows.reduce((s,r)=>s+r.change,0);
  return {rows,base,change,repriced:base+change,rate:base?change/base:null};
}

const dayMs=86400000,yearStart=Date.UTC(2027,0,1);
export function payCalendar(input,savingAtMonthEnd=false){
  const dailySpend=input.otherSpending*12/365,months=Array.from({length:12},(_,i)=>({label:new Date(Date.UTC(2027,i,1)).toLocaleString('en-CA',{month:'short',timeZone:'UTC'}),pay:0,bills:0,other:0,saving:0,count:0}));
  let net=0,low=0,payCount=0;
  const points=[{x:0,value:input.cash}],events=[];
  for(let day=1;day<=365;day++){
    const date=new Date(yearStart+(day-1)*dayMs),month=date.getUTCMonth(),monthDay=date.getUTCDate();
    const bills=monthDay===input.billDay?input.fixedBills:0;
    // Bills and daily spending clear before the day's income. Save only after income.
    net-=bills+dailySpend;low=Math.min(low,net);points.push({x:day-.5,value:input.cash+net});
    months[month].bills+=bills;months[month].other+=dailySpend;
    const pay=day>=input.firstPayDay&&(day-input.firstPayDay)%14===0?input.netPay:0;
    if(day>=input.firstPayDay&&(day-input.firstPayDay)%14===0){payCount++;months[month].count++;}
    net+=pay;months[month].pay+=pay;points.push({x:day-.25,value:input.cash+net});
    const monthEnd=monthDay===new Date(Date.UTC(2027,month+1,0)).getUTCDate(),saving=(savingAtMonthEnd?monthEnd:monthDay===input.savingDay)?input.savingTransfer:0;
    net-=saving;low=Math.min(low,net);months[month].saving+=saving;points.push({x:day,value:input.cash+net});
    events.push({day,date:date.toISOString().slice(0,10),pay,bills,other:dailySpend,saving,closing:input.cash+net});
  }
  const required=Math.max(0,-low);
  return {points,events,months,payCount,income:payCount*input.netPay,expenses:12*(input.fixedBills+input.otherSpending),saving:12*input.savingTransfer,required,extra:Math.max(0,required-input.cash),ending:input.cash+net};
}

export function raiseBudget(input,lifestyle=input.lifestyleGrowth){
  const monthlyRate=Math.expm1(Math.log1p(input.returnRate/100)/12);
  let balance=0,contributions=0,unfunded=0;
  const rows=[],wealth=[{x:0,value:0}];
  for(let year=1;year<=input.years;year++){
    const income=input.netIncome*(1+input.netGrowth/100)**(year-1);
    const expenses=input.expenses*((1+input.priceGrowth/100)*(1+lifestyle/100))**(year-1);
    const surplus=income-expenses,deposit=Math.max(0,surplus),gap=Math.max(0,-surplus);
    for(let month=0;month<12;month++)balance=balance*(1+monthlyRate)+deposit;
    contributions+=deposit*12;unfunded+=gap*12;
    rows.push({x:year,income,expenses,surplus,deposit,gap,balance,contributions,unfunded});wealth.push({x:year,value:balance});
  }
  return {rows,wealth,balance,contributions,unfunded,realBalance:balance/(1+input.priceGrowth/100)**input.years};
}

export function budgetExposureResult(kind,input){
  if(kind==='personalBasket'){
    const p=basketExposure(input);
    return {metrics:[['Increase in the illustrative monthly basket',p.change,'money'],['Implied one-step budget increase',p.rate,'percent'],['Published all-items CPI · 2025 annual average',cpi2025.headline/100,'percent']],note:'Dated observed rates, hypothetical budget. Canada’s 2025 annual-average category changes are applied once to the starting dollar amounts, with quantities and broad category mix held fixed. This is an exposure calculation, not a forecast or an exact personal CPI reconstruction. The reference compares annual average 2025 with annual average 2024, not December with December. No CPI basket weights are used to manufacture a national rate. The all-items CPI remains a separate official observation. Cash-flow shelter amounts, especially mortgage principal, need not match CPI shelter concepts. All-zero spending has no defined percentage increase.',charts:[
      {id:'basket-official-rates',type:'bar',title:'Observed 2025 price changes differ across the eight major CPI components',unit:'percent',unitLabel:'Canada · 2025 annual-average percentage change from 2024',rows:[{label:'All-items CPI · separate aggregate',value:cpi2025.headline/100},...cpi2025.rows.map(r=>({label:r.label,value:r.rate/100}))],source:cpi2025.url,sourceLabel:'Statistics Canada · Chart 3; Table 18-10-0005-01',note:'Released 19 January 2026; reviewed 25 October 2026. Unadjusted annual-average changes. All-items is a separate aggregate and is not an additional spending category. The eight component rates are not added together. These historical observations remain fixed when the budget changes.'},
      {id:'basket-dollar-bridge',type:'waterfall',title:'Apply each category change to the dollars assigned to that category',unit:'money',rows:[{label:'Starting monthly basket',value:p.base},...p.rows.map(r=>({label:r.label+' · added monthly cost',value:r.change}))],totalLabel:'Repriced monthly basket',evidence:'Derived exposure · observed rates and hypothetical amounts',source:cpi2025.url,sourceLabel:'Statistics Canada · observed category rates',note:'Each increase equals the entered starting amount multiplied by its own observed 2025 rate. The bridge adds those increases to the original basket once. No claim is made that these were your actual 2024 expenses or your actual 2025 cost changes.'},
      {id:'basket-category-costs',type:'groupbar',title:'The size of a bill matters as well as its percentage change',unit:'money',seriesNames:['Starting monthly amount','After applying the observed category rate once'],rows:p.rows.map(r=>({label:r.label,values:[r.base,r.repriced]})),evidence:'Derived exposure · observed rates and hypothetical amounts',source:cpi2025.url,sourceLabel:'Statistics Canada · observed category rates',note:'All categories retain the entered dollar amounts and the dated source rates. Compare the absolute increase, not just the percentage: a larger shelter amount can add more dollars even when its rate is below food’s.'},
      {id:'basket-mix-matrix',type:'heatmap',title:'Monthly cost increases across different shelter and food budgets',unit:'money',columns:['$400 food','$800','$1.2k','$1.6k'],rows:[1000,2000,3000,4000].map(shelter=>({label:'$'+shelter/1000+'k shelter',values:[400,800,1200,1600].map(food=>basketExposure({...input,shelter,food}).change)})),evidence:'Derived sensitivity · observed rates and hypothetical amounts',source:cpi2025.url,sourceLabel:'Statistics Canada · observed category rates',note:'Rows replace starting shelter dollars and columns replace starting food dollars. The other six entered amounts and all observed rates stay fixed. Total spending therefore changes across cells: this is not a comparison of equal-size baskets. Cells show the total monthly dollar increase, not a probability or a future inflation forecast.'}
    ]};
  }
  if(kind==='payCalendar'){
    const p=payCalendar(input),monthEnd=payCalendar(input,true);
    return {metrics:[['Total transferred to separate savings during 2027',p.saving,'money'],['Starting cash needed to keep every modeled payment funded',p.required,'money'],['Extra starting cash beyond the entered opening balance',p.extra,'money']],note:'Hypothetical 2027 operating-account calendar. A paycheque arrives on the first selected January day and every 14 calendar days thereafter, with no holidays, payroll deductions, bank holds or date shifts. The selected net amount is already after deductions. Fixed bills leave on the selected monthly day. Other annual spending equals 12 times the monthly input and is spread evenly over all 365 days. Bills and daily spending clear before same-day pay; the savings transfer leaves on its selected monthly date, after any pay that day. The savings transfer remains a separate asset but is unavailable to this operating account. No interest, overdraft, automatic borrowing or return transfer is assumed. Negative balances show an unmet cash need. Required starting cash covers every payment event over this single year; it is not an emergency-reserve target or a cure for a recurring annual deficit.',charts:[
      {id:'pay-calendar-months',type:'bar',title:'The same annual saving can require different opening operating cash',unit:'money',rows:[1,8,15,22,28].map(savingDay=>({label:'Savings transferred on monthly day '+savingDay,value:payCalendar({...input,savingDay}).required})),note:'Every case transfers the same amount twelve times, receives the same paycheques and faces the same bills and daily spending. Only the savings-transfer date changes. Bars show the total opening operating cash needed, before subtracting your entered cash. These transfers remain household assets in a separate account.'},
      {id:'pay-calendar-daily',type:'line',title:'Compare the selected transfer date with transfers at month-end',unit:'money',xLabel:'Calendar date in 2027',xTicks:[{value:0,label:'Jan 1'},{value:90,label:'Apr 1'},{value:181,label:'Jul 1'},{value:273,label:'Oct 1'},{value:365,label:'Dec 31'}],series:[{name:'Operating cash · selected monthly transfer day',rows:p.points},{name:'Operating cash · month-end transfers',rows:monthEnd.points,dash:true}],note:'Both paths receive identical pay and transfer the same annual total to separate savings. Only the transfer date differs. Bills and daily spending leave before same-day pay; saving leaves afterward. Negative points are unfunded payments, with no automatic borrowing or transfer back. The selected starting cash is included, but the extra-cash metric is not injected. Chart-table x positions use a numeric day index with within-day event points.'},
      {id:'pay-calendar-reconciliation',type:'waterfall',title:'Moving the saving date does not create extra annual income',unit:'money',rows:[{label:'Opening operating-account cash',value:input.cash},{label:p.payCount+' net paycheques received',value:p.income},{label:'Twelve fixed-bill payments',value:-12*input.fixedBills},{label:'Other spending over 365 days',value:-12*input.otherSpending},{label:'Twelve transfers to separate savings',value:-p.saving}],totalLabel:'December 31 operating cash',note:'Savings transfers leave this account but do not represent household consumption. The final balance is after all receipts and payments. Compare required starting cash with the annual surplus or deficit separately; a one-year timing buffer cannot make an indefinitely repeated deficit sustainable.'},
      {id:'pay-calendar-date-matrix',type:'heatmap',title:'Opening cash needs across saving dates and bill dates',unit:'money',columns:['Save day 1','Day 8','Day 15','Day 22'],rows:[1,8,15,22].map(billDay=>({label:'Bills day '+billDay,values:[1,8,15,22].map(savingDay=>payCalendar({...input,billDay,savingDay}).required)})),note:'Rows replace the monthly bill date; columns replace the monthly savings-transfer date. Pay dates, pay amounts, annual bills, daily spending and annual saving stay identical across all cells. Values show total opening operating cash required. Your entered starting cash is not subtracted here. Changing a bill’s actual due date requires the biller’s agreement.'}
    ]};
  }
  if(kind==='raiseBudget'){
    const p=raiseBudget(input),constant=raiseBudget(input,0);
    return {metrics:[['Saved-surplus portfolio at the selected finish date',p.balance,'money'],['Cumulative living costs without an income source',p.unfunded,'money'],['Portfolio in starting-price dollars',p.realBalance,'money']],note:'Hypothetical constant-rate planning exercise. Year 1 uses the entered monthly take-home income and expenses; annual increases first apply in year 2. Later expenses multiply both the price factor and the lifestyle factor, so their combined growth is (1 + price growth) × (1 + lifestyle expansion) − 1. Positive monthly surpluses are deposited at month-end; an equivalent monthly return compounds existing savings first. Negative surpluses are recorded as unfunded living costs, with no debt and no withdrawals from the saved-surplus portfolio. If that gap is positive, the displayed portfolio is conditional on finding other funding or reducing expenses. No opening investments, tax calculation, benefit changes, fees, irregular bills or salary forecast is included. Starting-price portfolio values deflate the finish-date balance over the full selected horizon; income and expense levels are constant within each year.',charts:[
      {id:'raise-income-expenses',type:'line',title:'Take-home income and living costs can grow at different rates',unit:'money',xMin:1,xLabel:'Plan year · monthly CAD',series:[{name:'Monthly take-home income',rows:p.rows.map(r=>({x:r.x,value:r.income}))},{name:'Monthly living costs',rows:p.rows.map(r=>({x:r.x,value:r.expenses})),dash:true}],note:'Both paths begin at the entered amounts in year 1. The expense path includes price changes and additional consumption; the income path uses an independent net-income growth assumption. A raise in gross salary would require a separate payroll calculation before it could be used here.'},
      {id:'raise-monthly-surplus',type:'line',title:'A growing paycheque does not guarantee a growing monthly surplus',unit:'money',xMin:1,xLabel:'Plan year · monthly CAD',series:[{name:'Income less living costs · selected lifestyle expansion',rows:p.rows.map(r=>({x:r.x,value:r.surplus}))},{name:'Income less living costs · no lifestyle expansion',rows:constant.rows.map(r=>({x:r.x,value:r.surplus})),dash:true}],note:'The comparison keeps the same starting expenses and the same price increases; it sets only additional lifestyle expansion to zero. Negative values are unfunded living costs rather than negative deposits or automatic borrowing. Zero lifestyle expansion still permits a higher nominal bill because prices rise.'},
      {id:'raise-saving-paths',type:'line',title:'The spending decision changes the amount available to compound',unit:'money',xLabel:'Completed years of saving',series:[{name:'Portfolio · selected lifestyle expansion',rows:p.wealth},{name:'Portfolio · no lifestyle expansion',rows:constant.wealth,dash:true}],note:'Both portfolios start at zero and earn the same selected hypothetical return. Their difference comes from saving different monthly surpluses. Costs exceeding income do not trigger an automatic withdrawal; the separate unfunded-cost metric must be resolved before treating either portfolio as a complete household forecast.'},
      {id:'raise-lifestyle-matrix',type:'heatmap',title:'Final-year monthly surpluses across raises and lifestyle expansion',unit:'money',signed:true,columns:['0% extra','1%','2%','3%'],rows:[1,2,3,4].map(netGrowth=>({label:netGrowth+'% net raise',values:[0,1,2,3].map(lifestyleGrowth=>raiseBudget({...input,netGrowth,lifestyleGrowth}).rows.at(-1).surplus)})),note:'Rows replace annual take-home income growth; columns replace extra annual lifestyle expansion. Starting income, starting expenses, price growth and horizon stay selected. Each cell is final-year monthly income less final-year monthly living costs. A negative value is a funding gap. Return assumptions do not affect this cash-flow comparison. These are scenarios without assigned probabilities.'}
    ]};
  }
  throw Error('Unknown budget-exposure planning topic.');
}
