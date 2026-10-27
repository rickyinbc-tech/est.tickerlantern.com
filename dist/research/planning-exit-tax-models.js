import { cpiYearSums } from './planning-fee-real-models.js';

export const exitTaxDefinitions={
  exitTaxCrash:{title:'Selling a taxable fund before a feared crash: how far must it fall to pay for the tax and the wait?',fields:[
    ['etxValue','Fund value today (CAD)',100000,1000,5000000,1000],
    ['etxCost','Adjusted cost base of those units (CAD)',60000,0,5000000,1000],
    ['etxMarg','Marginal tax rate on ordinary income (%)',40,0,55,1],
    ['etxCash','Interest on the cash while waiting (% a year)',2.4,0,8,.1],
    ['etxWait','Months in cash before buying back',12,1,60,1],
    ['etxBack','Fund value at buy-back compared with the sale (% change)',-20,-60,40,1],
    ['etxReturn','Fund return a year after the buy-back (%)',5,-2,12,.25],
    ['etxYears','Years from the sale until you would sell anyway',10,1,40,1]
  ]}
};
export const exitTaxWholeKeys=['etxWait','etxYears'];

// Bank of Canada Valet series V122531, 3-month Government of Canada treasury bill yield (Statistics Canada table
// 10-10-0122-01), sum of the twelve monthly values in each calendar year, retrieved 27 October 2026. Dividing by 12
// gives the annual-average yield in percent.
export const tbillYearSums={2006:48.51,2007:49.49,2008:27.59,2009:3.84,2010:6.97,2011:10.93,2012:11.37,2013:11.61,2014:10.98,2015:6.19,2016:5.98,2017:8.43,2018:16.74,2019:19.91,2020:5.13,2021:1.46,2022:27.64,2023:57.15,2024:51.93,2025:30.63};
export const tbillSeptember2026=2.39;

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(v,d=1)=>`${(v*100).toFixed(d)}%`;

// Average treasury bill yield, CPI inflation (annual averages) and the real return on that yield after tax at rate m.
export function cashRows(m){
  const rows=[];
  for(let y=2006;y<=2025;y++){
    const yld=tbillYearSums[y]/1200,infl=cpiYearSums[y]/cpiYearSums[y-1]-1;
    rows.push({x:y,yield:yld,inflation:infl,realAfterTax:(1+yld*(1-m))/(1+infl)-1});
  }
  return rows;
}

// After-tax value if everything is sold: value less tax on any gain (half of the gain included at the marginal rate).
// A loss is not credited, because whether it saves tax depends on other gains.
const liquid=(value,cost,c)=>value-Math.max(0,value-cost)*c;

// Exit: sell now, pay tax on the gain, hold cash for w months earning interest taxed each year at the marginal rate
// (TFSA: no tax), buy back at a fund value p times the sale value, then grow at r until year H. Stay: hold the same
// units throughout; their value is p at the buy-back date and then grows at r. Both are compared after the tax that
// selling everything at year H would trigger. Because the exit buys C/p units at p, its year-H value does not depend
// on p; the stay value rises in proportion to p.
export function exitCase(input,{tfsa=false,back=input.etxBack,years=input.etxYears,cost=input.etxCost}={}){
  const V=input.etxValue,m=tfsa?0:input.etxMarg/100,c=m/2,w=input.etxWait/12,H=Math.max(years,w);
  const tax=tfsa?0:Math.max(0,V-cost)*c,cash=V-tax,interestRate=input.etxCash/100*(1-m);
  const atBuy=cash*(1+interestRate)**w,interest=atBuy-cash,p=1+back/100,G=(1+input.etxReturn/100)**(H-w);
  const stayValue=V*p*G,exitValue=atBuy*G;
  const stay=tfsa?stayValue:liquid(stayValue,cost,c),exit=tfsa?exitValue:liquid(exitValue,atBuy,c);
  // Buy-back level at which the two are equal after tax at year H (stay is increasing in p, linear in each piece).
  let even;
  if(tfsa)even=atBuy/V;
  else{const pGain=(exit-cost*c)/(V*G*(1-c));even=V*pGain*G>=cost?pGain:exit/(V*G);}
  return {tax,cash,interest,atBuy,stay,exit,diff:exit-stay,even,fallNeeded:1-even,sameUnits:1-atBuy/V,H};
}

