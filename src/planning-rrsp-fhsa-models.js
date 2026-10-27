// CRA, First Home Savings Account Statistics (2024 tax year), Table 2 by federal tax bracket (page details 2026-10-14; data
// processed to 30 June 2026; counts rounded to 10, dollars to the thousand). CSV captured in qa/fhsa-excess-next/sources.
// [bracket, holders, accounts, holders who contributed, total contributions, holders who withdrew, total withdrawals (CAD)].
export const FHSA_FLOWS={url:'https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/income-statistics-gst-hst-statistics/first-home-savings-account-statistics/first-home-savings-account-statistics-2024-tax-year.html',
  brackets:[['CAD 55,867 or less',802620,915360,541620,3052561000,54640,615946000],['CAD 55,867 to 111,733',527820,614280,401390,2677809000,69720,856190000],['CAD 111,733 to 173,205',91390,109940,69270,523330000,15830,205112000],['CAD 173,205 to 246,752',21280,26020,16490,133610000,3880,51803000],['CAD 246,752 or more',12170,14900,9770,83408000,2330,32739000]],
  total:['All tax brackets',1455280,1680490,1038540,6470717000,146400,1761791000]};

const issue=i=>{
  if(i.rftRoom>40000-i.rftUsed)return {message:'FHSA participation room cannot be larger than what is left of the CAD 40,000 lifetime limit. Lower the 2026 room or the amount already used.',fields:['rftRoom','rftUsed']};
  return null;
};
export const rrspFhsaDefinitions={
  rrspFhsaTransfer:{title:'Move RRSP savings into an FHSA, or leave them for the Home Buyers’ Plan: home cash, retirement savings and repayments',inputIssue:issue,fields:[
    ['rftRrsp','RRSP balance you could use for the home today (CAD)',30000,0,200000,500],
    ['rftCash','New cash you can save for the home at the start of each year (CAD)',4000,0,40000,500],
    ['rftYears','Years of saving before the purchase (1 = buy at the end of 2026)',3,1,15,1],
    ['rftRoom','FHSA participation room in 2026 (CAD 8,000 in the year the first FHSA is opened)',8000,0,16000,500],
    ['rftUsed','Contributions and transfers before 2026 that count toward the CAD 40,000 lifetime limit (CAD)',0,0,40000,500],
    ['rftReturn','Annual return in every account (%)',4,0,10,.5],
    ['rftTaxNow','Marginal tax rate that an FHSA deduction saves now (%)',30,0,55,1],
    ['rftTaxRet','Marginal tax rate when RRSP money comes out in retirement (%)',20,0,55,1],
    ['rftHbp','Home Buyers’ Plan withdrawal you want at the purchase (CAD, at most 60,000)',25000,0,60000,500],
    ['rftRelief','Apply the extended repayment relief for a first HBP withdrawal in 2026 to 2028 (1 = yes, 0 = no)',1,0,1,1]
  ]}
};
export const rrspFhsaWholeKeys=['rftYears','rftRelief'];

// CRA, Transfers into your FHSAs (page details 2026-08-17): a direct RRSP-to-FHSA transfer (Form RC720) is not deductible,
// reduces unused FHSA participation room, must not exceed that room, and does not restore RRSP deduction room.
// CRA, Participation room (page details 2026-09-17): CAD 8,000 in the opening year; later years, the lesser of CAD 8,000 plus
// a carryforward of at most CAD 8,000 and CAD 40,000 less earlier contributions and RRSP transfers.
// CRA, The Home Buyers' Plan (page details 2026-02-17): limit CAD 60,000; repayments over 15 years start in the second year
// after the withdrawal, deferred to the fifth year for a first withdrawal from 2022 to 2025, a relief the page says has been
// extended to first withdrawals from 2026 to 2028 (2026 withdrawal: first repayment year 2031). CRA's repayment page (page
// details 2026-01-20) still lists only 2022 to 2025, hence the rftRelief switch. A shortfall from the yearly minimum
// (balance divided by years left) is included in income; repayments are not deductible.
export const rrspFhsaRules={annual:8000,carryMax:8000,lifetime:40000,hbpLimit:60000,hbpYears:15,standardStart:2,reliefStart:5,reliefFirst:2026,reliefLast:2028,firstYear:2026};
export const strategyNames={cashOnly:'Cash into the FHSA, RRSP untouched',topUp:'Cash first, RRSP transfer fills the rest of the room',transferFirst:'RRSP transfer first, cash into a TFSA'};

