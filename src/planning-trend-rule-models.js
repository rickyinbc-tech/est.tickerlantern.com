import { tsxClose, cpiMonthly, TSX_START, TSX_MONTHS, monthLabel as label } from './planning-record-high-models.js';

export const trendRuleDefinitions={
  trendRule:{title:'A moving-average exit rule on the S&P/TSX against staying invested, 1958 to 2023',fields:[
    ['maWindow','Moving-average length (months of closes)',10,2,24,1],
    ['maBand','Buffer around the average before switching (%)',0,0,10,.5],
    ['maFrom','First year of the test (1958–2022)',1958,1958,2022,1],
    ['maYears','Holding period for the rolling comparison (years)',10,1,30,1],
    ['maYield','Assumed dividend yield added to the price change (% a year)',2.5,0,6,.1],
    ['maFee','Annual fund fee taken from that return (%)',.5,0,3,.05],
    ['maCost','Trading cost on each switch (% of the amount moved)',.1,0,2,.05],
    ['maMarg','Marginal tax rate on interest in a taxable account (%; 0 inside a TFSA)',0,0,55,1],
    ['maDivTax','Tax rate on the fund’s dividends in a taxable account (%; 0 inside a TFSA)',0,0,55,1],
    ['maAmount','Starting amount (CAD)',10000,500,5000000,500]
  ]}
};
export const trendRuleWholeKeys=['maWindow','maFrom','maYears'];

