export const valueAveragingDefinitions={
  valueAveraging:{title:'Compare value averaging with plain dollar-cost averaging from the same monthly savings through a crash',inputIssue:i=>i.vavCrash>=i.vavYears?{message:'The crash must happen before the last year followed, so that its recovery year is inside the period.',fields:['vavCrash','vavYears']}:null,fields:[
    ['vavSave','Amount saved from each month’s pay for investing (CAD)',500,50,20000,50],
    ['vavBuffer','Cash already saved and set aside at the start (CAD)',3000,0,500000,500],
    ['vavTarget','Growth built into the value-averaging target path (% a year)',5,0,12,.25],
    ['vavReturn','Fund return in ordinary years, after fees (%)',5,-2,12,.25],
    ['vavDrop','Fall in the fund in the crash year (%)',25,0,60,1],
    ['vavCrash','Year in which the crash happens',2,1,29,1],
    ['vavCash','Interest earned on cash waiting to be invested (% a year)',2.5,0,8,.1],
    ['vavSell','Sell fund units when the fund is above its target (1 = yes, 0 = no)',1,0,1,1],
    ['vavYears','Years followed',10,3,30,1]
  ]}
};
export const valueAveragingWholeKeys=['vavCrash','vavSell','vavYears'];

// Bank of Canada Valet series V122531, "Treasury Bills - 3 month" (Statistics Canada table 10-10-0122-01,
// financial market statistics, last Wednesday unless otherwise stated), monthly yield in percent,
// September 2006 to September 2026. Retrieved 27 October 2026.
export const tbillYield=[4.15,4.16,4.18,4.16,4.17,4.19,4.16,4.16,4.29,4.42,4.57,3.83,3.97,3.96,3.91,3.86,3.41,3.24,1.72,2.68,2.68,2.6,2.41,2.42,1.92,1.98,1.7,0.83,0.83,0.67,0.39,0.22,0.2,0.24,0.23,0.21,0.22,0.22,0.22,0.19,0.16,0.16,0.28,0.39,0.45,0.5,0.65,0.62,0.87,0.92,0.99,0.98,0.95,0.95,0.92,0.97,0.95,0.93,0.92,0.93,0.83,0.89,0.86,0.83,0.86,0.93,0.92,1.06,0.94,0.86,0.92,1.03,0.99,0.99,0.95,0.92,0.93,0.96,0.97,0.99,1.01,1.03,1,0.99,0.98,0.9,0.94,0.91,0.89,0.85,0.89,0.95,0.93,0.95,0.96,0.94,0.92,0.88,0.91,0.91,0.6,0.56,0.54,0.66,0.63,0.58,0.41,0.37,0.43,0.41,0.48,0.52,0.48,0.46,0.44,0.55,0.53,0.49,0.53,0.51,0.51,0.49,0.51,0.48,0.45,0.47,0.54,0.52,0.52,0.65,0.73,0.71,0.99,0.92,0.88,1.05,1.2,1.14,1.09,1.2,1.29,1.25,1.4,1.54,1.51,1.73,1.72,1.67,1.66,1.67,1.66,1.68,1.69,1.66,1.65,1.62,1.64,1.66,1.66,1.66,1.64,1.61,0.49,0.26,0.22,0.21,0.16,0.14,0.12,0.09,0.12,0.07,0.06,0.11,0.09,0.1,0.1,0.15,0.17,0.18,0.12,0.13,0.09,0.16,0.32,0.37,0.58,1.32,1.37,2.09,2.65,3.22,3.55,3.86,4.06,4.25,4.37,4.5,4.3,4.38,4.59,4.89,5,5.08,5.07,5.08,5,4.89,4.94,4.96,4.99,4.91,4.81,4.64,4.39,4.19,4.02,3.51,3.42,3.15,2.89,2.84,2.64,2.64,2.65,2.67,2.68,2.66,2.42,2.23,2.16,2.15,2.18,2.18,2.29,2.28,2.29,2.26,2.27,2.27,2.39];
// Statistics Canada, Consumer Price Index, all-items, Canada (table 18-10-0004-01, vector v41690973), September
// of each year, 2002=100. Retrieved through the Bank of Canada Valet API on 27 October 2026.
export const septemberCpi={2006:109.2,2007:111.9,2008:115.7,2009:114.7,2010:116.9,2011:120.6,2012:122.0,2013:123.3,2014:125.8,2015:127.1,2016:128.8,2017:130.8,2018:133.7,2019:136.2,2020:136.9,2021:142.9,2022:152.7,2023:158.5,2024:161.1,2025:164.9,2026:170.0};

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const monthly=a=>Math.pow(1+a,1/12)-1;