// Deposits at the start of each year, growth to the end of the year, purchase at the end of the last year. The FHSA
// deduction refund for a year's cash contributions arrives at the start of the next year (into the TFSA); the last refund
// arrives after the purchase and is counted without growth. All accounts earn the same return; the TFSA is assumed to have room.
export function rrspFhsaPlan(input,strategy){
  const i=input,R=rrspFhsaRules,r=i.rftReturn/100,tNow=i.rftTaxNow/100,tRet=i.rftTaxRet/100;
  let fhsa=0,tfsa=0,rrsp=i.rftRrsp,lifeLeft=R.lifetime-i.rftUsed,room=Math.min(i.rftRoom,lifeLeft),refund=0,cashIn=0,transferIn=0;
  const rows=[];
  for(let y=0;y<i.rftYears;y++){
    tfsa+=refund;
    const roomY=room;let c,x;
    if(strategy==='transferFirst'){x=Math.min(roomY,rrsp);c=Math.min(i.rftCash,roomY-x);}
    else{c=Math.min(i.rftCash,roomY);x=strategy==='topUp'?Math.min(roomY-c,rrsp):0;}
    rrsp-=x;fhsa+=c+x;tfsa+=i.rftCash-c;refund=tNow*c;lifeLeft-=c+x;cashIn+=c;transferIn+=x;
    const unused=roomY-c-x;
    rows.push({year:R.firstYear+y,room:roomY,cash:c,transfer:x,unused,refund});
    fhsa*=1+r;tfsa*=1+r;rrsp*=1+r;
    room=Math.min(R.annual+Math.min(R.carryMax,unused),lifeLeft);
  }
  const hbp=Math.min(i.rftHbp,R.hbpLimit,rrsp),rrspLeft=rrsp-hbp,save=fhsa+tfsa+refund,homeCash=save+hbp;
  return {strategy,rows,fhsa,tfsa:tfsa+refund,lastRefund:refund,hbp,rrspBefore:rrsp,rrspLeft,homeCash,cashIn,transferIn,
    // Repaying the HBP balance takes after-tax cash that becomes RRSP money taxed later, so the obligation costs tRet per dollar.
    netWorth:homeCash+(1-tRet)*rrspLeft-tRet*hbp,shortfallHbp:i.rftHbp-hbp};
}

export function hbpSchedule(amount,withdrawalYear,relief){
  const R=rrspFhsaRules,eligible=relief&&withdrawalYear>=R.reliefFirst&&withdrawalYear<=R.reliefLast,first=withdrawalYear+(eligible?R.reliefStart:R.standardStart);
  const rows=[];let bal=amount;
  for(let k=0;k<R.hbpYears;k++){const min=bal/(R.hbpYears-k);rows.push({year:first+k,opening:bal,minimum:min});bal-=min;}
  return {first,last:first+R.hbpYears-1,eligible,minimum:amount/R.hbpYears,rows};
}

export function rrspFhsaCompare(input){
  const plans=Object.fromEntries(Object.keys(strategyNames).map(k=>[k,rrspFhsaPlan(input,k)]));
  const best=Object.values(plans).reduce((a,b)=>b.netWorth>a.netWorth+1e-9?b:a);
  return {plans,best};
}

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});

