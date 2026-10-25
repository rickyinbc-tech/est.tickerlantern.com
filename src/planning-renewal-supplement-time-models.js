export const renewalSupplementTimeDefinitions={
 depositRenewal:{title:'Compare five one-year deposits with one five-year deposit',fields:[
  ['capital','Same starting principal in each alternative (CAD)',50000,0,1000000,5000],['firstRate','First one-year deposit rate (%)',4,0,10,.25],
  ['renewalRate','Assumed rate on each later one-year renewal (%)',2,0,10,.25],['lockedRate','Assumed five-year annual compound rate (%)',3.5,0,10,.25]
 ]},
 temporaryPension:{title:'Track pension cash with an explicit price year for the later quote',fields:[
  ['startAge','Age in the first modeled full-year period',60,50,64,1],['lifetime','Annual net lifetime pension in the first modeled year (CAD)',24000,0,100000,1000],
  ['temporary','Annual net temporary supplement in the first modeled year (CAD)',12000,0,60000,1000],['bridgeEnd','Age at which the temporary supplement is absent for the full modeled year',65,65,75,1],
  ['laterIncome','Annual net later income in its first payment year (CAD)',9000,0,60000,1000],['laterStart','Age the independent later-income stream begins',67,60,80,1],
  ['incomeGrowth','Assumed annual increase on each modeled income stream (%)',2,0,5,.5],['spending','Annual spending in the first modeled year (CAD)',36000,0,150000,1000],
  ['inflation','Assumed annual spending increase (%)',2,0,6,.5]
 ]},
 diyTime:{title:'Compare actual cash consequences with a separate value for personal time',fields:[
  ['quote','All-in price to hire out the same task (CAD)',3000,0,100000,250],['materials','DIY materials and consumables (CAD)',1200,0,50000,100],
  ['tools','New DIY tools and other upfront costs, no resale assumed (CAD)',300,0,20000,50],['hours','Total personal hours to complete the DIY task',50,0,200,5],
  ['paidShare','Share of DIY hours that actually displaces paid work (%)',40,0,100,5],['netHourly','After-tax earnings actually lost per displaced work hour (CAD)',30,0,200,5],
  ['timeValue','Independent subjective value per non-work hour (CAD)',40,0,200,5],['coordination','Non-work hours coordinating the hired task',5,0,40,1]
 ]}
};

export function depositRenewalPath(d){
 let rolling=d.capital,locked=d.capital;
 const rows=[{x:0,rolling,locked,rollingInterest:0,lockedInterest:0,rollingRate:d.firstRate}];
 for(let year=1;year<=5;year++){
  const rollingRate=year===1?d.firstRate:d.renewalRate,rollingInterest=rolling*rollingRate/100,lockedInterest=locked*d.lockedRate/100;
  rolling+=rollingInterest;locked+=lockedInterest;
  rows.push({x:year,rolling,locked,rollingInterest,lockedInterest,rollingRate});
 }
 const breakEven=d.capital===0?null:Math.expm1((5*Math.log1p(d.lockedRate/100)-Math.log1p(d.firstRate/100))/4);
 return {rows,rolling,locked,gap:rolling-locked,rollingInterest:rolling-d.capital,lockedInterest:locked-d.capital,breakEven};
}

export function temporaryPensionYear(d,age){
 const elapsed=age-d.startAge,factor=(1+d.incomeGrowth/100)**elapsed;
 const lifetime=d.lifetime*factor,temporary=age<d.bridgeEnd?d.temporary*factor:0;
 const later=age>=d.laterStart?d.laterIncome*(1+d.incomeGrowth/100)**(age-d.laterStart):0;
 const total=lifetime+temporary+later,spending=d.spending*(1+d.inflation/100)**elapsed;
 return {x:age,lifetime,temporary,later,total,spending,gap:Math.max(0,spending-total)};
}
export function temporaryPensionPath(d){
 const rows=Array.from({length:91-d.startAge},(_,i)=>temporaryPensionYear(d,d.startAge+i));
 return {quoteReal:d.laterIncome/(1+d.inflation/100)**(d.laterStart-d.startAge),rows,annualGapSum:rows.reduce((s,r)=>s+r.gap,0),largestGap:Math.max(0,...rows.map(r=>r.gap)),boundary:temporaryPensionYear(d,d.bridgeEnd),before:temporaryPensionYear(d,d.bridgeEnd-1)};
}

