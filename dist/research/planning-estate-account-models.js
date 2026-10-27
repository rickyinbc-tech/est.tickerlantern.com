export const estateAccountDefinitions={
  estateAccount:{title:'The same fund at death in a TFSA, an RRSP or RRIF, and a taxable account: what heirs receive',fields:[
    ['esValue','Market value of the fund in each account today (CAD)',200000,1000,10000000,1000],
    ['esCost','Taxable account: adjusted cost base today as % of its value',70,0,100,1],
    ['esReturn','Total return of the fund before tax (% a year)',5,-5,12,.25],
    ['esDist','Taxable account: part of that return paid out each year and reinvested (% of value)',2,0,8,.1],
    ['esLifeRate','Tax rate on those distributions while alive (%)',30,0,55,1],
    ['esYears','Years until death',15,0,40,1],
    ['esFinalRate','Tax rate on income added to the final return (%)',45,0,55,1],
    ['esProbate','Probate or estate administration fee on assets passing through the estate (%)',1.5,0,3,.05],
    ['esNamed','Beneficiary named directly on the TFSA and RRSP or RRIF (1 = yes, 0 = no)',1,0,1,1],
    ['esSpouse','Heir is a spouse or common-law partner using the rollover (1 = yes, 0 = no)',0,0,1,1]
  ]}
};
export const estateAccountWholeKeys=['esYears','esNamed','esSpouse'];

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(v,d=1)=>`${(v*100).toFixed(d)}%`;

// Taxable account year by year: growth at the total return, distributions reinvested (raising the cost base),
// and the tax on them paid by redeeming units, grossed up for the half-taxed gain on the units redeemed.
export function taxablePath(input,years=input.esYears){
  const r=input.esReturn/100,d=input.esDist/100,hr=input.esLifeRate/100;
  let value=input.esValue,cost=input.esValue*input.esCost/100,taxPaid=0;
  const rows=[{year:0,value,cost,taxPaid}];
  for(let t=1;t<=years;t++){
    const dist=value*d;value*=1+r;cost+=dist;
    const tax=dist*hr;
    if(tax>0){const g=Math.max(0,1-cost/value),sale=tax/(1-g*hr/2);cost-=sale*cost/value;value-=sale;taxPaid+=sale;}
    rows.push({year:t,value,cost,taxPaid});
  }
  return rows;
}

// Amounts at death for each account. Probate applies to the taxable account (held in one name) and, when no
// beneficiary is named, to the registered accounts. With the spouse rollover the income tax is deferred, not removed.
export function estateAtDeath(input,years=input.esYears){
  const r=input.esReturn/100,fr=input.esFinalRate/100,pb=input.esProbate/100,named=input.esNamed===1,spouse=input.esSpouse===1;
  const grown=input.esValue*(1+r)**years,tp=taxablePath(input,years).at(-1),gain=tp.value-tp.cost;
  const make=(label,value,taxDue,throughEstate,lifeTax)=>{
    const tax=spouse?0:taxDue,deferred=spouse?taxDue:0,probate=throughEstate?value*pb:0;
    return {label,value,tax,deferred,probate,lifeTax,heirs:value-tax-probate};
  };
  return {
    tfsa:make('TFSA',grown,0,!named,0),
    rrif:make('RRSP or RRIF',grown,grown*fr,!named,0),
    taxable:make('Taxable account',tp.value,Math.max(0,gain)*fr/2,true,tp.taxPaid),
    gain,cost:tp.cost
  };
}

