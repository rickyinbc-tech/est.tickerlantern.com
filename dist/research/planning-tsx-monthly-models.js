import { tsxClose, cpiMonthly, TSX_START, TSX_MONTHS, monthLabel as label, drawdowns, stateBuckets } from './planning-record-high-models.js';

export const tsxMonthlyDefinitions={
  tsxMonthly:{title:'Monthly saving through every S&P/TSX starting month, 1956 to 2023',inputIssue:i=>i.tmPhase>12*i.tmYears?{message:'The phase-in cannot be longer than the holding period.',fields:['tmPhase']}:null,fields:[
    ['tmYears','Years of monthly contributions (and holding period)',10,1,30,1],
    ['tmFrom','First starting year counted (1956–2022)',1956,1956,2022,1],
    ['tmMonthly','Monthly contribution from pay (CAD)',500,25,20000,25],
    ['tmYield','Assumed dividend yield added to the price change (% a year)',2.5,0,6,.1],
    ['tmFee','Annual fund fee taken from that return (%)',.5,0,3,.05],
    ['tmLump','Lump sum already saved, for the phase-in comparison (CAD)',60000,1000,5000000,1000],
    ['tmPhase','Months over which the lump sum is phased in',12,2,36,1],
    ['tmCash','Interest on money waiting to be invested (% a year)',3,0,10,.25]
  ]}
};
export const tsxMonthlyWholeKeys=['tmYears','tmFrom','tmPhase'];

const xOf=i=>TSX_START+i/12;
const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(v,d=1)=>`${(v*100).toFixed(d)}%`;
const median=v=>{const s=[...v].sort((a,b)=>a-b),k=s.length>>1;return s.length%2?s[k]:(s[k-1]+s[k])/2;};
const yrs=n=>`${n} year${n===1?'':'s'}`;

// Monthly growth factor from the assumed yield less the fee, compounded to the same annual rate.
const monthlyCarry=input=>(1+(input.tmYield-input.tmFee)/100)**(1/12);

// A contribution at the close of every month from s to s+12n−1, valued at each month-end up to s+12n.
// Returns the month-by-month path and the CPI-indexed sum of contributions at the end.
export function saverPath(input,s,n=input.tmYears){
  const g=monthlyCarry(input),e=s+12*n,rows=[];
  let units=0,paid=0;
  for(let t=s;t<=e;t++){
    if(t<e){units+=input.tmMonthly/tsxClose[t]/g**(t-s);paid+=input.tmMonthly;}
    rows.push({t,paid,value:units*tsxClose[t]*g**(t-s)});
  }
  let indexed=0;for(let j=s;j<e;j++)indexed+=input.tmMonthly*cpiMonthly[e]/cpiMonthly[j];
  const end=rows.at(-1),below=rows.slice(1).filter(r=>r.value<r.paid-1e-9).length;
  let run=0,longest=0;for(const r of rows.slice(1)){run=r.value<r.paid-1e-9?run+1:0;longest=Math.max(longest,run);}
  return {s,e,rows,paid:end.paid,value:end.value,indexed,multiple:end.value/end.paid,below,longest};
}

// A lump sum invested at the close of month s, or in equal parts at s..s+k−1 with the rest earning cash.
export function lumpValue(input,s,n=input.tmYears){
  const e=s+12*n;return input.tmLump*tsxClose[e]/tsxClose[s]*monthlyCarry(input)**(e-s);
}
export function phasedValue(input,s,k=input.tmPhase,n=input.tmYears){
  const e=s+12*n,g=monthlyCarry(input),c=1+input.tmCash/100,part=input.tmLump/k;let v=0;
  for(let j=0;j<k;j++)v+=part*c**(j/12)*tsxClose[e]/tsxClose[s+j]*g**(e-s-j);
  return v;
}

export const startMonths=(input,n=input.tmYears)=>{
  const out=[];for(let s=Math.max(0,(input.tmFrom-TSX_START)*12);s+12*n<TSX_MONTHS;s++)out.push(s);return out;
};

