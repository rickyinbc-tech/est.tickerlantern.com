export const ladderRenewalDefinitions={
  ladderRenewal:{title:'Trace interest income while each rung renews at a different assumed rate',fields:[
    ['ladderCapital','Total principal divided into five equal rungs (CAD)',50000,0,1000000,5000],
    ['initialCoupon','Assumed initial annual cash-interest rate on every rung (%)',4,0,10,.5],
    ['renewalCoupon','Assumed rate on every five-year renewal (%)',2,0,10,.5],
    ['interestNeed','Annual cash spending assigned to interest receipts (CAD)',2000,0,50000,100],
    ['incomeReserve','Outside reserve available for gaps (CAD)',1000,0,200000,500]
  ]}
};

export function ladderRenewalPlan(input,{renewalCoupon=input.renewalCoupon,need=input.interestNeed}={}){
  const rung=input.ladderCapital/5,rows=[{x:0,income:0,reserve:input.incomeReserve,oldInterest:0,newInterest:0,principalRolled:0}];
  let cumulative=0,lowest=0,totalInterest=0,totalRolled=0;
  for(let year=1;year<=10;year++){
    // Rung k pays its original rate through maturity at the end of year k.
    // The same principal begins earning its renewal rate in year k+1.
    const originalRungs=Math.max(0,6-year),renewedRungs=5-originalRungs;
    const oldInterest=originalRungs*rung*input.initialCoupon/100,newInterest=renewedRungs*rung*renewalCoupon/100;
    const income=oldInterest+newInterest,flow=income-need;
    cumulative+=flow;lowest=Math.min(lowest,cumulative);totalInterest+=income;totalRolled+=rung;
    rows.push({x:year,income,oldInterest,newInterest,reserve:input.incomeReserve+cumulative,flow,principalRolled:rung});
  }
  return {rows,rung,required:-lowest,extra:Math.max(0,-lowest-input.incomeReserve),totalInterest,totalRolled,ending:rows.at(-1).reserve};
}

export function ladderRenewalResult(kind,input){
  if(kind!=='ladderRenewal')throw Error('Unknown ladder-renewal topic.');
  const p=ladderRenewalPlan(input);
  return {metrics:[['Annual interest in the first modeled year',p.rows[1].income,'money'],['Annual interest after all first renewals',p.rows[6].income,'money'],['Outside opening reserve required across ten years',p.required,'money']],
    note:'Hypothetical five-rung ladder with equal principal, initial maturities at the ends of years 1–5, and annual cash interest paid before that year’s spending. Every initial rung uses the same entered rate regardless of term. Each maturing principal is immediately reinvested for five years at the entered renewal rate, including subsequent renewals; neither quoted rates nor future availability are predicted. The old rate pays through its maturity year and the renewed rate begins the following year. All principal stays invested and nominal principal remains unchanged. Interest is paid outside the ladder rather than compounded. Outside cash earns zero; annual spending is fixed. No tax, inflation, default, deposit-insurance assessment, fees, early redemption or within-year cash timing is modeled. Negative outside cash is an unmet funding need, not a sale of principal or an automatic loan.',
    charts:[
      {id:'ladder-renewal-income',type:'line',title:'Staggered renewal changes the path of interest, not the future rate available',unit:'money',xLabel:'Year of interest receipt',xMin:1,series:[{name:'Annual cash interest',rows:p.rows.slice(1).map(r=>({x:r.x,value:r.income}))},{name:'Selected annual cash need',rows:p.rows.slice(1).map(r=>({x:r.x,value:input.interestNeed})),dash:true}],note:'Year 1 uses five original rates. Each later year contains one fewer original-rate rung until year 6, when all five earn the entered renewal rate. Thereafter subsequent renewals use that same assumption. The principal has not been spent to hold income up.'},
      {id:'ladder-renewal-interest-mix',type:'stackbar',title:'Separate interest still on the original terms from interest after renewal',unit:'money',seriesNames:['Interest from original terms','Interest from renewed terms'],rows:[1,3,5,6,10].map(year=>({label:'Year '+year,values:[p.rows[year].oldInterest,p.rows[year].newInterest]})),note:'Both segments are interest cash, not principal. Their sum equals that year’s income in the first chart. A rung renewed at the end of year 1 contributes renewed-rate interest in year 2; it does not retroactively change year 1.'},
      {id:'ladder-renewal-outside-reserve',type:'line',title:'An intact principal can sit beside a depleted spending reserve',unit:'money',xLabel:'Years after ladder setup',series:[{name:'Outside reserve / unmet need',rows:p.rows.map(r=>({x:r.x,value:r.reserve}))},{name:'Zero cash boundary',rows:[{x:0,value:0},{x:10,value:0}],dash:true}],note:'Each point follows annual interest receipt and the annual cash need. Required opening reserve uses the deepest cumulative gap across the ten-year schedule. It excludes the principal rolled at maturity, since that same money is committed to the next five-year term. No claim is made that a year-end funded path covers bills arriving earlier.'},
      {id:'ladder-renewal-funding-grid',type:'heatmap',title:'Required outside reserve under different renewal rates and annual cash needs',unit:'money',columns:[1500,2000,2500].map(need=>'$'+need.toLocaleString('en-CA')+'/yr'),rows:[1,2,3].map(renewalCoupon=>({label:renewalCoupon+'% new',values:[1500,2000,2500].map(need=>ladderRenewalPlan(input,{renewalCoupon,need}).required)})),note:'Rows replace the renewal rate; columns replace the annual cash need. Original principal and initial rates remain selected. Cells show the full required opening reserve rather than the extra amount above entered outside cash. These are rate scenarios, not forecasts, probabilities or offered GIC yields.'}
    ]};
}