// Statistics Canada table 10-10-0122-01, Treasury bill auction - average yields: 3 month (vector v122541),
// retrieved 27 October 2026 through the Web Data Service. 813 monthly values (% a year) from January 1956 to
// September 2023, aligned with the S&P/TSX closes; the series continues to September 2026 (2.387%).
export const tbillMonthly=[2.53,2.56,2.64,2.89,2.72,2.52,2.65,2.9,3.16,3.34,3.52,3.67,3.7,3.76,3.7,3.75,3.76,3.81,3.81,4.03,3.8,3.8,3.58,3.62,3.25,2.86,2.27,1.58,1.54,1.72,0.87,1.49,2.27,2.83,2.88,3.49,3.28,4.07,4.3,4.76,4.9,5.11,5.47,5.33,5.5,5.02,4.86,5.12,4.6,4.61,3.01,3.26,3.01,3.07,2.92,2.01,1.7,3.03,3.95,3.25,3.04,3.11,3.21,3.28,3.14,2.57,2.55,2.26,2.59,2.5,2.5,2.99,3.07,3.21,3.12,3.07,3.52,5.45,5.47,4.95,4.99,4.16,3.71,3.91,3.65,3.68,3.62,3.66,3.19,3.24,3.43,3.71,3.56,3.59,3.63,3.78,3.77,3.88,3.88,3.7,3.58,3.59,3.67,3.8,3.73,3.7,3.87,3.82,3.74,3.74,3.62,3.77,3.9,3.93,4.05,4.08,4.13,4.15,4.16,4.54,4.63,4.69,5.06,5.08,5.11,5,5.02,5.04,5.01,5.19,5.15,4.96,4.68,4.58,4.13,4,4.24,4.28,4.32,4.34,4.76,4.95,5.46,5.95,6.29,6.8,6.98,6.99,6.95,6.56,6.03,5.48,5.66,5.57,5.66,6.24,6.38,6.43,6.58,6.8,6.74,7.13,7.62,7.69,7.77,7.6,7.76,7.81,7.78,7.6,7,6.78,6.34,5.94,5.7,5.51,5.39,5.01,4.4,4.44,4.68,4.06,3.16,3,3.03,3.37,3.68,3.79,4.06,3.47,3.24,3.21,3.36,3.45,3.57,3.64,3.73,3.5,3.46,3.5,3.62,3.57,3.68,3.65,3.9,3.99,4.46,4.9,5.18,5.48,5.74,6.18,6.5,6.53,6.43,6.35,6.22,6.07,6.51,7.64,8.63,8.75,9.1,9.11,8.94,8.31,7.49,7.12,6.4,6.26,6.33,6.85,6.87,6.99,7.44,7.87,8.41,8.16,8.52,8.64,8.59,8.79,9.07,8.99,8.94,8.98,9.07,9.13,9.11,9.01,8.59,8.14,8.04,7.65,7.54,7.58,7.05,7.07,7.14,7.14,7.1,7.24,7.26,7.17,7.13,7.3,7.73,8.19,8.2,8.26,8.66,8.8,9.17,9.85,10.36,10.46,10.85,10.82,10.92,10.82,10.84,10.78,11.24,11.45,11.64,13.61,13.62,13.66,13.5,13.55,15.24,15.15,11.58,10.38,10.06,10.49,10.95,11.91,13.7,17.01,16.86,16.83,16.44,17.35,18.43,18.83,20.29,20.82,19.35,17.96,15.07,14.41,14.34,14.58,15.07,14.98,15.18,16.33,15.25,13.7,12.73,11.21,10.72,9.8,9.58,9.23,9.17,9.12,9.25,9.17,9.24,9.29,9.24,9.24,9.48,9.71,9.73,9.82,10.53,10.59,11.29,12.11,12.73,12.13,12.02,11.42,10.5,9.84,9.5,11.27,10.4,9.77,9.51,9.33,9.06,8.95,8.75,8.53,8.85,9.24,10.55,11.55,10.19,8.72,8.33,8.59,8.26,8.33,8.35,8.3,8.24,8.24,7.24,7.28,6.8,8.08,8.19,8.29,8.97,8.99,9.35,7.84,8.31,8.41,8.37,8.32,8.53,8.87,8.92,9.19,9.29,9.98,10.33,10.29,10.76,10.94,11.18,11.61,12.14,12.37,12.17,12.08,12.11,12.16,12.23,12.17,12.21,12.22,12.34,13.16,13.26,13.55,13.67,13.58,13.23,12.67,12.4,12.36,12.01,11.47,10.48,9.72,9.67,9.241,8.812,8.65,8.656,8.534,8.339,7.79,7.406,7.422,7.04,7.25,7.239,6.719,6.081,5.596,5.17,4.821,7.371,6.055,8.566,7.111,6.562,5.843,5.113,5.345,4.848,4.539,4.156,4.74,4.648,4.383,4.09,3.856,3.632,3.85,5.388,5.818,6.335,6.672,5.794,5.354,5.291,5.374,5.789,7.181,7.979,7.768,8.217,7.917,7.394,6.721,6.623,6.338,6.456,5.929,5.816,5.541,5.119,5.18,5.025,4.726,4.645,4.695,4.425,4.033,3.962,3.193,2.69,2.799,2.841,2.858,3.186,3.138,3.005,2.861,3.321,3.13,3.099,3.628,3.574,4.46,4.183,4.571,4.565,4.825,4.75,4.882,4.926,4.876,4.936,4.744,4.815,4.697,4.658,4.835,4.749,4.601,4.42,4.622,4.636,4.834,4.687,4.85,4.815,4.93,5.076,5.051,5.277,5.449,5.751,5.551,5.625,5.622,5.564,5.619,5.736,5.557,5.142,4.804,4.604,4.41,4.401,4.242,4.029,3.805,3.039,2.54,2.207,1.996,1.966,2.07,2.343,2.41,2.622,2.738,2.849,2.996,2.826,2.805,2.734,2.669,2.813,2.861,3.142,3.241,3.197,3.127,2.808,2.7,2.597,2.651,2.714,2.59,2.26,2.133,1.99,1.944,2.018,2.042,2.084,2.14,2.412,2.583,2.556,2.477,2.437,2.464,2.546,2.461,2.451,2.473,2.581,2.758,2.813,3.025,3.304,3.395,3.49,3.712,3.788,3.974,4.175,4.3,4.157,4.129,4.165,4.169,4.177,4.161,4.156,4.184,4.173,4.168,4.286,4.418,4.562,4.009,4.105,3.968,3.92,3.862,3.455,3.239,2.025,2.702,2.727,2.691,2.417,2.518,1.877,2.215,1.835,0.945,0.927,0.801,0.416,0.247,0.197,0.243,0.241,0.238,0.222,0.232,0.228,0.202,0.179,0.17,0.289,0.401,0.427,0.579,0.641,0.692,0.893,0.915,0.982,0.998,0.986,0.967,0.918,0.979,0.959,0.915,0.934,0.932,0.868,0.865,0.886,0.826,0.877,0.941,0.926,1.042,1.006,0.902,0.972,1.034,1,1,0.988,0.98,0.934,0.96,0.978,0.993,0.999,1.024,1.013,0.995,0.986,0.915,0.939,0.888,0.891,0.866,0.88,0.939,0.915,0.928,0.946,0.936,0.918,0.878,0.895,0.912,0.592,0.467,0.528,0.647,0.665,0.576,0.427,0.376,0.413,0.393,0.442,0.497,0.481,0.462,0.462,0.541,0.551,0.494,0.504,0.512,0.533,0.504,0.509,0.473,0.456,0.48,0.513,0.548,0.529,0.683,0.74,0.742,1.009,0.895,0.872,1.05,1.196,1.171,1.086,1.2,1.3,1.247,1.442,1.509,1.546,1.734,1.713,1.665,1.627,1.682,1.652,1.666,1.687,1.661,1.645,1.638,1.624,1.662,1.652,1.671,1.642,1.638,0.233,0.272,0.255,0.209,0.165,0.149,0.136,0.086,0.109,0.115,0.056,0.073,0.096,0.101,0.109,0.142,0.18,0.178,0.146,0.146,0.129,0.174,0.517,0.618,0.773,1.376,1.477,2.105,2.696,3.318,3.652,4.172,4.133,4.303,4.458,4.564,4.407,4.45,4.563,4.932,5.034,5.157,5.145];