export function tsxMonthlyStats(input){
  const starts=startMonths(input),paths=starts.map(s=>saverPath(input,s));
  if(!paths.length)return {starts,paths};
  const lumps=starts.map(s=>({s,lump:lumpValue(input,s),phased:phasedValue(input,s)}));
  const worst=paths.reduce((a,b)=>b.multiple<a.multiple?b:a),best=paths.reduce((a,b)=>b.multiple>a.multiple?b:a);
  return {starts,paths,lumps,worst,best,
    medMultiple:median(paths.map(p=>p.multiple)),
    belowEnd:paths.filter(p=>p.value<p.paid-1e-9).length/paths.length,
    belowReal:paths.filter(p=>p.value<p.indexed-1e-9).length/paths.length,
    medBelowShare:median(paths.map(p=>p.below/(12*input.tmYears))),
    longest:paths.reduce((a,b)=>b.longest>a.longest?b:a),
    lumpBelow:lumps.filter(r=>r.lump<input.tmLump-1e-9).length/lumps.length,
    lumpWins:lumps.filter(r=>r.lump>=r.phased-1e-9).length/lumps.length,
    medGap:median(lumps.map(r=>r.lump/r.phased-1))};
}

export function tsxMonthlyResult(kind,input){
  if(kind!=='tsxMonthly')throw Error('Unknown monthly-saving topic');
  const n=input.tmYears,st=tsxMonthlyStats(input),N=yrs(n);
  if(!st.paths.length)return {metrics:[['Starting months with a full period of data after them',0,'number']],note:`No starting month from ${input.tmFrom} has a full ${N} of index data after it; the series ends in September 2023. Choose an earlier first year or fewer years.`,charts:[]};
  const src='https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1010012501',srcLabel='Calculated from Statistics Canada table 10-10-0125-01';
  const ticks=[1960,1970,1980,1990,2000,2010,2020].filter(v=>v>=xOf(st.starts[0])-1&&v<=xOf(st.starts.at(-1))).map(v=>({value:v,label:String(v)}));
  const hz=[5,10,15,20,25,30];
  const hzRows=hz.map(h=>{const ps=startMonths(input,h).map(s=>saverPath(input,s,h)),ls=startMonths(input,h);
    if(!ps.length)return null;
    return {label:`${h} years`,values:[ps.filter(p=>p.value<p.paid-1e-9).length/ps.length,ps.filter(p=>p.value<p.indexed-1e-9).length/ps.length,ls.filter(s=>lumpValue(input,s,h)<input.tmLump-1e-9).length/ls.length],count:ps.length};}).filter(Boolean);
  const phases=[3,6,12,24,36],buckets=stateBuckets(0),dd=drawdowns();
  const grid=buckets.map(b=>({label:b.label,values:phases.map(k=>{if(k>12*n)return null;const ss=st.starts.filter(s=>b.test(dd[s].dd));return ss.length?ss.filter(s=>lumpValue(input,s)>=phasedValue(input,s,k)-1e-9).length/ss.length:null;})}));
  const w=st.worst,step=Math.max(1,Math.round(w.rows.length/120));
  const firstLab=label(st.starts[0]),lastLab=label(st.starts.at(-1));
  return {metrics:[
    [`Starting months counted (${firstLab} to ${lastLab})`,st.starts.length,'integer'],
    [`Total paid in over ${N}`,input.tmMonthly*12*n,'money'],
    [`Median ending value as a share of the money paid in`,st.medMultiple,'percent'],
    [`Worst ending value as a share of the money paid in (start ${label(w.s)})`,w.multiple,'percent'],
    [`Starting months that ended below the money paid in`,st.belowEnd,'percent'],
    [`Starting months that ended below the money paid in, raised by CPI`,st.belowReal,'percent'],
    [`Median share of months the account sat below the money paid in`,st.medBelowShare,'percent'],
    [`Longest unbroken stretch below the money paid in (months)`,st.longest.longest,'integer'],
    [`Lump sum invested at once that ended below ${money(input.tmLump)}`,st.lumpBelow,'percent'],
    [`Starting months in which investing at once beat a ${input.tmPhase}-month phase-in`,st.lumpWins,'percent']
  ],
  note:`Saving ${money(input.tmMonthly)} at every month-end for ${N}, in an index fund that followed the S&P/TSX Composite price plus a ${input.tmYield}% yield less a ${input.tmFee}% fee, the median start ended with ${st.medMultiple.toFixed(2)} dollars per dollar paid in across ${st.starts.length} starting months from ${firstLab} to ${lastLab}. ${pct(st.belowEnd)} of starts ended below the money paid in, and ${pct(st.belowReal)} below it once each contribution is raised by the CPI. The worst start, ${label(w.s)}, ended at ${w.multiple.toFixed(2)}. For a lump sum already saved, investing at once beat a ${input.tmPhase}-month phase-in for ${pct(st.lumpWins,0)} of starts, with a median difference of ${pct(st.medGap)}. The index is real; the yield, fee and cash rate are your assumptions; months overlap and the record is one market's past.`,
  charts:[
    {id:'tsx-monthly-multiple',type:'line',evidence:'Official index · hypothetical yield and fee',title:`Ending value as a share of the money paid in after ${N} of monthly contributions, by starting month`,unit:'percent',xLabel:'First contribution',xMin:xOf(st.starts[0]),xTicks:ticks,series:[
      {name:'Monthly saver: ending value ÷ money paid in',rows:st.paths.map(p=>({x:xOf(p.s),label:label(p.s),value:p.multiple}))},
      {name:'Break-even: 100% of money paid in',dash:true,rows:st.paths.map(p=>({x:xOf(p.s),label:label(p.s),value:1}))}],
      source:src,sourceLabel:srcLabel,note:`Each point starts ${money(input.tmMonthly)} a month at the close of that month and values the account ${N} later, after the last of ${12*n} contributions has had one month. Unit prices follow the S&P/TSX Composite price index; your ${input.tmYield}% yield less ${input.tmFee}% fee is added each month as a constant. The best start was ${label(st.best.s)} (${pct(st.best.multiple)}) and the worst ${label(w.s)} (${pct(w.multiple)}). Dollar amounts scale with the contribution, so the share is the same for any monthly amount.`},
    {id:'tsx-monthly-worst',type:'line',evidence:'Official index · hypothetical yield and fee',title:`The worst starting month, ${label(w.s)}: account value against money paid in`,unit:'money',xLabel:'Month-end',xMin:xOf(w.s),series:[
      {name:'Account value',rows:w.rows.filter((r,i)=>i%step===0||i===w.rows.length-1).map(r=>({x:xOf(r.t),label:label(r.t),value:r.value}))},
      {name:'Money paid in',dash:true,rows:w.rows.filter((r,i)=>i%step===0||i===w.rows.length-1).map(r=>({x:xOf(r.t),label:label(r.t),value:r.paid}))}],
      source:src,sourceLabel:srcLabel,note:`Starting in ${label(w.s)}, the account was below the money paid in for ${w.below} of ${12*n} month-ends, the longest stretch ${w.longest} months in a row, and ended at ${money(w.value)} against ${money(w.paid)} paid in (${money(w.indexed)} if each contribution is raised by the CPI to ${label(w.e)}). ${step>1?`Every ${step}th month is plotted; the table has the same points.`:'Every month-end is plotted.'}`},
    {id:'tsx-monthly-below',type:'groupbar',evidence:'Official index and CPI · hypothetical yield and fee',title:'Share of starting months that ended below the money put in, by holding period',unit:'percent',rowLabel:'Years of contributions',seriesNames:['Monthly saver, below money paid in','Monthly saver, below money paid in raised by CPI','Lump sum at the start, below its amount'],rows:hzRows.map(r=>({label:r.label,values:r.values})),note:`Starting months from ${input.tmFrom} with the full period of data after them: ${hzRows.map(r=>`${r.label}, ${r.count}`).join('; ')}. The CPI series raises each contribution to the prices of the final month, so the middle bar asks whether the account kept the purchasing power of what was saved. A monthly saver and a lump-sum investor face different risks: the saver's early contributions carry most of the time in the market, and the later ones carry little.`},
    {id:'tsx-monthly-phase',type:'heatmap',evidence:'Official index · hypothetical yield, fee and cash rate',title:`Share of starting months in which investing a lump sum at once beat phasing it in, over ${N}`,unit:'percent',rowLabel:'Where the index stood at the start',columns:phases.map(k=>`${k} months`),rows:grid,unavailableLabel:'No months',note:`Each cell compares ${money(input.tmLump)} invested at the close of the starting month with the same amount invested in equal parts over the phase-in months, the uninvested part earning ${input.tmCash}% a year, both valued ${N} after the start. It is for money already saved; a paycheque contribution cannot be invested before it is earned. The starting position uses the distance below the highest earlier close.`}
  ]};
}