export function diyTimeLedger(d){
 const workHours=d.hours*d.paidShare/100,leisureHours=d.hours-workHours,lostPay=workHours*d.netHourly;
 const diyCash=d.materials+d.tools+lostPay,hiredCash=d.quote,cashSaving=hiredCash-diyCash;
 const diyTimeValue=leisureHours*d.timeValue,hiredTimeValue=d.coordination*d.timeValue;
 const diyCombined=diyCash+diyTimeValue,hiredCombined=hiredCash+hiredTimeValue;
 return {workHours,leisureHours,lostPay,diyCash,hiredCash,cashSaving,diyTimeValue,hiredTimeValue,diyCombined,hiredCombined,combinedSaving:hiredCombined-diyCombined,hoursExtra:d.hours-d.coordination};
}
const line=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function renewalSupplementTimeResult(kind,d){
 if(kind==='depositRenewal'){
  const p=depositRenewalPath(d);
  return {metrics:[['Five one-year deposits: final principal plus interest',p.rolling,'money'],['One five-year deposit: final principal plus interest',p.locked,'money'],['Constant later renewal rate that equates the endpoints',p.breakEven,'percent']],note:'Original hypothetical five-year comparison, not quoted GIC rates. Both alternatives invest identical principal at time zero. One-year deposits pay all interest at each annual maturity; every dollar is immediately reinvested for another year. The entered first rate applies only in year one and the entered renewal rate applies in each of years two through five. The five-year deposit compounds at its selected annual rate and pays principal plus interest only at its final maturity. Intermediate locked-deposit values are accrued mathematical values, not accessible cash or redemption quotes. No tax, fee, default, deposit-insurance limit, extra contribution, withdrawal, early redemption, account rule or gap between maturities is modeled. The break-even later rate is a constant hypothetical rate for four renewals; it can be negative mathematically and is undefined when no principal is invested.',charts:[
   {id:'renewal-rate-years',type:'groupbar',title:'The first-year rate does not set the rate on later purchases',unit:'percent',unitLabel:'Effective annual rate assumed for each respective year',seriesNames:['One-year deposit or renewal','Five-year locked-rate reference'],rows:p.rows.slice(1).map(r=>({label:'Year '+r.x,values:[r.rollingRate/100,d.lockedRate/100]})),note:'Each renewal is a new hypothetical one-year purchase. No assumption is made that its rate will match the original purchase. The five-year annual compound rate remains the selected rate throughout.'},
   {id:'renewal-capital-path',type:'line',title:'Compare accumulated value at matching year-ends',unit:'money',xLabel:'Completed years after purchase',series:[line('Rolling one-year deposits',p.rows,'rolling'),line('Five-year deposit: accrued value',p.rows,'locked',{dash:true})],note:'The rolling case reinvests both returned principal and interest at every annual maturity. The locked case releases no cash until year five. Equal plotted values would not establish equal access to money before the endpoint.'},
   {id:'renewal-annual-differences',type:'waterfall',title:'Add the year-by-year interest differences to reconcile the final gap',unit:'money',rows:p.rows.slice(1).map(r=>({label:'Year '+r.x+' · rolling less locked interest',value:r.rollingInterest-r.lockedInterest})),totalLabel:'Rolling minus locked final value',note:'Both start with identical principal, so cumulative differences in annual interest reconcile to the final value difference. Each later year uses its own actual accumulated opening balance, preserving the compounding effect of earlier rate differences.'},
   {id:'renewal-future-rate-matrix',type:'heatmap',title:'Final value difference across initial and later renewal rates',unit:'money',signed:true,columns:['0% later','2%','4%','6%'],rows:[2,4,6,8].map(firstRate=>({label:firstRate+'% first',values:[0,2,4,6].map(renewalRate=>depositRenewalPath({...d,firstRate,renewalRate}).gap)})),note:'Rows replace the first one-year rate; columns replace the common rate on all four later renewals. Initial capital and the five-year rate stay selected. Positive cells mean rolling finishes larger under those inputs. No cell predicts a future available rate or recommends a term.'}
  ]};
 }
 if(kind==='temporaryPension'){
  const p=temporaryPensionPath(d),before=p.before,after=p.boundary;
  const ages=[...new Set([d.startAge,d.bridgeEnd-1,d.bridgeEnd,d.laterStart-1,d.laterStart,90])].filter(age=>age>=d.startAge&&age<=90).sort((a,b)=>a-b);
  return {metrics:[['Later-income quote in first-modeled-year purchasing power',p.quoteReal,'money'],['Net income in the first full year without the supplement',after.total,'money'],['Largest annual spending gap through age 90',p.largestGap,'money']],note:'Original hypothetical annual net-cash schedule through age 90, assuming the person remains alive and the entered streams remain payable as described. Lifetime and temporary amounts are independent after-tax cash inputs in the first modeled year. The temporary amount is absent for the full annual period labelled with its ending age. Later income is independently entered for its own first payment year and is not calculated from CPP, QPP, OAS or pension entitlement. Each stream then increases at the selected hypothetical income-growth rate; spending follows its own increase assumption. Real benefits have their own indexing, tax and start/stop rules. Whole-year age labels are a simplification, not a monthly implementation of a plan’s birthday rules. No tax calculation, disability exception, mortality estimate, asset account, return, withdrawal, surplus reinvestment, legal entitlement or pension election is modeled. The sum of positive annual gaps is undiscounted and does not credit other-year surpluses; it is not a required opening capital amount.',charts:[
   {id:'supplement-income-parts',type:'stackbar',title:'Keep the lifetime, temporary and later-income components separate',unit:'money',seriesNames:['Net lifetime pension','Net temporary supplement','Independent later income'],rows:ages.map(age=>{const r=temporaryPensionYear(d,age);return {label:'Annual period labelled age '+age,values:[r.lifetime,r.temporary,r.later]};}),note:'Selected age snapshots show the income components, not cumulative lifetime payments. The temporary component is zero at and after the selected ending age, whether later income has started or not.'},
   {id:'supplement-spending-path',type:'line',title:'The temporary payment can end before replacement income begins',unit:'money',xMin:d.startAge,xLabel:'Age of modeled annual period',series:[line('Total net income from the three streams',p.rows,'total'),line('Annual spending basket',p.rows,'spending',{dash:true})],note:'Net income inputs and spending are both annual CAD. A visible gap is a separate funding need; no automatic portfolio withdrawal is added. Changes in the later-income start age do not extend the temporary supplement.'},
   {id:'supplement-quote-price-year',type:'groupbar',title:'The same quoted number can describe different purchasing power',unit:'money',unitLabel:'CAD in the first modeled year’s purchasing power',seriesNames:['Amount quoted in its future payment year','Same numeral quoted in the first modeled year'],rows:[65,67,70,75].map(age=>({label:'First payment at age '+age,values:[d.laterIncome/(1+d.inflation/100)**(age-d.startAge),d.laterIncome]})),note:'This is a quotation-basis demonstration, not another income stream. It compares the same numeral expressed in two different price years. The selected spending-inflation assumption converts future dollars to the first modeled year’s purchasing power. It does not apply benefit start-age adjustments, income indexing or eligibility rules.'},
   {id:'supplement-gap-matrix',type:'heatmap',title:'Sum of annual gaps across later-income amounts and start ages',unit:'money',columns:['Age 65','67','70','72'],rows:[0,6000,9000,12000].map(laterIncome=>({label:'$'+laterIncome/1000+'k start',values:[65,67,70,72].map(laterStart=>temporaryPensionPath({...d,laterIncome,laterStart}).annualGapSum)})),note:'Rows replace annual later income in its first payment year; columns replace its starting age. Pension amounts, supplement end, growth assumptions and initial spending stay selected. Cells total positive annual gaps through age 90 without discounting or surplus offsets. They are neither benefit estimates nor required investment balances.'}
  ]};
 }
 if(kind==='diyTime'){
  const p=diyTimeLedger(d);
  return {metrics:[['Cash-resource saving from DIY',p.cashSaving,'money'],['Additional personal hours used by DIY',p.hoursExtra,'decimal'],['DIY saving after the separate subjective time valuation',p.combinedSaving,'money']],note:'Original hypothetical comparison of completing the same task yourself or hiring it out. The quote and DIY outlays include all known taxes and fees. New tools are paid in full, with no resale or later-use credit. Only the entered share of DIY hours actually removes paid work, valued at independently entered after-tax earnings lost; the other DIY hours use non-work time. Hiring uses the entered coordination hours from non-work time only. The time-value input is a subjective valuation of non-work hours, not an extra invoice, payroll amount or claim that all free time could be sold for wages. Cash-resource totals include vendor outlays plus actual earnings forgone. Combined totals add the separate subjective time value once. No skill assessment, quality difference, project failure, safety guidance, financing, insurance, warranty value, tax deduction or other work opportunity is modeled.',charts:[
   {id:'diy-work-leisure-hours',type:'stackbar',title:'Distinguish actual lost work hours from non-work time',unit:'decimal',unitLabel:'Personal hours required for the task',tableUnit:'hours',seriesNames:['Hours that actually displace paid work','Non-work hours used'],rows:[{label:'DIY task',values:[p.workHours,p.leisureHours]},{label:'Hire and coordinate',values:[0,d.coordination]}],note:'A weekend hour is not automatically a lost paid hour. The split is independently entered. Hired-task coordination is assumed to use non-work hours; if it removes paid work, this model needs a different cash ledger.'},
   {id:'diy-cash-saving',type:'waterfall',title:'Reconcile the cash consequences before pricing personal time',unit:'money',rows:[{label:'All-in hired price avoided',value:d.quote},{label:'DIY materials and consumables',value:-d.materials},{label:'New tools and upfront costs',value:-d.tools},{label:'After-tax earnings actually forgone',value:-p.lostPay}],totalLabel:'DIY cash-resource saving',note:'A positive endpoint means DIY uses fewer cash resources under the entered scope. Earnings forgone are a missing cash inflow, not another vendor bill. Non-work time has no cash charge in this bridge.'},
   {id:'diy-cash-subjective-time',type:'stackbar',title:'A subjective time value changes the broader comparison, not the bank bill',unit:'money',seriesNames:['Cash resources spent or forgone','Subjective value of non-work time'],rows:[{label:'DIY task',values:[p.diyCash,p.diyTimeValue]},{label:'Hire and coordinate',values:[p.hiredCash,p.hiredTimeValue]}],note:'The second component is explicitly a preference-based money equivalent. It is not cash paid or an investment return. Actual lost work hours are already charged through earnings forgone and are not priced a second time as non-work time.'},
   {id:'diy-hours-paid-share',type:'heatmap',title:'Cash-resource saving across task hours and displaced-work shares',unit:'money',signed:true,columns:['0% work','25%','50%','100%'],rows:[20,50,80,120].map(hours=>({label:hours+' hours',values:[0,25,50,100].map(paidShare=>diyTimeLedger({...d,hours,paidShare}).cashSaving)})),note:'Rows replace total DIY hours; columns replace the share that genuinely displaces paid work. The quote, materials, tools and after-tax hourly earnings stay selected. Subjective time value does not affect this cash-only matrix. A negative cell means hiring costs fewer cash resources under that scenario.'}
  ]};
 }
 throw Error('Unknown renewal, supplement or personal-time planning topic.');
}