export const INCLUSION=.5;
const xOf=i=>TSX_START+i/12;
const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(v,d=1)=>`${(v*100).toFixed(d)}%`;
const median=v=>{const s=[...v].sort((a,b)=>a-b),k=s.length>>1;return s.length%2?s[k]:(s[k-1]+s[k])/2;};
const yrs=n=>`${n} year${n===1?'':'s'}`;

// Average of the k month-end closes ending at month t.
const smaCache=new Map();
export function sma(k){
  if(smaCache.has(k))return smaCache.get(k);
  const out=Array(TSX_MONTHS).fill(null);let sum=0;
  for(let t=0;t<TSX_MONTHS;t++){sum+=tsxClose[t];if(t>=k)sum-=tsxClose[t-k];if(t>=k-1)out[t]=sum/k;}
  smaCache.set(k,out);return out;
}

// One account from the close of month s to the close of month e. With rule=false it stays invested
// (buy and hold); with rule=true it holds the fund only while the last close is above the k-month average
// (with the buffer b) and otherwise earns the treasury bill yield. Taxable accounts pay tax on dividends and
// interest as they arrive and on net capital gains when units are sold, with losses carried forward.
export function simulate(input,s,e,{rule=true,k=input.maWindow,keepPath=false}={}){
  const avg=sma(k),b=input.maBand/100,c=input.maCost/100,m=input.maMarg/100,td=input.maDivTax/100;
  const carry=(input.maYield/100*(1-td)-input.maFee/100)/12,divNet=input.maYield/100*(1-td)/12;
  let inv=rule?tsxClose[s]>=avg[s]:true,value=input.maAmount,acb=value,lossPool=0,taxPaid=0,costPaid=0,peak=value,maxDD=0,inMonths=0;
  const trades=[],path=keepPath?[{t:s,value,inv,dd:0}]:null;
  const gainTax=proceeds=>{let g=proceeds-acb;if(g<0){lossPool-=g;return 0;}const used=Math.min(g,lossPool);lossPool-=used;return (g-used)*INCLUSION*m;};
  for(let t=s;t<e;t++){
    if(rule&&t>s){
      const want=inv?tsxClose[t]>=avg[t]*(1-b):tsxClose[t]>avg[t]*(1+b);
      if(want!==inv){
        const fee=value*c;costPaid+=fee;value-=fee;
        if(inv){const tax=gainTax(value);taxPaid+=tax;value-=tax;}else acb=value;
        inv=want;trades.push({t,inv,level:tsxClose[t]});
      }
    }
    if(inv){acb+=value*divNet;taxPaid+=value*input.maYield/100*td/12;value=value*tsxClose[t+1]/tsxClose[t]+value*carry;inMonths++;}
    else{const i=tbillMonthly[t]/1200;taxPaid+=value*i*m;value*=1+i*(1-m);}
    peak=Math.max(peak,value);maxDD=Math.min(maxDD,value/peak-1);
    if(keepPath)path.push({t:t+1,value,inv,dd:value/peak-1});
  }
  const pre=value;let endTax=0;if(inv){endTax=gainTax(value);value-=endTax;taxPaid+=endTax;}
  return {s,e,value,pre,endTax,taxPaid,costPaid,maxDD,inMonths,trades,path,months:e-s};
}

// Exits to cash and whether the fund was bought back at a higher index level (the exit cost the account).
export function roundTrips(trades){
  const out=[];for(let i=0;i<trades.length;i++)if(!trades[i].inv){const back=trades.slice(i+1).find(x=>x.inv);out.push({t:trades[i].t,exit:trades[i].level,back:back?.t??null,reentry:back?.level??null,whipsaw:!!back&&back.level>=trades[i].level});}
  return out;
}