export function rrspFhsaResult(kind,input){
  if(kind!=='rrspFhsaTransfer')throw Error('Unknown RRSP-to-FHSA topic');
  const {plans,best}=rrspFhsaCompare(input),A=plans.cashOnly,B=plans.topUp,C=plans.transferFirst,R=rrspFhsaRules;
  const W=R.firstYear+input.rftYears-1,sched=hbpSchedule(best.hbp,W,input.rftRelief===1),std=hbpSchedule(best.hbp,W,false);
  const S=FHSA_FLOWS,T=S.total;
  const sweep=Array.from({length:12},(_,k)=>k*5).map(t=>{const q=rrspFhsaCompare({...input,rftTaxRet:t}).plans;return {t,b:q.topUp.netWorth-q.cashOnly.netWorth,c:q.transferFirst.netWorth-q.cashOnly.netWorth};});
  const order=Object.values(plans).sort((a,b)=>b.netWorth-a.netWorth);
  const note=`Over ${input.rftYears} year${input.rftYears===1?'':'s'} to a purchase at the end of ${W}, contributions and transfers together can put at most ${money(Math.min(input.rftRoom+R.annual*(input.rftYears-1),R.lifetime-input.rftUsed))} into the FHSA. ${B.transferIn>0?`Filling the room your cash leaves with an RRSP transfer moves ${money(B.transferIn)} out of the RRSP. `:'Your cash fills all the FHSA room, so the top-up approach moves nothing from the RRSP. '}The best position after tax is “${strategyNames[best.strategy]}”: ${money(best.homeCash)} of home cash and ${money(best.netWorth)} after allowing ${input.rftTaxRet}% tax on RRSP money still to come out. ${C.transferIn>B.transferIn?`Putting the transfer first instead gives up ${money(C.cashIn<A.cashIn?(A.cashIn-C.cashIn)*input.rftTaxNow/100:0)} of FHSA deduction refunds to move ${money(C.transferIn-B.transferIn)} more out of the RRSP. `:''}${best.hbp>0?`An HBP withdrawal of ${money(best.hbp)} in ${W} needs at least ${money(sched.minimum)} a year from ${sched.first} to ${sched.last}${sched.eligible?' under the extended relief':''}. `:''}${best.shortfallHbp>0?`The RRSP holds only ${money(best.rrspBefore)} by then, so the HBP is ${money(best.shortfallHbp)} short of the amount you entered. `:''}These are planning estimates with one return in every account, not CRA determinations.`;
  return {metrics:[
    ['Home cash: cash into the FHSA, RRSP untouched',A.homeCash,'money'],
    ['Home cash: RRSP transfer tops up the room',B.homeCash,'money'],
    ['Home cash: RRSP transfer first',C.homeCash,'money'],
    ['Best after-tax position at the purchase',best.netWorth,'money'],
    ['RRSP moved to the FHSA by the top-up approach',B.transferIn,'money'],
    ['HBP withdrawal at the purchase (best approach)',best.hbp,'money'],
    ['First HBP repayment year',best.hbp>0?sched.first:0,'year'],
    ['Minimum HBP repayment each year',best.hbp>0?sched.minimum:0,'money']
  ],note,charts:[
    {id:'rft-cra-withdrawals',type:'groupbar',evidence:'Official tax statistics',unit:'money',title:'Average FHSA contribution and average FHSA withdrawal in 2024, by federal tax bracket',seriesNames:['Average contribution per holder who contributed','Average withdrawal per holder who withdrew'],rowLabel:'Federal tax bracket (taxable income)',rows:[...S.brackets,T].map(r=>({label:r[0],values:[r[4]/r[3],r[6]/r[5]]})),source:S.url,sourceLabel:'CRA · First Home Savings Account Statistics, 2024 tax year, Table 2',note:`In 2024, ${(T[5]/1e3).toFixed(1)} thousand of ${(T[1]/1e6).toFixed(2)} million FHSA holders (${(100*T[5]/T[1]).toFixed(1)}%) withdrew a total of CAD ${(T[6]/1e9).toFixed(2)} billion, an average of ${money(T[6]/T[5])} each, against ${money(T[4]/T[3])} per contributor. CRA does not separate qualifying withdrawals for a home from taxable ones, and its contribution totals do not say how much came from RRSP transfers. Averages are totals divided by people (CRA rounds counts to 10 and dollars to the thousand); they are not medians.`},
    {id:'rft-home-cash',type:'stackbar',unit:'money',title:`Cash available for the home at the end of ${W}, by approach`,seriesNames:['FHSA (qualifying withdrawal, tax-free)','TFSA savings and deduction refunds','HBP withdrawal from the RRSP'],rows:Object.values(plans).map(p=>({label:strategyNames[p.strategy],values:[p.fhsa,p.tfsa,p.hbp]})),note:`The same ${money(input.rftCash)} a year is saved in every approach. An RRSP transfer adds to the FHSA but takes the room your cash would have used, so that cash goes to the TFSA without a deduction. The HBP comes from whatever is left in the RRSP, up to ${money(input.rftHbp)}; a transfer-first approach can leave less for it.`},
    {id:'rft-net-worth',type:'bar',unit:'money',unitLabel:'Home cash plus RRSP after future tax, less the tax cost of HBP repayments · CAD',title:'Position after tax at the purchase, by approach',rows:order.map(p=>({label:strategyNames[p.strategy],value:p.netWorth})),note:`RRSP money still in the plan is counted at ${100-input.rftTaxRet}% of its value, after ${input.rftTaxRet}% tax when it comes out. An HBP dollar is counted in full now but has to be repaid with after-tax cash that later becomes taxable RRSP money, so each dollar owed costs ${input.rftTaxRet}%. On that basis the HBP itself changes nothing; what changes the result is moving RRSP money into the tax-free FHSA (worth the retirement tax rate) and the FHSA deduction on cash (worth today’s rate). Growth during the HBP repayment years is ignored.`},
    {id:'rft-room-use',type:'stackbar',unit:'money',title:'How the FHSA room is used each year when an RRSP transfer tops up your cash',seriesNames:['Cash contribution (deductible)','RRSP transfer (not deductible)','Room left unused'],rows:B.rows.map(r=>({label:String(r.year),values:[r.cash,r.transfer,r.unused]})),note:`Room is CAD 8,000 a year plus up to CAD 8,000 carried forward, within CAD 40,000 for life, shared by contributions and RRSP transfers. ${B.rows.some(r=>r.unused>0)?'Room left unused carries forward up to CAD 8,000. ':'No room is left unused here. '}A transfer cannot be larger than the room at the time, and moving it does not give back RRSP deduction room.`},
    {id:'rft-hbp-schedule',type:'line',unit:'money',title:best.hbp>0?`HBP balance after a ${money(best.hbp)} withdrawal in ${W}, with and without the extended relief`:'HBP balance (no HBP withdrawal in the best approach)',xLabel:'Year',series:[{name:sched.eligible?'Balance, repayments from the fifth year':'Balance, repayments from the second year',rows:[{x:W,value:best.hbp},...sched.rows.map(r=>({x:r.year,value:r.opening-r.minimum}))]},{name:'Balance under the standard second-year start',dash:true,rows:[{x:W,value:best.hbp},...std.rows.map(r=>({x:r.year,value:r.opening-r.minimum}))]},{name:'Minimum repayment each year',rows:sched.rows.map(r=>({x:r.year,value:r.minimum}))}],note:`The minimum each year is the balance divided by the years left, which stays at one-fifteenth if every minimum is paid. Repayments are RRSP contributions designated on Schedule 7, can be made up to 60 days after the year, and are not deductible. Any shortfall is added to income for that year. ${sched.eligible?`CRA’s HBP overview says a first withdrawal from 2026 to 2028 starts repaying in the fifth year after; its repayment page still lists only 2022 to 2025. The dashed line shows the standard rule.`:`Your withdrawal year ${W} is ${W>R.reliefLast?'after 2028, so the standard rule applies':'modelled under the standard rule'}.`}`},
    {id:'rft-retirement-rate',type:'line',unit:'money',title:'Gain over leaving the RRSP alone, by the tax rate when RRSP money comes out',xLabel:'Marginal tax rate in retirement (%)',series:[{name:'RRSP transfer tops up the room',rows:sweep.map(s=>({x:s.t,value:s.b}))},{name:'RRSP transfer first',rows:sweep.map(s=>({x:s.t,value:s.c}))}],note:`Each point reruns your inputs with a different retirement tax rate and today’s rate kept at ${input.rftTaxNow}%. A transfer turns RRSP money, which is taxed when it comes out, into FHSA money, which is not, so its value rises with the retirement rate. Putting the transfer before your cash also gives up the FHSA deduction on that cash, so it overtakes the top-up approach only near the point where the retirement rate passes today’s rate (the refund delay and growth move the crossing slightly).`}
  ]};
}
