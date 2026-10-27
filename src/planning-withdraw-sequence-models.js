export const withdrawSequenceDefinitions={
  withdrawSequence:{title:'Follow fixed monthly withdrawals from a balanced fund when a crash comes first, last or not at all',inputIssue:i=>i.wsqYears<4,fields:[
    ['wsqStart','Money set aside for withdrawals at the start, fund plus any cash reserve (CAD)',500000,10000,10000000,5000],
    ['wsqRate','First-year withdrawals as a share of that money (%)',4.5,.5,12,.1],
    ['wsqIndex','Yearly increase in the withdrawal to keep up with prices (%)',2,0,8,.1],
    ['wsqReturn','Fund return in ordinary years, after fees (%)',5,-2,12,.25],
    ['wsqDrop','Fall in the fund in the crash year (%)',25,0,60,1],
    ['wsqReserve','Years of first-year withdrawals held in a separate cash reserve',1,0,5,.5],
    ['wsqCash','Interest earned on the cash reserve (%)',3,0,8,.1],
    ['wsqYears','Years of withdrawals followed',30,4,45,1]
  ]}
};
export const withdrawSequenceWholeKeys=['wsqYears'];

// Statistics Canada, Consumer Price Index, all-items, Canada, not seasonally adjusted (table 18-10-0004-01,
// vector v41690973), September of each year, 2002=100. Retrieved through the Bank of Canada Valet API on 27 October 2026.
export const septemberCpi={2006:109.2,2007:111.9,2008:115.7,2009:114.7,2010:116.9,2011:120.6,2012:122.0,2013:123.3,2014:125.8,2015:127.1,2016:128.8,2017:130.8,2018:133.7,2019:136.2,2020:136.9,2021:142.9,2022:152.7,2023:158.5,2024:161.1,2025:164.9,2026:170.0};

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const monthly=a=>Math.pow(1+a,1/12)-1;

// Annual fund returns for each path. Ordinary years earn r. A crash year loses d and the next year earns
// (1+r)^2/(1-d)-1, so the two years together compound to exactly (1+r)^2. Every path therefore has the same
// set of yearly growth factors and, with no withdrawals, the same ending value; only the order differs.
export function returnPath(i,crashYear){
  const r=i.wsqReturn/100,d=i.wsqDrop/100,out=Array(i.wsqYears).fill(r);
  if(crashYear){out[crashYear-1]=-d;out[crashYear]=(1+r)**2/(1-d)-1;}
  return out;
}

// Monthly simulation. The fund starts at CAD 10 a unit. At the start of each month one twelfth of that year's
// withdrawal is paid, by selling units at the current price; the price then grows by the monthly equivalent of
// the year's return. The withdrawal rises by the indexation rate at the start of each year after the first.
// A cash reserve, if any, is set aside from the starting money and earns the cash rate. It pays the withdrawal
// only while the unit price is below its highest earlier month-start price (the fund is under water); it is not
// refilled. Once the money runs out the shortfall month is recorded and both balances stay at zero.
export function withdrawPlan(input,overrides={},crashYear=0){
  const i={...input,...overrides},n=i.wsqYears,path=returnPath(i,crashYear),first=i.wsqStart*i.wsqRate/100;
  const cashR=monthly(i.wsqCash/100);
  let cash=Math.min(i.wsqStart,i.wsqReserve*first),price=10,units=(i.wsqStart-cash)/price,peak=price,runOut=null;
  const months=[],years=[{x:0,fund:units*price,cash,total:units*price+cash}];
  for(let y=0;y<n;y++){
    const w=first*(1+i.wsqIndex/100)**y/12,g=monthly(path[y]);
    for(let m=0;m<12;m++){
      let need=w,sold=0;
      if(price<peak&&cash>0){const c=Math.min(cash,need);cash-=c;need-=c;}
      if(need>0){
        sold=Math.min(units,need/price);units-=sold;need-=sold*price;
        if(need>1e-9&&cash>0){const c=Math.min(cash,need);cash-=c;need-=c;}
        if(need>1e-9&&runOut===null)runOut=y*12+m+1;
      }
      peak=Math.max(peak,price);
      months.push({x:y*12+m+1,price,sold,withdrawal:w});
      price*=1+g;cash*=1+cashR;
    }
    years.push({x:y+1,fund:units*price,cash,total:units*price+cash,withdrawal:w*12});
  }
  const end=years.at(-1),paid=months.reduce((a,r)=>a+r.withdrawal,0);
  return {path,months,years,end,first,runOut,paid,unitsSoldFirst2:months.slice(0,24).reduce((a,r)=>a+r.sold,0)};
}

export function cpiIndexedRows(monthlyAmount){
  const base=septemberCpi[2006];
  return Object.entries(septemberCpi).map(([y,v])=>({x:Number(y),indexed:monthlyAmount*v/base,fixedReal:monthlyAmount*base/v}));
}