export const firstStart=input=>Math.max(24,(input.maFrom-TSX_START)*12);
export const rollingStarts=(input,n)=>{const out=[];for(let s=firstStart(input);s+12*n<TSX_MONTHS;s++)out.push(s);return out;};
const annual=(r,months)=>r**(12/months)-1;

export function rollingShare(input,k,n){
  const ss=rollingStarts(input,n);if(!ss.length)return null;
  let wins=0;for(const s of ss){const e=s+12*n;if(simulate(input,s,e,{k}).value>=simulate(input,s,e,{rule:false}).value-1e-9)wins++;}
  return {share:wins/ss.length,count:ss.length};
}

export function trendRuleStats(input){
  const s=firstStart(input),e=TSX_MONTHS-1;
  if(s>=e)return null;
  const hold=simulate(input,s,e,{rule:false,keepPath:true}),rule=simulate(input,s,e,{keepPath:true}),trips=roundTrips(rule.trades);
  const roll=rollingStarts(input,input.maYears).map(st=>{const en=st+12*input.maYears;return {s:st,hold:simulate(input,st,en,{rule:false}).value,rule:simulate(input,st,en).value};});
  return {s,e,hold,rule,trips,roll,
    holdAnnual:annual(hold.value/input.maAmount,e-s),ruleAnnual:annual(rule.value/input.maAmount,e-s),
    cpiRatio:cpiMonthly[e]/cpiMonthly[s],
    rollWins:roll.length?roll.filter(r=>r.rule>=r.hold-1e-9).length/roll.length:null,
    rollMedGap:roll.length?median(roll.map(r=>r.rule/r.hold-1)):null};
}

