// Client-facing fund cost explanations: fund series fees and switching in a non-registered account.
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
const pct=n=>Math.round((n+Number.EPSILON)*1e4)/1e4;

export const clientFundCostDefinitions={
 fundSeriesCost:{title:'Compare an advice-included series with a fee-based series plus an advice fee',fields:[
  ['fscAmount','Amount invested (CAD)',100000,1000,5000000,1000],
  ['fscYears','Years invested',20,1,40,1],
  ['fscReturn','Return before any fees (% per year)',6,-5,15,0.1],
  ['fscMerA','Advice-included series MER (%)',1.95,0,4,0.01],
  ['fscMerF','Fee-based series MER (%)',0.85,0,4,0.01],
  ['fscAdvice','Separate advice fee (% of assets per year)',1,0,3,0.05],
  ['fscSalesTax','Sales tax charged on the advice fee (%)',13,0,15,0.5]
 ]},
 fundSwitchTax:{title:'Weigh the tax on switching funds now against a lower fee later',inputIssue:i=>i.fstNewMer>i.fstOldMer?{message:'This guide compares a switch to a cheaper fund; the new fee should not exceed the current fee.',fields:['fstNewMer']}:null,fields:[
  ['fstValue','Current market value (CAD)',100000,1000,5000000,1000],
  ['fstAcb','Adjusted cost base (CAD)',70000,0,5000000,1000],
  ['fstTaxRate','Your marginal tax rate (%)',40,0,60,0.5],
  ['fstInclusion','Share of a capital gain that is taxable (%)',50,0,100,1],
  ['fstOldMer','Current fund MER (%)',2.2,0,4,0.01],
  ['fstNewMer','New fund MER (%)',1.2,0,4,0.01],
  ['fstReturn','Return before fees for both funds (% per year)',6,-5,15,0.1],
  ['fstYears','Years until you would sell anyway',15,1,40,1]
 ]}
};
export const clientFundCostWholeKeys=['fscYears','fstYears'];

export function seriesPaths(i,advice=i.fscAdvice){
 let a=i.fscAmount,f=i.fscAmount,feeA=0,feeF=0;const rowsA=[{x:0,value:a}],rowsF=[{x:0,value:f}],costA=[{x:0,value:0}],costF=[{x:0,value:0}];
 for(let t=1;t<=i.fscYears;t++){
  // MER is taken inside the fund; the advice fee is billed on the year-end value and paid from the account.
  const mA=a*i.fscMerA/100,mF=f*i.fscMerF/100;
  a=a*(1+i.fscReturn/100)-mA;f=f*(1+i.fscReturn/100)-mF;
  const adv=f*advice/100*(1+i.fscSalesTax/100);f-=adv;
  feeA+=mA;feeF+=mF+adv;
  rowsA.push({x:t,value:money(a)});rowsF.push({x:t,value:money(f)});costA.push({x:t,value:money(feeA)});costF.push({x:t,value:money(feeF)});
 }
 return {a,f,feeA,feeF,rowsA,rowsF,costA,costF};
}
export function breakevenAdvice(i){
 let lo=0,hi=5;
 for(let k=0;k<80;k++){const mid=(lo+hi)/2,p=seriesPaths(i,mid);if(p.f>p.a)lo=mid;else hi=mid;}
 return (lo+hi)/2;
}
function fundSeriesCost(i){
 const p=seriesPaths(i),even=breakevenAdvice(i),allA=i.fscMerA/100,allF=i.fscMerF/100+i.fscAdvice/100*(1+i.fscSalesTax/100);
 const fees=[0.5,0.75,1,1.25,1.5];
 return {metrics:[
  ['Advice-included series · value at the end',money(p.a),'money'],
  ['Fee-based series + advice fee · value at the end',money(p.f),'money'],
  ['Difference (fee-based minus advice-included)',money(p.f-p.a),'money'],
  ['Yearly all-in cost · advice-included vs fee-based',null,'number',`${(allA*100).toFixed(2)}% vs ${(allF*100).toFixed(2)}%`],
  ['Advice fee (before sales tax) at which both end equal',pct(even/100),'percent']
 ],note:'Original illustration. Both routes earn the same return before fees. The MER is deducted inside the fund each year (it already includes GST/HST on the fund\'s fees); the separate advice fee is charged on the year-end value, sales tax is added, and the total is paid from the account. Fee deductibility for non-registered accounts, distributions, taxes on growth and trading costs are not modelled. Fees and services vary by firm and series; check the Fund Facts and your fee agreement.',charts:[
  {id:'fund-series-value',type:'line',unit:'money',title:'Account value under each way of paying for advice',xLabel:'Years invested',series:[{name:'Advice-included series (MER only)',rows:p.rowsA},{name:'Fee-based series + advice fee',rows:p.rowsF,dash:true}],note:'Same investment and the same return before fees; only the cost route differs.'},
  {id:'fund-series-cumulative-cost',type:'line',unit:'money',title:'Total cost paid over time',xLabel:'Years invested',series:[{name:'Advice-included series',rows:p.costA},{name:'Fee-based series + advice fee incl. tax',rows:p.costF,dash:true}],note:'Dollars of MER and advice fees, without counting the growth those dollars would have earned.'},
  {id:'fund-series-all-in-rate',type:'bar',unit:'percent',title:'Yearly all-in cost as a share of the account',rowLabel:'Cost route',rows:[{label:'Advice-included MER',value:pct(allA)},{label:'Fee-based MER',value:pct(i.fscMerF/100)},{label:'Advice fee incl. sales tax',value:pct(i.fscAdvice/100*(1+i.fscSalesTax/100))},{label:'Fee-based total',value:pct(allF)}],note:'The advice-included MER already contains the trailing commission paid to the dealer; the fee-based series does not, so advice is billed separately.'},
  {id:'fund-series-fee-scenarios',type:'bar',unit:'money',title:`Ending difference by advice fee level (after ${i.fscYears} years)`,rowLabel:'Advice fee before sales tax',rows:fees.map(f=>{const s=seriesPaths(i,f);return {label:`${f.toFixed(2)}%`,value:money(s.f-s.a)};}),note:'Positive bars favour the fee-based route; negative bars favour the advice-included series.'}
 ]};
}

