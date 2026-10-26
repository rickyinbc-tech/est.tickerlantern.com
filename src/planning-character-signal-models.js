export const characterSignalDefinitions={
  incomeCharacter:{title:'Compare the same fund return paid as interest, dividends, realized gains or deferred growth',fields:[
    ['icAmount','Amount invested at the start (CAD)',50000,1000,2000000,1000],
    ['icReturn','Total return each year, after fund costs (%)',6,0,12,.25],
    ['icYield','Dividend fund: eligible Canadian dividends each year (%)',3,0,8,.25],
    ['icFedRate','Federal marginal tax rate (%)',20.5,0,33,.5],
    ['icProvRate','Provincial or territorial marginal tax rate (%)',9.15,0,25,.05],
    ['icProvDtc','Provincial dividend tax credit, % of the grossed-up eligible dividend',10,0,20,.01],
    ['icYears','Years before the non-registered holding is sold',20,1,40,1]
  ]},
  crashSignal:{title:'Test a crash warning signal that is sometimes a false alarm',inputIssue:i=>i.csTrue>i.csWarnings?{message:'The number of warnings followed by a crash cannot exceed the number of warnings.',fields:['csTrue']}:null,fields:[
    ['csCapital','Balance already invested at the start (CAD)',100000,1000,5000000,1000],
    ['csYears','Planning horizon (years)',25,10,40,1],
    ['csWarnings','Crash warnings acted on during the horizon',6,0,12,1],
    ['csTrue','Warnings actually followed by a crash',2,0,12,1],
    ['csMissed','Crashes that arrive with no warning',1,0,6,1],
    ['csCrash','Market fall in a crash year (%)',25,5,60,1],
    ['csRebound','Market gain in the year after a crash (%)',25,0,80,1],
    ['csNormal','Market return in an ordinary year (%)',6,-2,12,.25],
    ['csCash','Interest on cash while out of the market (%)',2.5,0,8,.25],
    ['csOut','Years spent in cash after each warning',2,1,5,1]
  ]}
};
export const characterSignalWholeKeys=['icYears','csYears','csWarnings','csTrue','csMissed','csOut'];

// CRA 2025 General Income Tax and Benefit Guide (5000-G): eligible dividends are grossed up to 138% of the amount
// received, and the federal dividend tax credit is 15.0198% of that taxable amount. Capital gains use the one-half
// inclusion rate shown in CRA's capital gains guidance.
export const eligibleGrossUp=1.38;
export const federalEligibleCredit=.150198;
export const capitalGainsInclusion=.5;

// Tax per dollar of each kind of income at the entered marginal rates. A negative dividend rate means the credits
// exceed the tax on the grossed-up amount and reduce tax on other income; the credits are non-refundable, so this
// assumes enough other tax exists to absorb them.
export function incomeTaxRates(i){
  const m=(i.icFedRate+i.icProvRate)/100;
  return {interest:m,dividend:eligibleGrossUp*(m-federalEligibleCredit-i.icProvDtc/100),gain:m*capitalGainsInclusion,tfsa:0};
}

export const profiles=[['interest','Interest-paying fund'],['dividend','Canadian dividend fund'],['turnover','High-turnover fund (gains realized yearly)'],['deferred','Low-turnover fund (gains deferred to sale)'],['tfsa','Any of these funds in a TFSA']];

// Year order in the non-registered account: income is paid and taxed in the year, the after-tax cash is reinvested in
// the same fund (raising the adjusted cost base), and any remaining growth stays unrealized until the final sale.
// Each year-end row also shows the value after a hypothetical sale at that date; a loss on sale is given no tax value.
export function incomeCharacterPlan(input,profile,overrides={}){
  const i={...input,...overrides},r=i.icReturn/100,t=incomeTaxRates(i);
  const y=profile==='dividend'?i.icYield/100:profile==='interest'||profile==='turnover'?r:0;
  const rate=profile==='interest'?t.interest:profile==='dividend'?t.dividend:profile==='turnover'?t.gain:0;
  const growth=profile==='dividend'?r-y:profile==='deferred'||profile==='tfsa'?r:0;
  let value=i.icAmount,acb=i.icAmount,paid=0;
  const sale=()=>profile==='tfsa'?0:Math.max(0,value-acb)*t.gain;
  const rows=[{x:0,value,afterTax:value,paid:0,saleTax:0}];
  for(let year=1;year<=i.icYears;year++){
    const income=value*y,tax=income*rate;paid+=tax;
    value=value*(1+growth)+income-tax;acb+=income-tax;
    const s=sale();rows.push({x:year,value,afterTax:value-s,paid,saleTax:s});
  }
  const last=rows.at(-1);
  return {rows,afterTax:last.afterTax,paid,saleTax:last.saleTax,pretax:last.value,annual:Math.pow(last.afterTax/i.icAmount,1/i.icYears)-1};
}

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(n,d=1)=>(n*100).toFixed(d)+'%';
// Half-up to cents, so 14.825 shows as 14.83 rather than the binary-float 14.82.
const cents=n=>(Math.round(n*100+1e-7)/100).toFixed(2);

