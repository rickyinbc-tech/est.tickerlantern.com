import { lifeSource } from './planning-life-data.js';
export { lifeSource };
export const resilienceDefinitions={
  longevity:{title:'Explore a longer retirement funding horizon',fields:[
    ['gap','Annual spending gap in today’s CAD',20000,0,100000,1000],['years','Years to fund after age 65',30,10,40,1],
    ['real','Assumed annual real return (%)',2,-2,5,.5],['capital','Capital allocated today (CAD)',400000,0,2000000,10000]
  ]},
  fees:{title:'Explore recurring investment fees',fields:[
    ['initial','Starting savings (CAD)',10000,0,1000000,1000],['monthly','Month-end contribution (CAD)',500,0,5000,50],
    ['gross','Assumed annual return before fees (%)',5,-5,10,.5],['years','Years invested',30,1,40,1],
    ['feeA','Annual fee A (%)',.25,0,3,.25],['feeB','Annual fee B (%)',1.75,0,3,.25]
  ]},
  calendar:{title:'Explore a calendar for periodic bills',fields:[
    ['reserve','Starting earmarked reserve (CAD)',500,0,20000,100],['monthly','Monthly amount set aside (CAD)',375,0,3000,25],
    ['insurance','Insurance bill · month 3 (CAD)',1200,0,10000,100],['repairs','Maintenance bill · month 6 (CAD)',600,0,10000,100],
    ['travel','Travel bill · month 8 (CAD)',1800,0,20000,100],['gifts','Gifts and events · month 12 (CAD)',900,0,10000,100]
  ]}
};
export function levelFunding(gap,years,real){
  const r=real/100;return r===0?gap*years:gap*-Math.expm1(-years*Math.log1p(r))/r;
}
export function feePath(input,fee){
  const gm=Math.expm1(Math.log1p(input.gross/100)/12),fm=-Math.expm1(Math.log1p(-fee/100)/12);
  let value=input.initial,paid=0;const rows=[{x:0,value,paid}];
  for(let month=1;month<=input.years*12;month++){
    const grown=value*(1+gm),charge=grown*fm;paid+=charge;value=grown-charge+input.monthly;
    if(month%12===0)rows.push({x:month/12,value,paid});
  }
  return {rows,end:value,paid};
}
export function billCalendar(input,monthly=input.monthly,reserve=input.reserve){
  const bills=[{label:'Insurance · month 3',month:3,value:input.insurance},{label:'Maintenance · month 6',month:6,value:input.repairs},{label:'Travel · month 8',month:8,value:input.travel},{label:'Gifts and events · month 12',month:12,value:input.gifts}];
  let balance=reserve,cumulative=0,required=0;const rows=[{x:0,value:balance}];
  for(let month=1;month<=12;month++){
    const due=bills.filter(b=>b.month===month).reduce((sum,b)=>sum+b.value,0);cumulative+=due;
    balance+=monthly-due;required=Math.max(required,(cumulative-reserve)/month);rows.push({x:month,value:balance});
  }
  return {bills,rows,total:bills.reduce((sum,b)=>sum+b.value,0),required:Math.max(0,required),gap:Math.max(0,-Math.min(...rows.map(r=>r.value))),ending:balance};
}
export function resilienceResult(kind,input){
  if(kind==='longevity'){
    const reserve=levelFunding(input.gap,input.years,input.real),base=lifeSource.rows[0];
    const official={source:lifeSource.url,evidence:'Derived from official statistics',unit:'percent',unitLabel:'Conditional share surviving from age 65 (%)'};
    return {metrics:[['Annual spending gap',input.gap,'money'],['Reserve for selected horizon',reserve,'money'],['Gap after allocated capital',Math.max(0,reserve-input.capital),'money']],note:'Official context: Statistics Canada, Canada, preliminary 2022–2024 period life table; source categories Males and Females. Survival shares are lx / l65, not individual forecasts. Changing controls leaves official observations unchanged. Funding illustrations separately assume a level annual shortfall, paid at year-end, and a constant real return after costs and tax. No survival weighting, market volatility, annuity pricing or benefits rules are applied.',charts:[
      {id:'longevity-survival',type:'line',...official,title:'Survival after 65 extends beyond an average',xMin:65,xLabel:'Exact age reached',series:['Males','Females'].map((name,index)=>({name,rows:lifeSource.rows.map(row=>({x:row[0],value:row[index+1]/base[index+1]})),dash:index===1})),note:'Canada, 2022–2024 preliminary period estimates, released 13 January 2026. Each series starts with people who have already reached 65 in its synthetic life table. No future mortality improvement or personal health adjustment is projected.'},
      {id:'longevity-milestones',type:'groupbar',...official,title:'The share reaching later birthdays, conditional on reaching 65',seriesNames:['Males','Females'],rows:[85,90,95].map(age=>{const row=lifeSource.rows.find(r=>r[0]===age);return {label:'Reach age '+age,values:[row[1]/base[1],row[2]/base[2]]};}),note:'Derived from the published lx survivor counts, within each source sex category. These are period-table survival shares, not survey proportions, certainty about an individual, or a household joint-survival estimate.'},
      {id:'longevity-funding',type:'groupbar',title:'Longer horizons require funding more payments',unit:'money',seriesNames:['Modeled reserve needed','Allocated capital'],rows:[20,25,30,35].map(years=>({label:years+' years · through age '+(65+years),values:[levelFunding(input.gap,years,input.real),input.capital]})),note:'Hypothetical funding amounts in today’s CAD. The first payment is one year after age 65. No probability weights reduce the payments. The horizon labels are explicit assumptions, not recommended retirement end dates.'},
      {id:'longevity-matrix',type:'heatmap',title:'The funding gap across horizon and real return',unit:'money',columns:[20,25,30,35].map(years=>years+' years'),rows:[-1,0,2,4].map(real=>({label:real+'% real',values:[20,25,30,35].map(years=>Math.max(0,levelFunding(input.gap,years,real)-input.capital))})),note:'Additional capital required after the selected allocation. Zero means the deterministic model is funded under that cell’s assumptions; it is not a success probability. Real returns must be consistent with the constant-purchasing-power cash flows.'}
    ]};
  }
  if(kind==='fees'){
    const free=feePath(input,0),a=feePath(input,input.feeA),b=feePath(input,input.feeB),effect=free.end-b.end-b.paid;
    return {metrics:[['Ending value · fee A',a.end,'money'],['Ending value · fee B',b.end,'money'],['Difference · A minus B',a.end-b.end,'money']],note:'Hypothetical identical investments before fees. Annual fees are effective fractions of assets, converted to equivalent monthly charges. Every month: investment growth, then fee on the grown opening balance, then a month-end contribution. Net annual growth factor is (1 + gross return) × (1 − annual fee). Constant returns; nominal CAD before tax and inflation. No transaction, fixed-dollar, performance or other charges are included.',charts:[
      {id:'fees-path',type:'line',title:'Recurring costs change how much remains invested',unit:'money',xLabel:'Years invested',series:[{name:'No modeled fee',rows:free.rows},{name:'Fee A · '+input.feeA+'%',rows:a.rows,dash:true},{name:'Fee B · '+input.feeB+'%',rows:b.rows}],note:'All paths use identical initial savings, contributions and gross returns. The no-fee path is a mathematical reference, not a claim that an equivalent service or investment is available for free.'},
      {id:'fees-paid',type:'bar',title:'The dollars deducted as recurring fees',unit:'money',rows:[{label:'Fee A · '+input.feeA+'%',value:a.paid},{label:'Fee B · '+input.feeB+'%',value:b.paid}],note:'Sum of actual modeled monthly deductions, with no discounting or inflation adjustment. This is different from the ending-wealth gap because removed money also stops participating in later investment returns.'},
      {id:'fees-bridge',type:'waterfall',title:'Reconcile the reference value to fee B’s ending value',unit:'money',rows:[{label:'No-fee reference ending value',value:free.end},{label:'Fee B · direct deductions',value:-b.paid},{label:'Effect of returns on deducted fees',value:-effect}],totalLabel:'Fee B ending value',note:'The return effect is the residual wealth difference beyond direct deductions. With positive gross returns it is usually a further reduction; with negative gross returns it can reverse sign because deducted amounts avoid later losses. It is not another fee charge.'},
      {id:'fees-matrix',type:'heatmap',title:'The ending-value gap from the no-fee reference',unit:'money',columns:[10,20,30,40].map(years=>years+' years'),rows:[.25,.75,1.5,2].map(fee=>({label:fee+'% fee',values:[10,20,30,40].map(years=>feePath({...input,years},0).end-feePath({...input,years},fee).end)})),note:'Each cell changes the fee and horizon, holding the selected initial balance, monthly contribution and gross return constant. These amounts are cumulative wealth differences, not yearly fee bills or forecasts of investment performance.'}
    ]};
  }
  if(kind==='calendar'){
    const p=billCalendar(input),covered=billCalendar(input,p.required);
    return {metrics:[['Total listed annual bills',p.total,'money'],['Largest timing shortfall',p.gap,'money'],['Monthly amount avoiding a shortfall',p.required,'money']],note:'Hypothetical twelve-month calendar starting before month 1. Contributions arrive before the bill payment at each month-end. Four example bills fall in months 3, 6, 8 and 12. Starting reserve is already earmarked for these bills. No interest, inflation or other income and expenses are included. A negative projected balance marks unfunded spending, not approved borrowing or permission to use an overdraft.',charts:[
      {id:'calendar-bills',type:'bar',title:'Put each bill on its payment date',unit:'money',rows:p.bills,note:'The fixed due-month pattern is illustrative. Replace it with actual amounts and dates when making a household plan. This reserve covers planned periodic bills separately from a reserve for unexpected emergencies.'},
      {id:'calendar-balance',type:'line',title:'An affordable annual total can still leave a midyear gap',unit:'money',xLabel:'Month of the example year',series:[{name:'Selected monthly saving',rows:p.rows},{name:'Monthly amount avoiding a shortfall',rows:covered.rows,dash:true}],note:'Signed earmarked balance after each month’s contribution and bills. A line below zero identifies money that must come from another source. The solved contribution avoids a negative month-end balance over this one calendar.'},
      {id:'calendar-bridge',type:'waterfall',title:'Reconcile the year-end reserve',unit:'money',rows:[{label:'Starting earmarked reserve',value:input.reserve},{label:'Twelve monthly contributions',value:12*input.monthly},...p.bills.map(b=>({label:b.label,value:-b.value}))],totalLabel:'Year-end reserve / shortfall',note:'This annual reconciliation does not show the order of payments. A positive endpoint can coexist with a shortfall earlier in the year; use the monthly line to check timing.'},
      {id:'calendar-matrix',type:'heatmap',title:'How starting cash and monthly saving affect the largest gap',unit:'money',columns:[0,500,1000,2000].map(reserve=>'$'+reserve.toLocaleString('en-CA')),rows:[250,375,500,750].map(monthly=>({label:'$'+monthly+'/mo',values:[0,500,1000,2000].map(reserve=>billCalendar(input,monthly,reserve).gap)})),note:'Cells show the largest unfunded month-end balance over the year. Darker cells indicate a larger gap. The column amounts are alternative starting reserves, not extra bill costs or annual income.'}
    ]};
  }
  throw Error('Unknown resilience planning topic.');
}