export function exitTaxResult(kind,input){
  if(kind!=='exitTaxCrash')throw Error('Unknown exit tax topic');
  const m=input.etxMarg/100,nr=exitCase(input),tf=exitCase(input,{tfsa:true});
  const rows=cashRows(m),last=rows.at(-1),neg=rows.filter(r=>r.realAfterTax<0).length;
  const yrs=`${nr.H} year${nr.H===1?'':'s'}`,mo=`${input.etxWait} month${input.etxWait===1?'':'s'}`;
  const gainShare=input.etxValue>0?Math.max(0,1-input.etxCost/input.etxValue):0;
  const backs=[];for(let b=-50;b<=30;b+=5)backs.push(b);
  const shares=[0,20,40,60,80],spans=[2,5,10,20,30];
  const level=e=>Math.abs(e-1)<5e-4?'level with the sale':e<1?`${pct(1-e)} below the sale`:`${pct(e-1)} above the sale`;
  const fallText=v=>v>=0?`fall at least ${pct(v)}`:`be no more than ${pct(-v)} higher`;
  const grid=shares.map(s=>({label:`${s}% of value is gain`,values:[...spans.map(h=>exitCase(input,{cost:input.etxValue*(1-s/100),years:h}).fallNeeded),exitCase(input,{cost:input.etxValue*(1-s/100)}).sameUnits]}));
  return {metrics:[
    ['Tax due on the sale',nr.tax,'money'],
    [`Cash available to buy back after ${mo}`,nr.atBuy,'money'],
    ['Fall needed to buy back the same units',nr.sameUnits,'percent'],
    [`Fall needed to come out ahead after tax by year ${nr.H}`,nr.fallNeeded,'percent'],
    [`Selling minus staying after tax by year ${nr.H}, at a ${input.etxBack}% buy-back level`,nr.diff,'money'],
    ['Fall needed in a TFSA, where the sale is not taxed',tf.fallNeeded,'percent']
  ],
  note:`Selling ${money(input.etxValue)} of fund units with a cost base of ${money(input.etxCost)} realizes a gain of ${money(Math.max(0,input.etxValue-input.etxCost))}; half is taxed at ${input.etxMarg}%, so ${money(nr.tax)} is due. After ${mo} in cash at ${input.etxCash}% the money available to buy back is ${money(nr.atBuy)}. To own the same units again the fund must ${fallText(nr.sameUnits)}; to be ahead after tax by year ${nr.H}, when both positions are sold, it must ${fallText(nr.fallNeeded)}. In a TFSA, with no tax on the sale, it must ${fallText(tf.fallNeeded)}. The buy-back level and returns are hypothetical; nobody knows in advance whether or when a fall will come.`,
  charts:[
    {id:'exit-tax-cash',type:'line',evidence:'Official statistics',title:'What cash earned while waiting: treasury bill yield, inflation and the real return after tax, 2006 to 2025',unit:'percent',xLabel:'Calendar year',series:[{name:'3-month treasury bill yield (yearly average)',rows:rows.map(r=>({x:r.x,value:r.yield}))},{name:'CPI inflation (annual average)',dash:true,rows:rows.map(r=>({x:r.x,value:r.inflation}))},{name:`Real return after tax at ${input.etxMarg}%`,rows:rows.map(r=>({x:r.x,value:r.realAfterTax}))}],source:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1010012201',sourceLabel:'Statistics Canada · Financial market statistics, Bank of Canada (table 10-10-0122-01); CPI table 18-10-0004-01',note:`Treasury bill yields are yearly averages of the Bank of Canada’s monthly 3-month series; inflation compares annual-average all-items CPI. Interest is taxed as ordinary income outside registered accounts, so the third line applies the ${input.etxMarg}% rate before removing inflation. On that basis cash lost purchasing power in ${neg} of the 20 years; in 2025 the yield averaged ${pct(last.yield,2)} and the real return after tax was ${pct(last.realAfterTax,2)}. The yield was ${tbillSeptember2026}% in September 2026. These are dated observations, not a forecast of future rates.`},
    {id:'exit-tax-waterfall',type:'waterfall',title:`From ${money(input.etxValue)} of fund units to the cash available to buy back`,unit:'money',rows:[{label:'Fund value at the sale',value:input.etxValue},{label:'Capital gains tax on the sale',value:-nr.tax},{label:`Interest after tax over ${mo}`,value:nr.interest}],totalLabel:'Cash available to buy back',note:`${pct(gainShare)} of the value is unrealized gain, and selling turns ${pct(nr.tax/input.etxValue,2)} of the holding into tax payable for the year of the sale. Interest earned while waiting is taxed too. To buy back as many units as you sold, the fund must therefore be at least ${pct(Math.max(0,nr.sameUnits),2)} lower on the day you buy${nr.sameUnits<0?' (here the interest more than covers the tax, so a slightly higher price still works)':''}.`},
    {id:'exit-tax-line',type:'line',title:`Selling minus staying, after tax by year ${nr.H}, by where the fund is at buy-back`,unit:'money',xLabel:'Fund value at buy-back compared with the sale (%)',xMin:-50,xTicks:[-50,-30,-10,10,30].map(v=>({value:v,label:`${v>0?'+':''}${v}%`})),series:[{name:'Non-registered account',rows:backs.map(b=>({x:b,value:exitCase(input,{back:b}).diff}))},{name:'TFSA (no tax on the sale)',dash:true,rows:backs.map(b=>({x:b,value:exitCase(input,{tfsa:true,back:b}).diff}))}],note:`Above zero, selling and buying back left you with more after tax by year ${nr.H}; below zero, staying did. The non-registered line crosses zero when the fund is ${level(nr.even)} at buy-back, the TFSA line when it is ${level(tf.even)}. If the fund is higher when you buy back, the exit loses on both counts: fewer units and tax paid early. The gap between the lines is the tax effect alone.`},
    {id:'exit-tax-grid',type:'heatmap',signed:true,title:'Fall needed before buying back for the sale to pay off, by gain and by how long you would otherwise have held',unit:'percent',rowLabel:'Unrealized gain',columns:[...spans.map(h=>`Sell anyway in ${h} years`),'Never sell (same units)'],rows:grid,note:`Each cell keeps the other inputs and changes the share of the value that is gain and the year when both positions would be sold. If you would sell soon anyway, the tax is mostly due regardless, so little or no fall is needed. The longer you would otherwise have held, the closer the answer comes to the last column: the fall needed simply to buy back the same units. Negative cells mean a slightly higher buy-back price still breaks even, because cash interest covers the difference.`}
  ]};
}