export function withdrawSequenceResult(kind,input){
  if(kind!=='withdrawSequence')throw Error('Unknown withdrawal-sequence topic');
  const n=input.wsqYears,late=n-1,cfg={wsqReserve:0};
  const none=withdrawPlan(input,cfg,0),early=withdrawPlan(input,cfg,1),last=withdrawPlan(input,cfg,late);
  const res=withdrawPlan(input,{},1),resNone=withdrawPlan(input,{},0);
  const mo=none.first/12,cpi=cpiIndexedRows(mo),c26=cpi.at(-1),reserves=[0,1,2,3];
  const recovery=returnPath(input,1)[1];
  const ranOut=p=>p.runOut?` The money runs out in month ${p.runOut} (year ${Math.ceil(p.runOut/12)}).`:'';
  return {metrics:[
    ['First-year withdrawals, paid monthly',none.first,'money'],
    [`Value after ${n} years · no crash`,none.end.total,'money'],
    [`Value after ${n} years · crash in year 1`,early.end.total,'money'],
    [`Value after ${n} years · crash in year ${late}`,last.end.total,'money'],
    ['Extra fund units sold in the first two years because the crash came first',early.unitsSoldFirst2-none.unitsSoldFirst2,'decimal'],
    [`Value after ${n} years · crash in year 1 with a ${input.wsqReserve}-year cash reserve`,res.end.total,'money']
  ],
  note:`${money(input.wsqStart)} pays ${money(none.first)} in the first year, ${money(mo)} a month, rising ${input.wsqIndex}% a year. In ordinary years the fund earns ${input.wsqReturn}%. In a crash year it falls ${input.wsqDrop}% and the next year it earns ${(recovery*100).toFixed(2)}%, so the two years together grow exactly as two ordinary years would: every path has the same returns in a different order. Withdrawals are taken at the start of each month by selling units. Returns, the crash and the cash rate are hypothetical inputs, not a forecast of any fund; real markets can fall further, recover more slowly or fall more than once. Values are before any tax on withdrawals, which depends on the account.${ranOut(early)}`,
  charts:[
    {id:'withdraw-sequence-cpi',type:'line',evidence:'Official statistics',title:'What indexing a monthly withdrawal to prices meant, September 2006 to September 2026',unit:'money',xLabel:'September of each year',series:[{name:`Withdrawal raised with the CPI from ${money(mo)} in 2006`,rows:cpi.map(r=>({x:r.x,value:r.indexed}))},{name:`A fixed ${money(mo)}, in September 2006 prices`,dash:true,rows:cpi.map(r=>({x:r.x,value:r.fixedReal}))}],source:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401',sourceLabel:'Statistics Canada · Consumer Price Index, monthly, not seasonally adjusted (table 18-10-0004-01)',note:`All-items CPI for Canada rose from 109.2 in September 2006 to 170.0 in September 2026 (2002=100), retrieved 27 October 2026. Keeping the same purchasing power as ${money(mo)} a month in 2006 took ${money(c26.indexed)} a month by September 2026; a withdrawal left at ${money(mo)} bought only what ${money(c26.fixedReal)} bought in 2006. These are dated observations of past prices; the calculator's ${input.wsqIndex}% a year is your own assumption about the future.`},
    {id:'withdraw-sequence-units',type:'line',title:'Fund units sold each month in the first three years',unit:'decimal',unitLabel:'Units sold to pay one month’s withdrawal · each unit starts at CAD 10',xLabel:'Months of withdrawals',series:[{name:'Crash in year 1',rows:early.months.slice(0,36).map(r=>({x:r.x,value:r.sold}))},{name:'No crash',dash:true,rows:none.months.slice(0,36).map(r=>({x:r.x,value:r.sold}))}],note:`This is dollar-cost averaging in reverse. A fixed dollar withdrawal sells more units when the price is low, so a crash early on removes units that are no longer there for the recovery. Over the first two years the early-crash path sells ${(early.unitsSoldFirst2-none.unitsSoldFirst2).toFixed(1)} more units than the no-crash path, for the same cash paid out. No cash reserve is used in this chart.`},
    {id:'withdraw-sequence-paths',type:'line',title:`Fund value over ${n} years: same returns, different order`,unit:'money',xLabel:'Years of withdrawals',series:[{name:'No crash',rows:none.years.map(r=>({x:r.x,value:r.total}))},{name:'Crash in year 1',rows:early.years.map(r=>({x:r.x,value:r.total}))},{name:`Crash in year ${late}`,dash:true,rows:last.years.map(r=>({x:r.x,value:r.total}))}],note:`Without withdrawals all three paths would end at the same value, because they share the same yearly growth factors. With withdrawals they do not: the early crash ends ${money(none.end.total-early.end.total)} below the no-crash path, and the late crash ends ${money(none.end.total-last.end.total)} below it. The order matters only because money is leaving the fund while prices are low.${ranOut(early)} No cash reserve is used in this chart.`},
    {id:'withdraw-sequence-reserve',type:'groupbar',title:`Value after ${n} years with a cash reserve of 0 to 3 years of withdrawals`,unit:'money',rowLabel:'Cash reserve set aside at the start',seriesNames:['No crash','Crash in year 1',`Crash in year ${late}`],rows:reserves.map(k=>({label:k===0?'No reserve':`${k} year${k>1?'s':''} of withdrawals`,values:[0,1,late].map(c=>withdrawPlan(input,{wsqReserve:k},c).end.total)})),note:`The reserve pays withdrawals only while the fund is below its earlier high, so the fund is not sold during the fall. It helps most when the crash comes early and costs something when there is no crash, because the cash earns ${input.wsqCash}% instead of the fund's ${input.wsqReturn}%. It is not refilled here. A reserve changes which asset is sold when; it does not change the returns, and a fall that lasts longer than the reserve still forces fund sales.`}
  ]};
}