export function trendRuleResult(kind,input){
  if(kind!=='trendRule')throw Error('Unknown trend-rule topic');
  const st=trendRuleStats(input),N=yrs(input.maYears);
  if(!st)return {metrics:[['Months tested',0,'integer']],note:'The index series ends in September 2023; choose an earlier first year.',charts:[]};
  const {s,e,hold,rule,trips}=st,whips=trips.filter(x=>x.whipsaw).length,taxable=input.maMarg>0||input.maDivTax>0;
  const src='https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1010012501',srcLabel='Calculated from Statistics Canada tables 10-10-0125-01 (S&P/TSX) and 10-10-0122-01 (treasury bills)';
  const step=Math.max(1,Math.ceil((e-s)/160)),pick=(r,i,a)=>i%step===0||i===a.length-1;
  const ticks=[1960,1970,1980,1990,2000,2010,2020].filter(v=>v>=xOf(s)&&v<=xOf(e)).map(v=>({value:v,label:String(v)}));
  const rel=hold.path.map((h,i)=>({t:h.t,value:rule.path[i].value/h.value})).filter(pick);
  const decades=[];for(let d=Math.floor(xOf(s)/10)*10;d<=2020;d+=10){const tr=trips.filter(x=>Math.floor(xOf(x.t)/10)*10===d);decades.push({label:`${d}s`,values:[tr.length,tr.filter(x=>x.whipsaw).length]});}
  const lengths=[3,6,10,12,18,24],horizons=[3,5,10,20];
  const grid=lengths.map(k=>({label:`${k} months`,values:horizons.map(n=>rollingShare(input,k,n)?.share??null)}));
  const acct=taxable?`a taxable account (interest taxed at ${input.maMarg}%, dividends at ${input.maDivTax}%, half of each net capital gain at ${input.maMarg}% when sold)`:'a TFSA, so no tax';
  return {metrics:[
    [`Months tested (${label(s)} to ${label(e)})`,e-s,'integer'],
    [`Staying invested: ${money(input.maAmount)} became`,hold.value,'money'],
    [`${input.maWindow}-month rule: ${money(input.maAmount)} became`,rule.value,'money'],
    ['Staying invested: yearly return',st.holdAnnual,'percent'],
    [`${input.maWindow}-month rule: yearly return`,st.ruleAnnual,'percent'],
    ['Staying invested: deepest fall from a previous high',hold.maxDD,'percent'],
    [`${input.maWindow}-month rule: deepest fall from a previous high`,rule.maxDD,'percent'],
    ['Share of months the rule held the fund',rule.inMonths/rule.months,'percent'],
    ['Exits to cash',trips.length,'integer'],
    ['Exits bought back at a higher index level',whips,'integer'],
    [`Rolling ${input.maYears}-year periods in which the rule ended ahead`,st.rollWins,'percent']
  ],
  note:`From ${label(s)} to ${label(e)}, in ${acct}, ${money(input.maAmount)} that stayed in a fund following the S&P/TSX Composite price plus a ${input.maYield}% yield less a ${input.maFee}% fee became ${money(hold.value)} (${pct(st.holdAnnual,2)} a year); switching to treasury bills whenever the month-end close fell below its ${input.maWindow}-month average${input.maBand?` by more than ${input.maBand}%`:''} became ${money(rule.value)} (${pct(st.ruleAnnual,2)} a year), with ${trips.length} exits to cash, ${whips} of them bought back at a higher index level. Its deepest fall was ${pct(rule.maxDD)} against ${pct(hold.maxDD)}. Across ${st.roll.length} rolling ${input.maYears}-year periods the rule ended ahead in ${st.rollWins==null?'none':pct(st.rollWins)}. Prices rose ${pct(st.cpiRatio-1,0)} over the whole test. Dated index and yield history with assumed dividends, fees, costs and taxes; not a forecast or a recommendation.`,
  charts:[
    {id:'trend-rule-relative',type:'line',evidence:'Official index and yields · hypothetical yield, fee, cost and tax',title:`The ${input.maWindow}-month rule’s account as a share of staying invested, ${label(s)} to ${label(e)}`,unit:'percent',xLabel:'Month-end',xMin:xOf(s),xTicks:ticks,series:[
      {name:`${input.maWindow}-month rule ÷ staying invested`,rows:rel.map(r=>({x:xOf(r.t),label:label(r.t),value:r.value}))},
      {name:'Level: both accounts equal',dash:true,rows:rel.map(r=>({x:xOf(r.t),label:label(r.t),value:1}))}],
      source:src,sourceLabel:srcLabel,note:`Both accounts start with ${money(input.maAmount)} at the close of ${label(s)}. The line rises while the rule sits in treasury bills during a fall and drops when it misses a rebound or pays to switch. It ended at ${pct(rule.value/hold.value)}. ${step>1?`Every ${step}th month is plotted; the table has the same points.`:'Every month-end is plotted.'} Trading costs: ${money(rule.costPaid)} over ${rule.trades.length} switches.`},
    {id:'trend-rule-drawdown',type:'line',evidence:'Official index and yields · hypothetical yield, fee, cost and tax',title:'How far each account stood below its own previous high',unit:'percent',xLabel:'Month-end',xMin:xOf(s),xTicks:ticks,series:[
      {name:'Staying invested',rows:hold.path.filter(pick).map(r=>({x:xOf(r.t),label:label(r.t),value:r.dd}))},
      {name:`${input.maWindow}-month rule`,dash:true,rows:rule.path.filter(pick).map(r=>({x:xOf(r.t),label:label(r.t),value:r.dd}))}],
      source:src,sourceLabel:srcLabel,note:`Measured at month-ends on each account’s own value, after its costs and taxes. The deepest falls were ${pct(hold.maxDD)} staying invested and ${pct(rule.maxDD)} for the rule. Because the rule only reacts after a month-end close below the average, it still takes the first part of every fall, and a sudden drop inside one month is not avoided. ${step>1?`Every ${step}th month is plotted, so the plotted low can be shallower than the exact figure.`:''}`},
    {id:'trend-rule-switches',type:'groupbar',evidence:'Official index · rule applied to history',title:`Exits to cash by decade, and how many were bought back higher`,unit:'integer',rowLabel:'Decade',seriesNames:['Exits to cash','Bought back at a higher index level'],rows:decades,source:src,sourceLabel:srcLabel,note:`An exit is a month-end close below the ${input.maWindow}-month average${input.maBand?` by more than ${input.maBand}%`:''}; the fund is bought back at the first close above it${input.maBand?` by more than ${input.maBand}%`:''}. ${whips} of ${trips.length} exits were bought back at a higher index level than the sale, so the trip lost ground before costs and taxes even though it earned treasury bill interest meanwhile. The ${decades[0].label} bar starts in ${label(s)} and the 2020s bar ends in September 2023.`},
    {id:'trend-rule-windows',type:'heatmap',evidence:'Official index and yields · hypothetical yield, fee, cost and tax',title:'Share of rolling periods in which the moving-average rule ended ahead of staying invested',unit:'percent',rowLabel:'Moving-average length',columns:horizons.map(n=>`${n} years`),rows:grid,unavailableLabel:'No periods',source:src,sourceLabel:srcLabel,note:`Each cell starts both accounts at every month-end from ${label(s)} that has the full period of data after it, and counts how often the rule’s final value (after selling at the end, in ${acct}) was at least as large. Starting months overlap heavily, so these are far fewer independent outcomes than the counts suggest. Your buffer (${input.maBand}%), cost (${input.maCost}%) and taxes apply to every cell.`}
  ]};
}