// Episode multipliers relative to the opening value of each episode. A true or unwarned crash covers the crash year and
// the rebound year; after a warning the investor holds cash for csOut years, then rejoins the market.
function episodes(i){
  const c=i.csCrash/100,b=i.csRebound/100,g=i.csNormal/100,cash=i.csCash/100,w=i.csOut;
  const crashYears=k=>k===0?-c:k===1?b:g;
  const run=(len,market,out)=>{let inv=1,timer=1;const invRows=[],timerRows=[];for(let k=0;k<len;k++){inv*=1+market(k);timer*=1+(k<out?cash:market(k));invRows.push(inv);timerRows.push(timer);}return {len,inv,timer,invRows,timerRows};};
  return {
    hit:run(Math.max(w,2),crashYears,w),
    falseAlarm:run(w,()=>g,w),
    missed:run(2,crashYears,0),
    normal:run(1,()=>g,0)
  };
}

export function breakEvenHitRate(input,overrides={}){
  const e=episodes({...input,...overrides}),a=Math.log(e.hit.timer/e.hit.inv),f=Math.log(e.falseAlarm.timer/e.falseAlarm.inv);
  if(f>=0)return 0;
  if(a<=0)return null;
  return -f/(a-f);
}

// Order of episodes for the path chart only: warnings are spread so true and false alarms alternate as evenly as their
// counts allow, unwarned crashes are spaced through the list, and ordinary years fill the gaps. Ending values do not
// depend on this order because each investor's growth multiplies across years.
export function crashSignalPlan(input,overrides={}){
  const i={...input,...overrides},e=episodes(i),K=i.csWarnings,T=Math.min(i.csTrue,K),F=K-T,M=i.csMissed;
  const warn=[];let acc=0;for(let k=0;k<K;k++){acc+=T;if(acc>=K&&warn.filter(x=>x==='hit').length<T){acc-=K;warn.push('hit');}else warn.push('falseAlarm');}
  while(warn.filter(x=>x==='hit').length<T){const j=warn.lastIndexOf('falseAlarm');warn[j]='hit';}
  const list=[...warn];for(let m=0;m<M;m++)list.splice(Math.max(0,Math.round((m+1)*(K+1)/(M+1))-1)+m,0,'missed');
  const episodeYears=list.reduce((a,k)=>a+e[k].len,0),horizon=Math.max(i.csYears,episodeYears),normalYears=horizon-episodeYears;
  const gaps=Array.from({length:list.length+1},(_,k)=>Math.floor(normalYears*(k+1)/(list.length+1))-Math.floor(normalYears*k/(list.length+1)));
  let inv=i.csCapital,timer=i.csCapital,x=0,cashYears=0;const invRows=[{x:0,value:inv}],timerRows=[{x:0,value:timer}],detail=[];
  const normal=n=>{for(let k=0;k<n;k++){inv*=1+i.csNormal/100;timer*=1+i.csNormal/100;x++;invRows.push({x,value:inv});timerRows.push({x,value:timer});}};
  list.forEach((kind,k)=>{
    normal(gaps[k]);const ep=e[kind],inv0=inv,timer0=timer;
    ep.invRows.forEach((v,j)=>{x++;invRows.push({x,value:inv0*v});timerRows.push({x,value:timer0*ep.timerRows[j]});});
    inv=inv0*ep.inv;timer=timer0*ep.timer;if(kind!=='missed')cashYears+=i.csOut;
    detail.push({kind,startYear:x-ep.len+1,relative:ep.timer/ep.inv-1});
  });
  normal(gaps.at(-1));
  return {invRows,timerRows,inv,timer,detail,horizon,extended:horizon>i.csYears,cashYears,hits:T,falseAlarms:F,missed:M};
}

