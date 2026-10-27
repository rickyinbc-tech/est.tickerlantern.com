export const feeRealDefinitions={
  feeRealReturn:{title:'Measure a fund fee against the return left after inflation, not the return before it',fields:[
    ['frrStart','Amount already invested at the start (CAD)',10000,0,2000000,1000],
    ['frrMonthly','Amount invested from each month’s pay (CAD)',500,0,20000,50],
    ['frrIndex','Raise the monthly amount with inflation each year (1 = yes, 0 = no)',1,0,1,1],
    ['frrGross','Fund return before fees (% a year)',6,-2,12,.25],
    ['frrInfl','Inflation (% a year)',2.5,0,10,.1],
    ['frrFeeA','First fee to compare (% of assets a year)',0.5,0,4,.05],
    ['frrFeeB','Second fee to compare (% of assets a year)',2,0,4,.05],
    ['frrYears','Years invested',25,1,50,1]
  ]}
};
export const feeRealWholeKeys=['frrIndex','frrYears'];

// Statistics Canada, Consumer Price Index, all-items, Canada (table 18-10-0004-01, vector v41690973), 2002=100.
// Sum of the twelve published monthly values for each calendar year, retrieved through the Bank of Canada Valet
// API on 27 October 2026. Dividing by 12 gives the annual average used for yearly inflation.
export const cpiYearSums={1995:1050.6,1996:1067.1,1997:1084.4,1998:1095.2,1999:1114.2,2000:1144.5,2001:1173.4,2002:1199.9,2003:1233.0,2004:1255.9,2005:1283.7,2006:1309.4,2007:1337.4,2008:1369.1,2009:1373.2,2010:1397.6,2011:1438.3,2012:1460.1,2013:1473.8,2014:1501.9,2015:1518.8,2016:1540.5,2017:1565.1,2018:1600.6,2019:1631.8,2020:1643.5,2021:1699.3,2022:1814.9,2023:1885.3,2024:1930.2,2025:1970.2};
export const cpiSeptember={2025:164.9,2026:170.0};

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(v,d=2)=>`${(v*100).toFixed(d)}%`;

// Yearly inflation from annual-average CPI, and the compound average over the ten years ending in each year.
export function cpiRows(){
  const rows=[];
  for(let y=1996;y<=2025;y++){
    const r={x:y,inflation:cpiYearSums[y]/cpiYearSums[y-1]-1};
    if(y>=2005)r.tenYear=(cpiYearSums[y]/cpiYearSums[y-10])**.1-1;
    rows.push(r);
  }
  return rows;
}

// Annual rates. The fee is a fraction of assets taken from the grown balance, so the yearly growth factor after
// fees is (1+g)(1-f), the same convention as the long-term fee guide. Real rates divide by (1+i).
export function feeRates(g,i,f){
  const net=(1+g)*(1-f)-1,realBefore=(1+g)/(1+i)-1,realAfter=(1+net)/(1+i)-1;
  return {net,realBefore,realAfter,feePoints:g-net,inflationPoints:net-realAfter,
    nominalShare:g>0?(g-net)/g:null,realShare:realBefore>0?(realBefore-realAfter)/realBefore:null};
}

// Monthly path. Each month the balance earns the monthly equivalent of the gross return, the monthly equivalent of
// the fee is deducted from the grown balance, and the month's saving arrives at month-end. When indexing is on,
// the monthly saving rises by the inflation rate at the start of each year. Real values divide by cumulative
// inflation to that month, so they are in the purchasing power of the starting date.
export function feePath(input,feePct){
  const g=input.frrGross/100,i=input.frrInfl/100,f=feePct/100,n=input.frrYears;
  const gm=(1+g)**(1/12),fm=(1-f)**(1/12),im=(1+i)**(1/12);
  let bal=input.frrStart,defl=1,paid=input.frrStart,fees=0,feesReal=0;
  const rows=[{x:0,real:bal,paid}];
  for(let y=0;y<n;y++){
    const save=input.frrMonthly*(input.frrIndex?(1+i)**y:1);
    for(let m=0;m<12;m++){
      const grown=bal*gm,fee=grown*(1-fm);
      bal=grown-fee+save;defl*=im;
      fees+=fee;feesReal+=fee/defl;paid+=save/defl;
    }
    rows.push({x:y+1,real:bal/defl,paid});
  }
  return {rows,nominal:bal,real:bal/defl,paid,fees,feesReal};
}