// CAD 10,000 rolled over in 3-month treasury bills from September 2006: each month earns one twelfth of that
// month's published yield. This is an approximation of what short-term cash earned before tax, not the rate on
// any savings account. The real column divides by September CPI relative to September 2006.
export function tbillRows(start=10000){
  let v=start;const rows=[{x:2006,nominal:v,real:v}];
  tbillYield.slice(0,-1).forEach((y,k)=>{v*=1+y/1200;if((k+1)%12===0){const yr=2006+(k+1)/12;rows.push({x:yr,nominal:v,real:v*septemberCpi[2006]/septemberCpi[yr]});}});
  return rows;
}

// Yearly fund returns. Ordinary years earn r; the crash year loses d and the next year earns (1+r)^2/(1-d)-1,
// so the two years compound to exactly (1+r)^2 and every crash year leaves the same set of growth factors.
export function returnPath(i,crashYear){
  const r=i.vavReturn/100,d=i.vavDrop/100,out=Array(i.vavYears).fill(r);
  if(crashYear){out[crashYear-1]=-d;if(crashYear<i.vavYears)out[crashYear]=(1+r)**2/(1-d)-1;}
  return out;
}

// Monthly simulation; the fund starts at CAD 10 a unit and everything happens at the start of each month.
// Dollar-cost averaging (DCA) invests the month's saving; the starting buffer stays in cash.
// Value averaging (VA) adds the saving to a cash pot, then buys or sells so that the fund equals a target path
// T(m)=T(m-1)*(1+g)+saving, where g is the monthly equivalent of the target growth. That target is what the fund
// would be worth if regular saving earned exactly the target rate. A purchase is limited to the cash in the pot;
// the unpaid part is recorded (largest single month, and the number of months it happened); it is not carried
// forward as a debt, because the next month's target gap already includes it. Sales above target go to the pot when selling is allowed.
// After the trades the fund price grows by that year's monthly return and both cash balances earn the cash rate.
export function valuePlan(input,overrides={},crashYear=input.vavCrash){
  const i={...input,...overrides},n=i.vavYears,path=returnPath(i,crashYear),s=i.vavSave;
  const g=monthly(i.vavTarget/100),c=monthly(i.vavCash/100);
  let price=10,dcaUnits=0,dcaCash=i.vavBuffer,vaUnits=0,pot=i.vavBuffer,target=0,bought=0,boughtUnits=0,sold=0,maxShort=0,shortMonths=0,maxBuy=0,maxBuyMonth=0;
  const months=[];
  for(let y=0;y<n;y++){
    const gr=monthly(path[y]);
    for(let m=0;m<12;m++){
      const k=y*12+m+1;
      dcaUnits+=s/price;
      pot+=s;target=target*(1+g)+s;
      const gap=target-vaUnits*price;let trade=0;
      if(gap>0){trade=Math.min(gap,pot);if(gap-trade>1e-9){maxShort=Math.max(maxShort,gap-trade);shortMonths++;}vaUnits+=trade/price;pot-=trade;bought+=trade;boughtUnits+=trade/price;}
      else if(gap<0&&i.vavSell){trade=gap;vaUnits+=gap/price;pot-=gap;sold-=gap;}
      if(trade>maxBuy){maxBuy=trade;maxBuyMonth=k;}
      months.push({x:k,price,trade,pot,target,va:vaUnits*price,dca:dcaUnits*price});
      price*=1+gr;pot*=1+c;dcaCash*=1+c;
    }
  }
  const dcaFund=dcaUnits*price,vaFund=vaUnits*price,invested=s*n*12;
  return {path,months,price,dcaFund,dcaCash,dcaTotal:dcaFund+dcaCash,vaFund,pot,vaTotal:vaFund+pot,bought,sold,maxShort,shortMonths,maxBuy,maxBuyMonth,
    dcaAvg:invested/dcaUnits,vaAvg:boughtUnits?bought/boughtUnits:0,invested};
}