export function characterSignalResult(kind,input){
  if(kind==='incomeCharacter'){
    const t=incomeTaxRates(input),plans=profiles.map(([key,label])=>({key,label,p:incomeCharacterPlan(input,key)})),by=Object.fromEntries(plans.map(x=>[x.key,x.p]));
    const tfsa=by.tfsa.afterTax,m=(input.icFedRate+input.icProvRate)/100;
    const returns=[3,4,5,6,7,8];
    return {metrics:[['After-tax value · interest-paying fund',by.interest.afterTax,'money'],['After-tax value · Canadian dividend fund',by.dividend.afterTax,'money'],['After-tax value · high-turnover fund',by.turnover.afterTax,'money'],['After-tax value · low-turnover fund, sold at the end',by.deferred.afterTax,'money'],['Value · any of these funds in a TFSA',tfsa,'money'],['Tax rate on an extra dollar of eligible dividends',t.dividend,'percent']],
    note:`Each fund starts with ${money(input.icAmount)} and earns the same ${input.icReturn}% a year before tax; only the form in which the return arrives changes. The combined marginal rate is ${pct(m,2)} (${input.icFedRate}% federal plus ${input.icProvRate}% provincial or territorial). Interest is taxed at that rate, a realized capital gain at half of it, and an eligible dividend is grossed up by 38% and then reduced by the federal credit of 15.0198% and the entered provincial credit, both measured on the grossed-up amount. Income is taxed in the year paid and the after-tax cash is reinvested; unrealized growth is taxed only on the sale at the horizon. Returns are constant hypothetical inputs, not forecasts or the record of any fund, and this is not a personal tax calculation.`,
    charts:[
      {id:'income-character-rates',type:'signedbar',title:'Tax on CAD 100 received as each kind of investment income',unit:'money',rows:[{label:'Interest',value:100*t.interest},{label:'Eligible Canadian dividend',value:100*t.dividend},{label:'Realized capital gain',value:100*t.gain},{label:'Any income earned inside a TFSA',value:0}],note:`At the entered rates, CAD 100 of interest costs CAD ${cents(100*t.interest)} in tax, CAD 100 of eligible dividends ${t.dividend<0?'reduces tax on other income by CAD '+cents(-100*t.dividend):'costs CAD '+cents(100*t.dividend)}, and a CAD 100 capital gain costs CAD ${cents(100*t.gain)}. The dividend figure follows the CRA mechanics: CAD 138 of taxable income, less a federal credit of CAD ${(138*federalEligibleCredit).toFixed(2)} and a provincial credit of CAD ${(1.38*input.icProvDtc).toFixed(2)}.`},
      {id:'income-character-paths',type:'line',title:'Same pre-tax return, different after-tax growth',unit:'money',xLabel:'Year-end, after tax on a hypothetical sale at that date',series:plans.map(({label,p},k)=>({name:label,dash:k===4,rows:p.rows.map(r=>({x:r.x,value:r.afterTax}))})),note:`After ${input.icYears} years the gap between the interest fund (${money(by.interest.afterTax)}) and the TFSA (${money(tfsa)}) is ${money(tfsa-by.interest.afterTax)}. Yearly tax on income slows compounding; deferred growth keeps working until the sale.`},
      {id:'income-character-ending',type:'stackbar',title:'Where the TFSA-equivalent ending value goes in each non-registered fund',unit:'money',seriesNames:['Kept after all tax','Tax paid on yearly income','Tax due on the final sale','Growth lost because tax left the account early'],rows:plans.map(({label,p})=>({label,values:[p.afterTax,Math.max(0,p.paid),p.saleTax,Math.max(0,tfsa-p.afterTax-p.paid-p.saleTax)]})),note:`Each bar adds up to the TFSA ending value of ${money(tfsa)}${t.dividend<0?' (a negative dividend rate is shown as zero tax; the bar then exceeds the TFSA value by the credit applied against other income)':''}. The last slice is the compound growth the tax payments would have earned had they stayed invested. Tax rates use one combined marginal rate throughout, so a large income or sale that crosses into a higher bracket is not modeled.`},
      {id:'income-character-grid',type:'heatmap',title:'After-tax annual return by income type and pre-tax return',unit:'percent',columns:returns.map(r=>`Pre-tax ${r}%`),rows:plans.map(({key,label})=>({label,values:returns.map(r=>incomeCharacterPlan(input,key,{icReturn:r}).annual)})),note:`Each cell reruns the ${input.icYears}-year comparison at the entered tax rates and dividend yield, changing only the pre-tax return, and annualizes the after-tax ending value. When the pre-tax return is below the dividend yield, the dividend fund’s price falls; that loss is given no tax value on sale.`}
    ]};
  }
  if(kind==='crashSignal'){
    const p=crashSignalPlan(input),be=breakEvenHitRate(input),K=input.csWarnings,e=episodes(input);
    const hitRate=K?p.hits/K:0;
    const hits=Array.from({length:K+1},(_,n)=>{const q=crashSignalPlan(input,{csTrue:n});return {x:n,value:q.timer-q.inv};});
    const crashes=[15,25,35,45],outs=[1,2,3,4];
    const label=d=>d.kind==='hit'?`Warning in year ${d.startYear} · crash followed`:d.kind==='falseAlarm'?`Warning in year ${d.startYear} · false alarm`:`Year ${d.startYear} · crash with no warning`;
    return {metrics:[['Ending value · stayed invested',p.inv,'money'],['Ending value · acted on every warning',p.timer,'money'],['Acting on warnings minus staying invested',p.timer-p.inv,'money'],['Share of warnings followed by a crash',hitRate,'percent'],['Break-even share of warnings that must be right',be??NaN,'percent'],['Years spent in cash',p.cashYears,'integer']].filter(m=>Number.isFinite(m[1])),
    note:`An existing ${money(input.csCapital)} balance is followed over ${p.horizon} years${p.extended?` (extended from ${input.csYears} so every episode fits)`:''}. Ordinary years return ${input.csNormal}%. A crash year falls ${input.csCrash}% and the next year gains ${input.csRebound}%. After each of the ${K} warnings the second investor holds cash earning ${input.csCash}% for ${input.csOut} year${input.csOut===1?'':'s'}, then rejoins the market; ${p.hits} warning${p.hits===1?' is':'s are'} followed by a crash and ${p.falseAlarms} ${p.falseAlarms===1?'is a false alarm':'are false alarms'}. ${p.missed} crash${p.missed===1?' arrives':'es arrive'} with no warning and ${p.missed===1?'affects':'affect'} both investors. No tax, trading cost, spread or fund fee is modeled. Every return is a hypothetical input; nobody knows in advance which warnings will be right.`,
    charts:[
      {id:'crash-signal-path',type:'line',title:'Staying invested versus acting on every crash warning',unit:'money',xLabel:'Year-end',series:[{name:'Stayed invested',rows:p.invRows},{name:'Moved to cash after each warning',dash:true,rows:p.timerRows}],note:`The order of episodes is arranged for display only; the ending values (${money(p.inv)} invested, ${money(p.timer)} acting on warnings) are the same in any order because growth multiplies across years.`},
      {id:'crash-signal-episodes',type:'signedbar',title:'What each warning did, relative to staying invested',unit:'percent',rows:p.detail.length?p.detail.map(d=>({label:label(d),value:d.relative})):[{label:'No warnings or crashes',value:0}],note:`A warning followed by a crash leaves the cash holder ${pct(e.hit.timer/e.hit.inv-1)} ahead over that episode${input.csOut<2?' (the rebound after the investor returns is shared)':''}; a false alarm leaves them ${pct(Math.abs(e.falseAlarm.timer/e.falseAlarm.inv-1))} ${e.falseAlarm.timer<e.falseAlarm.inv?'behind':'ahead'}. An unwarned crash affects both investors the same way.`},
      {id:'crash-signal-hits',type:'line',title:'Ending difference by how many warnings turn out right',unit:'money',xLabel:`Warnings followed by a crash, out of ${K}`,series:[{name:'Acting on warnings minus staying invested',rows:hits}],note:be==null?'With these inputs a correct warning does not beat staying invested, so no hit rate breaks even.':`The line crosses zero at about ${pct(be,0)} of warnings being right. That share is a property of the signal, which is not known in advance and can change over time.`},
      {id:'crash-signal-breakeven',type:'heatmap',title:'Share of warnings that must be right just to break even',unit:'percent',unavailableLabel:'Not reachable',columns:outs.map(w=>`${w} year${w===1?'':'s'} in cash`),rows:crashes.map(c=>({label:`Crash year −${c}%`,values:outs.map(w=>breakEvenHitRate(input,{csCrash:c,csOut:w}))})),note:`Each cell keeps the entered ${input.csRebound}% rebound, ${input.csNormal}% ordinary return and ${input.csCash}% cash rate and changes only the crash size and time out. Higher cells demand a more accurate signal. "Not reachable" means even a correct warning leaves the cash holder behind.`}
    ]};
  }
  throw Error('Unknown character-signal topic');
}