export function afterTaxValues(i,years){
 const g=i.fstReturn/100,tax=gain=>Math.max(0,gain)*i.fstInclusion/100*i.fstTaxRate/100;
 const taxNow=tax(i.fstValue-i.fstAcb),start=i.fstValue-taxNow;
 const keep=i.fstValue*(1+g-i.fstOldMer/100)**years,swap=start*(1+g-i.fstNewMer/100)**years;
 return {taxNow,keep:keep-tax(keep-i.fstAcb),swap:swap-tax(swap-start),keepTax:tax(keep-i.fstAcb),swapTax:tax(swap-start)+taxNow};
}
export function switchBreakeven(i){
 for(let y=1;y<=60;y++){const v=afterTaxValues(i,y);if(v.swap>=v.keep-0.005)return y;}
 return null;
}
function fundSwitchTax(i){
 const end=afterTaxValues(i,i.fstYears),even=switchBreakeven(i),span=Math.max(i.fstYears,Math.min(60,(even??30)+5));
 const rows=Array.from({length:span+1},(_,y)=>({y,v:afterTaxValues(i,y)}));
 const gaps=[0.1,0.25,0.5,0.75,1];
 return {metrics:[
  ['Tax triggered by switching now',money(end.taxNow),'money'],
  [`Keep · after-tax value if sold in year ${i.fstYears}`,money(end.keep),'money'],
  [`Switch · after-tax value if sold in year ${i.fstYears}`,money(end.swap),'money'],
  ['Switching advantage at that point',money(end.swap-end.keep),'money'],
  ['First year in which switching comes out ahead',even,'number',even==null?'Not within 60 years':`Year ${even}`]
 ],note:'Original illustration for a non-registered account. Switching is treated as a sale: the taxable part of the gain is taxed now and paid from the proceeds, and the rest is invested in the cheaper fund with a new cost base. Both funds earn the same return before fees and are sold at the end, when remaining gains are taxed at the same rate. Annual fund distributions, losses, deferred sales charges, foreign tax and changes in your tax rate are not modelled. Registered accounts (RRSP, TFSA, RRIF) have no capital gains tax on a switch. Confirm with a tax professional whether a particular switch is a disposition.',charts:[
  {id:'fund-switch-after-tax-value',type:'line',unit:'money',title:'After-tax value if you sold everything in each year',xLabel:'Years from today',series:[{name:'Keep the current fund',rows:rows.map(r=>({x:r.y,value:money(r.v.keep)}))},{name:'Switch now to the cheaper fund',rows:rows.map(r=>({x:r.y,value:money(r.v.swap)})),dash:true}],note:even==null?'In this scenario switching does not catch up within 60 years.':`The lines cross in year ${even}: before that, the tax paid today outweighs the fee saving.`},
  {id:'fund-switch-advantage',type:'line',unit:'money',title:'Switching advantage (switch minus keep), after all taxes',xLabel:'Years from today',series:[{name:'Switch minus keep',rows:rows.map(r=>({x:r.y,value:money(r.v.swap-r.v.keep)}))}],note:'Below zero, keeping is better; above zero, switching is better.'},
  {id:'fund-switch-tax-timing',type:'groupbar',unit:'money',title:`Capital gains tax paid by year ${i.fstYears}`,seriesNames:['Paid now','Paid when sold'],rowLabel:'Choice',rows:[{label:'Keep the current fund',values:[0,money(end.keepTax)]},{label:'Switch now',values:[money(end.taxNow),money(end.swapTax-end.taxNow)]}],note:'Switching brings part of the tax forward; keeping defers all of it until the sale.'},
  {id:'fund-switch-breakeven-by-gap',type:'bar',unit:'decimal',title:'Years to break even by fee saving',unitLabel:'Years from today',rowLabel:'MER saving per year',rows:gaps.map(gap=>{const y=switchBreakeven({...i,fstNewMer:Math.max(0,i.fstOldMer-gap)});return {label:`${gap.toFixed(2)} pp lower`,value:y??60};}),note:'Same gain, tax rate and return; only the fee difference changes. 60 means no break-even within 60 years.'}
 ]};
}

export function clientFundCostResult(kind,i){
 if(kind==='fundSeriesCost')return fundSeriesCost(i);
 if(kind==='fundSwitchTax')return fundSwitchTax(i);
 throw Error('Unknown fund cost illustration.');
}