export function valueAveragingResult(kind,input){
  if(kind!=='valueAveraging')throw Error('Unknown value-averaging topic');
  const n=input.vavYears,c=input.vavCrash,late=n-1;
  const crash=valuePlan(input),none=valuePlan(input,{},0),last=valuePlan(input,{},late),noSell=valuePlan(input,{vavSell:0});
  const t=tbillRows(),t26=t.at(-1);
  const from=Math.max(1,(c-2)*12+1),to=Math.min(n*12,(c+1)*12),win=crash.months.slice(from-1,to);
  const plural=k=>`${k} month${k===1?'':'s'}`;
  const missedText=crash.shortMonths>0?` In the crash path the cash pot ran out in ${plural(crash.shortMonths)}; the largest purchase it could not pay in a single month was ${money(crash.maxShort)}, and the fund stayed behind its target until prices recovered.`:' In the crash path the cash pot always had enough to pay what the target asked for.';
  const avgText=crash.vaAvg<crash.dcaAvg?`Here value averaging paid less per unit on average ($${crash.vaAvg.toFixed(2)} against $${crash.dcaAvg.toFixed(2)}), because it bought heavily while prices were low.`:`Here value averaging did not pay less per unit on average ($${crash.vaAvg.toFixed(2)} against $${crash.dcaAvg.toFixed(2)} for dollar-cost averaging): it bought more while prices fell, but then bought much less in the rebound year, when prices were still low, because the rebound itself lifted the fund back to its target. The savings it did not need to invest stayed in the cash pot.`;
  const lead=crash.vaTotal>=crash.dcaTotal?`value averaging ends ${money(crash.vaTotal-crash.dcaTotal)} ahead`:`value averaging ends ${money(crash.dcaTotal-crash.vaTotal)} behind`;
  return {metrics:[
    [`Total after ${n} years · dollar-cost averaging, crash in year ${c}`,crash.dcaTotal,'money'],
    [`Total after ${n} years · value averaging, crash in year ${c}`,crash.vaTotal,'money'],
    ['Largest single month’s purchase asked for by value averaging',crash.maxBuy,'money'],
    ['Months in which the value-averaging cash pot could not pay the full purchase',crash.shortMonths,'integer'],
    ['Average price paid per unit · dollar-cost averaging',crash.dcaAvg,'money'],
    ['Average price paid per unit · value averaging',crash.vaAvg,'money']
  ],
  note:`Both investors save ${money(input.vavSave)} a month from pay and start with ${money(input.vavBuffer)} in cash. Dollar-cost averaging invests each ${money(input.vavSave)} as it arrives and leaves the starting cash alone. Value averaging puts each saving into a cash pot and buys whatever it takes to keep the fund on a path growing ${input.vavTarget}% a year plus the new savings${input.vavSell?', selling units when the fund is ahead of the path':', without selling when the fund is ahead'}. The fund earns ${input.vavReturn}% in ordinary years and falls ${input.vavDrop}% in year ${c}; the next year makes up exactly two ordinary years. Cash earns ${input.vavCash}%. Every number is a hypothetical calculation before tax, not a forecast of any fund. A lower average purchase price does not by itself mean more money at the end: the money that waits in cash matters too.${missedText}`,
  charts:[
    {id:'value-averaging-tbill',type:'line',evidence:'Official statistics',title:'CAD 10,000 kept in 3-month treasury bills, September 2006 to September 2026, before and after inflation',unit:'money',xLabel:'September of each year',series:[{name:'Rolled over in 3-month treasury bills',rows:t.map(r=>({x:r.x,value:r.nominal}))},{name:'Same balance in September 2006 prices',dash:true,rows:t.map(r=>({x:r.x,value:r.real}))}],source:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1010012201',sourceLabel:'Statistics Canada · Financial market statistics, last Wednesday unless otherwise stated, Bank of Canada (table 10-10-0122-01)',note:`Each month earns one twelfth of the published 3-month treasury bill yield (Bank of Canada series V122531), compounded; the real line divides by the all-items CPI (Statistics Canada table 18-10-0004-01). Yields ranged from 0.06% to 5.08% over the period. CAD 10,000 grew to about ${money(t26.nominal)} by September 2026, but prices rose 55.7%, so it bought what about ${money(t26.real)} bought in 2006. These are dated observations used as an approximation before tax; a savings account or money-market fund can pay less or more, and past rates say nothing certain about future ones.`},
    {id:'value-averaging-trades',type:'line',title:`What each month asks you to invest, from month ${from} to month ${to}`,unit:'money',xLabel:'Months from the start',series:[{name:`Value averaging · crash in year ${c}`,rows:win.map(r=>({x:r.x,value:r.trade}))},{name:'Dollar-cost averaging',dash:true,rows:win.map(r=>({x:r.x,value:input.vavSave}))}],note:`Dollar-cost averaging invests the same ${money(input.vavSave)} every month. Value averaging asks for much more after prices fall, up to ${money(crash.maxBuy)} in month ${crash.maxBuyMonth}, and ${input.vavSell?'asks you to sell (negative amounts) once the recovery lifts the fund above its path':'asks for little or nothing once the recovery lifts the fund above its path, because selling is switched off'}. Those extra purchases have to come from somewhere: cash saved earlier, or money you no longer have for other uses.`},
    {id:'value-averaging-pot',type:'line',title:'Cash waiting in the value-averaging pot',unit:'money',xLabel:'Months from the start',series:[{name:`Crash in year ${c}`,rows:crash.months.map(r=>({x:r.x,value:r.pot}))},{name:'No crash',dash:true,rows:none.months.map(r=>({x:r.x,value:r.pot}))},{name:`Crash in year ${c}, never selling`,rows:noSell.months.map(r=>({x:r.x,value:r.pot}))}],note:`The pot is the cash value averaging keeps beside the fund. When returns beat the ${input.vavTarget}% target the pot builds up, earning only ${input.vavCash}%; after a fall it is drained to buy cheap units. If it runs dry the investor cannot keep to the rule without finding outside money. After ${n} years the pot holds ${money(crash.pot)} with the crash, ${money(none.pot)} without one and ${money(noSell.pot)} with the crash if units are never sold. Balances are taken after each month's trade.`},
    {id:'value-averaging-ending',type:'groupbar',title:`Total after ${n} years, fund plus cash, for each crash timing`,unit:'money',rowLabel:'When the crash happens',seriesNames:['Dollar-cost averaging','Value averaging'],rows:[['No crash',none],[`Crash in year ${c}`,crash],[`Crash in year ${late}`,last]].map(([label,p])=>({label,values:[p.dcaTotal,p.vaTotal]})),note:`Both columns count the same savings and the same starting cash. With the crash in year ${c}, ${lead}. ${avgText} Value averaging can end with less in total when its pot sits in cash for long stretches, when it sells into a rising market, or when a crash comes late and the pot is too small to buy the dip. The rule changes the timing of money going in; it does not change the fund's returns.`}
  ]};
}