export function estateAccountResult(kind,input){
  if(kind!=='estateAccount')throw Error('Unknown estate account topic');
  const N=input.esYears,e=estateAtDeath(input),spouse=input.esSpouse===1,named=input.esNamed===1,accts=[e.tfsa,e.rrif,e.taxable];
  const yrs=`${N} year${N===1?'':'s'}`,heir=spouse?'a spouse':'a child or other heir';
  const line=Array.from({length:41},(_,t)=>{const x=estateAtDeath({...input,esSpouse:0},t);return {t,tf:x.tfsa.heirs,rr:x.rrif.heirs,tx:x.taxable.heirs};});
  const both=accts.map((a,k)=>{const o=estateAtDeath({...input,esSpouse:0})[['tfsa','rrif','taxable'][k]],s=estateAtDeath({...input,esSpouse:1})[['tfsa','rrif','taxable'][k]];return {label:a.label,values:[o.heirs,s.heirs]};});
  const rets=[3,4,5,6,7,8],spans=[5,10,20,30];
  const grid=rets.map(rv=>({label:`${rv}% a year`,values:spans.map(t=>{const x=estateAtDeath({...input,esReturn:rv},t);return x.tfsa.heirs>0?x.taxable.heirs/x.tfsa.heirs:null;})}));
  const def=spouse?'With the spouse rollover, no income tax is due at this death; it is deferred to the spouse.':`At a ${input.esFinalRate}% rate, the RRSP or RRIF loses ${money(e.rrif.tax)} to the final return and the taxable account ${money(e.taxable.tax)} on half of its ${money(Math.max(0,e.gain))} gain.`;
  return {metrics:[
    [`TFSA: received by ${heir} after ${yrs}`,e.tfsa.heirs,'money'],
    [`RRSP or RRIF: received by ${heir}`,e.rrif.heirs,'money'],
    [`Taxable account: received by ${heir}`,e.taxable.heirs,'money'],
    ['Income tax due on the final return, all three accounts',e.rrif.tax+e.taxable.tax,'money'],
    ['Income tax deferred to the spouse by the rollover',e.rrif.deferred+e.taxable.deferred,'money'],
    ['Probate or estate fee, all three accounts',accts.reduce((s,a)=>s+a.probate,0),'money'],
    ['Tax paid on taxable-account distributions while alive',e.taxable.lifeTax,'money'],
    ['Taxable account: unrealized gain at death',e.gain,'money']
  ],
  note:`Starting from ${money(input.esValue)} of the same fund in each account and ${input.esReturn}% a year, the TFSA and the RRSP or RRIF both reach ${money(e.tfsa.value)} after ${yrs}; the taxable account reaches ${money(e.taxable.value)} after ${money(e.taxable.lifeTax)} of tax on distributions along the way. ${def} ${named?'With beneficiaries named on the registered accounts, only the taxable account passes through the estate':'With no beneficiary named, all three accounts pass through the estate'}, at a ${input.esProbate}% fee. ${heir[0].toUpperCase()+heir.slice(1)} receives ${money(e.tfsa.heirs)}, ${money(e.rrif.heirs)} and ${money(e.taxable.heirs)}. The RRSP or RRIF figure is lower partly because its contributions were deducted when made: its balance was never after-tax money. Rates and rules are simplified; this is not tax or estate advice.`,
  charts:[
    {id:'estate-account-split',type:'stackbar',title:`Where each account’s value goes at death after ${yrs}`,unit:'money',rowLabel:'Account',seriesNames:['Received by the heir','Income tax on the final return','Probate or estate fee','Tax paid on distributions while alive'],rows:accts.map(a=>({label:a.label,values:[a.heirs,a.tax,a.probate,a.lifeTax]})),note:`Each bar adds what the heir receives, the tax on the final return, the probate fee and, for the taxable account, the tax already paid each year on reinvested distributions (taken from the fund by redeeming units). ${spouse?`Tax deferred to the spouse is counted as received: ${money(e.rrif.deferred+e.taxable.deferred)} will be taxed when the spouse withdraws, sells or dies.`:'The tax on the RRSP or RRIF is the whole value times the final-return rate; on the taxable account it is half the gain times that rate.'}`},
    {id:'estate-account-years',type:'line',title:'Received by a child or other heir, by the number of years until death',unit:'money',currency:'CAD',xLabel:'Years until death',xMin:0,series:[{name:'TFSA',rows:line.map(l=>({x:l.t,value:l.tf}))},{name:'RRSP or RRIF',rows:line.map(l=>({x:l.t,value:l.rr}))},{name:'Taxable account',rows:line.map(l=>({x:l.t,value:l.tx}))}],note:`The same fund and return in every account, with no withdrawals. The TFSA and the RRSP or RRIF grow alike; the gap between them is the final-return tax, which grows with the balance. The taxable account starts between them when its cost base is high and slides as the yearly tax on distributions and the untaxed gain build up. A real RRIF must pay out a minimum each year from the year after it is opened, taxed as it is paid; that is not modelled here.`},
    {id:'estate-account-spouse',type:'groupbar',title:`Received after ${yrs}: a child or other heir compared with a spouse using the rollover`,unit:'money',rowLabel:'Account',seriesNames:['Child or other heir','Spouse (tax deferred)'],rows:both,note:`A spouse or common-law partner can take over a TFSA as successor holder, and RRSP or RRIF property and capital property can roll over to them without tax at the first death (subject to conditions). The spouse’s figures are larger only because the tax has not yet been charged: it falls due when the spouse withdraws, sells or dies, at their rates then. A financially dependent child or grandchild can also receive some RRSP or RRIF rollovers; that is not modelled.`},
    {id:'estate-account-grid',type:'heatmap',title:'Taxable account received as a share of the TFSA received, by return and years until death',unit:'percent',rowLabel:'Fund total return',columns:spans.map(t=>`${t} years`),rows:grid,unavailableLabel:'Not defined',note:`Each cell repeats the taxable-account calculation with your cost base, distribution share, tax rates and probate setting, for a child or other heir. A higher return and a longer wait widen the gap, because more tax is paid along the way and more gain is taxed at death. An investment with low distributions and few realized gains narrows it; interest-paying funds widen it. A TFSA’s room is limited, which is why the comparison matters for money that cannot all fit.`}
  ]};
}