export function feeRealResult(kind,input){
  if(kind!=='feeRealReturn')throw Error('Unknown fee and real return topic');
  const g=input.frrGross/100,i=input.frrInfl/100,n=input.frrYears;
  const a=feeRates(g,i,input.frrFeeA/100),b=feeRates(g,i,input.frrFeeB/100);
  const none=feePath(input,0),pa=feePath(input,input.frrFeeA),pb=feePath(input,input.frrFeeB);
  const cpi=cpiRows(),last=cpi.at(-1),ten=last.tenYear,twenty=(cpiYearSums[2025]/cpiYearSums[2005])**.05-1,sept=cpiSeptember[2026]/cpiSeptember[2025]-1;
  const peak=cpi.reduce((p,r)=>r.inflation>p.inflation?r:p),low=cpi.reduce((p,r)=>r.inflation<p.inflation?r:p);
  const shareText=b.realShare==null?`Before fees, a ${input.frrGross}% return does not beat ${input.frrInfl}% inflation, so there is no real return for the fee to take a share of; every fee simply deepens the loss of purchasing power.`:`The ${input.frrFeeB}% fee takes ${pct(b.nominalShare??0,1)} of the ${input.frrGross}% return before fees, but ${pct(b.realShare,1)} of the ${pct(b.realBefore)} that was left after inflation.`;
  const infls=[1,2,3,4,5],fees=[0,.5,1,1.5,2,2.5],yrs=`${n} year${n===1?'':'s'}`;
  return {metrics:[
    ['Real return a year before fees',b.realBefore,'percent'],
    [`Real return a year after a ${input.frrFeeA}% fee`,a.realAfter,'percent'],
    [`Real return a year after a ${input.frrFeeB}% fee`,b.realAfter,'percent'],
    [`Share of the real return taken by the ${input.frrFeeB}% fee`,b.realShare,'percent'],
    [`Value after ${yrs} in today’s dollars · ${input.frrFeeA}% fee`,pa.real,'money'],
    [`Value after ${yrs} in today’s dollars · ${input.frrFeeB}% fee`,pb.real,'money']
  ],
  note:`A fund earning ${input.frrGross}% before fees with ${input.frrInfl}% inflation. ${shareText} The plan starts with ${money(input.frrStart)} and adds ${money(input.frrMonthly)} a month${input.frrIndex?', raised with inflation each year':''} for ${yrs}. In today’s dollars it ends at ${money(pa.real)} with the ${input.frrFeeA}% fee and ${money(pb.real)} with the ${input.frrFeeB}% fee; you put in the equivalent of ${money(pa.paid)}. Returns are smooth and hypothetical, before tax, and not a forecast of any fund.`,
  charts:[
    {id:'fee-real-cpi',type:'line',evidence:'Official statistics',title:'Canadian inflation each year, 1996 to 2025, and the ten-year average',unit:'percent',xLabel:'Calendar year',series:[{name:'Inflation in the year (annual-average CPI)',rows:cpi.map(r=>({x:r.x,value:r.inflation}))},{name:'Average over the ten years ending that year',dash:true,rows:cpi.filter(r=>r.tenYear!=null).map(r=>({x:r.x,value:r.tenYear}))}],source:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401',sourceLabel:'Statistics Canada · Consumer Price Index, monthly, not seasonally adjusted (table 18-10-0004-01)',note:`Yearly inflation compares the average of each year’s twelve monthly all-items CPI values with the year before. It ranged from ${pct(low.inflation,1)} in ${low.x} to ${pct(peak.inflation,1)} in ${peak.x}. Prices rose ${pct(ten)} a year on average over the ten years to 2025 and ${pct(twenty)} a year over the twenty years to 2025; in September 2026 the CPI was ${pct(sept,1)} above a year earlier. These are dated observations; future inflation is not known, which is why the calculator lets you choose it.`},
    {id:'fee-real-waterfall',type:'waterfall',title:`Where a ${input.frrGross}% return goes with a ${input.frrFeeB}% fee and ${input.frrInfl}% inflation`,unit:'percent',rows:[{label:'Return before fees',value:g},{label:`${input.frrFeeB}% fee`,value:-b.feePoints},{label:'Purchasing power lost to inflation',value:-b.inflationPoints}],totalLabel:'Real return left after fees',note:`The three steps add up exactly. The fee takes ${pct(b.feePoints)} of return a year, inflation ${pct(b.inflationPoints)}, leaving a real return of ${pct(b.realAfter)}. With the ${input.frrFeeA}% fee the fee step is ${pct(a.feePoints)} and the real return left is ${pct(a.realAfter)}. A fee is charged on the whole balance whatever inflation does, so the lower the real return, the larger the share of it the fee takes.`},
    {id:'fee-real-path',type:'line',title:`What the plan can buy in today’s dollars over ${yrs}`,unit:'money',xLabel:'Years invested',series:[{name:'No fee (reference only)',dash:true,rows:none.rows.map(r=>({x:r.x,value:r.real}))},{name:`${input.frrFeeA}% fee`,rows:pa.rows.map(r=>({x:r.x,value:r.real}))},{name:`${input.frrFeeB}% fee`,rows:pb.rows.map(r=>({x:r.x,value:r.real}))},{name:'Amount put in, in today’s dollars',dash:true,rows:pa.rows.map(r=>({x:r.x,value:r.paid}))}],note:`Every line divides by ${input.frrInfl}% a year of inflation, so the values are in the purchasing power of the start. ${Math.abs(pa.real-pb.real)<.5?`After ${yrs} the two fee lines end level.`:`After ${yrs} the ${pa.real>pb.real?input.frrFeeA:input.frrFeeB}% fee line ends ${money(Math.abs(pa.real-pb.real))} ahead in today’s money.`} Fees deducted over the period come to ${money(pa.feesReal)} at ${input.frrFeeA}% and ${money(pb.feesReal)} at ${input.frrFeeB}% in today’s dollars.${Math.abs(pa.real-pb.real)>Math.abs(pb.feesReal-pa.feesReal)?' The gap is larger than the difference in fees because the deducted amounts would also have grown.':''} The no-fee line is a reference, not an available product.`},
    {id:'fee-real-grid',type:'heatmap',signed:true,title:`Real return a year after fees, with a ${input.frrGross}% return before fees`,unit:'percent',rowLabel:'Inflation',columns:fees.map(f=>`${f}% fee`),rows:infls.map(x=>({label:`${x}% inflation`,values:fees.map(f=>{const v=feeRates(g,x/100,f/100).realAfter;return Math.abs(v)<5e-7?0:v;})})),note:`Each cell keeps the ${input.frrGross}% return before fees and changes only inflation and the fee. Moving one column right costs about the same in every row, but the rows with higher inflation start with less real return to lose, so the same fee takes a larger share of it. Negative cells mean the fund lost purchasing power after fees, even though its reported return stayed positive.`}
  ]};
}
