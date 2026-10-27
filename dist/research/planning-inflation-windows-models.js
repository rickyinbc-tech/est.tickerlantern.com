export const inflationWindowDefinitions={
  inflationWindows:{title:'Every stretch of years since 1914: how much a dollar lost, and how wide the range was',fields:[
    ['ivwYears','Length of each window (years)',20,1,60,1],
    ['ivwFrom','Earliest first year of a window (1914–2000)',1914,1914,2000,1],
    ['ivwAssume','Your planning assumption for inflation (% a year)',2.5,0,10,.1],
    ['ivwReturn','Nominal return to test against history (% a year)',4,0,12,.25],
    ['ivwFee','Annual fee taken from that return (%)',0,0,3,.05],
    ['ivwTax','Tax charged each year on the return after fees (%)',0,0,55,1],
    ['ivwGoal','Cost of a goal in today’s dollars (CAD)',50000,1000,5000000,1000]
  ]}
};
export const inflationWindowWholeKeys=['ivwYears','ivwFrom'];

// Statistics Canada table 18-10-0004-01, all-items CPI for Canada (2002=100), vector v41690973, retrieved
// 27 October 2026 through the Web Data Service: sum of the twelve monthly values in each calendar year from
// January 1914 to December 2025. Dividing by 12 gives the annual-average index.
export const cpiSums1914={1914:72.1,1915:73.6,1916:80.2,1917:94.6,1918:107,1919:117.2,1920:136.3,1921:119.8,1922:110.4,1923:110.4,1924:108.3,1925:109.6,1926:110.4,1927:108.8,1928:109.6,1929:110.7,1930:109.6,1931:98.8,1932:89.5,1933:85.6,1934:86.6,1935:87,1936:88.8,1937:92,1938:92.5,1939:91.8,1940:95.7,1941:101.4,1942:106.1,1943:108.4,1944:109.1,1945:109.8,1946:113.2,1947:123.4,1948:141,1949:145.9,1950:149.8,1951:165.6,1952:169.9,1953:168.2,1954:169.3,1955:169.6,1956:171.9,1957:177.6,1958:181.8,1959:184,1960:186.5,1961:188.4,1962:190.4,1963:193.5,1964:197.2,1965:201.8,1966:209.5,1967:217,1968:225.8,1969:236.1,1970:244,1971:250.6,1972:263.1,1973:282.8,1974:313.9,1975:347.4,1976:373.6,1977:403.4,1978:439.6,1979:479.8,1980:528.4,1981:594.3,1982:658.3,1983:696.9,1984:726.9,1985:755.7,1986:787.4,1987:821.7,1988:854.8,1989:897.4,1990:940.3,1991:993.2,1992:1008,1993:1026.8,1994:1028.5,1995:1050.6,1996:1067.1,1997:1084.4,1998:1095.2,1999:1114.2,2000:1144.5,2001:1173.4,2002:1199.9,2003:1233,2004:1255.9,2005:1283.7,2006:1309.4,2007:1337.4,2008:1369.1,2009:1373.2,2010:1397.6,2011:1438.3,2012:1460.1,2013:1473.8,2014:1501.9,2015:1518.8,2016:1540.5,2017:1565.1,2018:1600.6,2019:1631.8,2020:1643.5,2021:1699.3,2022:1814.9,2023:1885.3,2024:1930.2,2025:1970.2};
export const CPI_FIRST=1914,CPI_LAST=2025;
// Monthly index levels used for the latest 12-month change mentioned in the notes.
export const cpiSeptember={2025:164.9,2026:170};

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const cad2=n=>`CAD ${n.toFixed(2)}`;
const pct=(v,d=1)=>`${(v*100).toFixed(d)}%`;

// Annual-average inflation from one calendar year to the next.
export function yearlyInflation(){
  const rows=[];
  for(let y=CPI_FIRST+1;y<=CPI_LAST;y++)rows.push({x:y,value:cpiSums1914[y]/cpiSums1914[y-1]-1});
  return rows;
}

// Every window of n years whose start year is at or after `from`, measured between annual-average index levels.
export function windows(n,from=CPI_FIRST){
  const rows=[];
  for(let s=Math.max(CPI_FIRST,from);s+n<=CPI_LAST;s++){
    const ratio=cpiSums1914[s+n]/cpiSums1914[s];
    rows.push({start:s,end:s+n,ratio,annual:ratio**(1/n)-1,left:1/ratio});
  }
  return rows;
}

export const netReturn=input=>(input.ivwReturn-input.ivwFee)/100*(1-input.ivwTax/100);

// Share of the windows in which a constant net return at least matched inflation over the window.
export function keptShare(net,n,from){
  const w=windows(n,from);
  if(!w.length)return null;
  return w.filter(r=>(1+net)**n>=r.ratio-1e-12).length/w.length;
}

const median=v=>{const s=[...v].sort((a,b)=>a-b),k=s.length>>1;return s.length%2?s[k]:(s[k-1]+s[k])/2;};

export function inflationWindowStats(input){
  const n=input.ivwYears,w=windows(n,input.ivwFrom);
  if(!w.length)return {count:0,windows:w};
  const annual=w.map(r=>r.annual),hi=w.reduce((a,b)=>b.annual>a.annual?b:a),lo=w.reduce((a,b)=>b.annual<a.annual?b:a);
  const med=median(annual),a=input.ivwAssume/100,net=netReturn(input);
  return {count:w.length,windows:w,median:med,hi,lo,above:w.filter(r=>r.annual>a+1e-12).length/w.length,
    goalAssume:input.ivwGoal*(1+a)**n,goalMedian:input.ivwGoal*(1+med)**n,goalHigh:input.ivwGoal*hi.ratio,
    net,kept:keptShare(net,n,input.ivwFrom),leftAssume:(1+a)**-n};
}

export const inflationBuckets=[[-Infinity,0,'Prices fell'],[0,.01,'0% to 1%'],[.01,.02,'1% to 2%'],[.02,.03,'2% to 3%'],[.03,.04,'3% to 4%'],[.04,.05,'4% to 5%'],[.05,.06,'5% to 6%'],[.06,.08,'6% to 8%'],[.08,Infinity,'8% or more']];

export function inflationWindowResult(kind,input){
  if(kind!=='inflationWindows')throw Error('Unknown inflation window topic');
  const n=input.ivwYears,st=inflationWindowStats(input),yrs=`${n} year${n===1?'':'s'}`;
  const yearly=yearlyInflation(),a=input.ivwAssume/100;
  const latest=cpiSeptember[2026]/cpiSeptember[2025]-1;
  const span=r=>`${r.start}–${r.end}`;
  const cols=[1,5,10,20,30,40],rates=[0,1,2,3,4,5,6,8];
  const grid=rates.map(r=>({label:`${r}% before fees and tax`,values:cols.map(c=>keptShare(netReturn({...input,ivwReturn:r}),c,input.ivwFrom))}));
  const top=yearly.reduce((x,r)=>r.value>x.value?r:x),bottom=yearly.reduce((x,r)=>r.value<x.value?r:x),falls=yearly.filter(r=>r.value<0).length;
  const at=y=>yearly.find(r=>r.x===y).value;
  const yearlyChart={id:'inflation-windows-yearly',type:'line',evidence:'Official statistics',title:'Canada’s inflation each year, 1915 to 2025 (annual-average CPI)',unit:'percent',xLabel:'Calendar year',xTicks:[1920,1940,1960,1980,2000,2020].map(v=>({value:v,label:String(v)})),series:[{name:'CPI inflation, annual average',rows:yearly},{name:`Your assumption (${input.ivwAssume}% a year)`,dash:true,rows:[{x:1915,value:a},{x:2025,value:a}]}],source:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401',sourceLabel:'Statistics Canada · Consumer Price Index, monthly, not seasonally adjusted (table 18-10-0004-01)',note:`Each point compares one year’s average all-items CPI with the year before. The highest was ${pct(top.value,2)} in ${top.x} and the lowest ${pct(bottom.value,2)} in ${bottom.x}; prices fell in ${falls} of the ${yearly.length} years, all before 1954. Every year from 1973 to 1982 was above 7%. Inflation was ${pct(at(2022),2)} in 2022 and ${pct(at(2025),2)} in 2025, and the index for September 2026 was ${pct(latest,2)} above September 2025. These are dated observations; the early years rest on a narrower basket than today’s CPI.`};
  if(!st.count)return {metrics:[['Windows that fit in 1914 to 2025',0,'number']],note:`No ${yrs} window starting in or after ${input.ivwFrom} ends by 2025. Choose a shorter window or an earlier first year.`,charts:[yearlyChart]};
  const w=st.windows,kept=st.kept,fell=w.filter(r=>r.left>1);
  const fellNote=fell.length?`A value above CAD 1 means prices fell over the whole window; that happened in ${fell.length} of the ${st.count} windows, all starting between ${fell[0].start} and ${fell.at(-1).start}.`:'Prices rose over every one of these windows.';
  const buckets=inflationBuckets.map(([lo,hi,label])=>({label,value:w.filter(r=>r.annual>=lo&&r.annual<hi).length}));
  return {metrics:[
    [`${n}-year windows from ${w[0].start}–${w[0].end} to ${w.at(-1).start}–${w.at(-1).end}`,st.count,'number'],
    [`Median inflation over ${yrs} (% a year)`,st.median,'percent'],
    [`Highest: ${span(st.hi)} (% a year)`,st.hi.annual,'percent'],
    [`Lowest: ${span(st.lo)} (% a year)`,st.lo.annual,'percent'],
    [`Share of windows above your ${input.ivwAssume}% assumption`,st.above,'percent'],
    [`Goal cost after ${yrs} at your assumption`,st.goalAssume,'money'],
    [`Goal cost if prices rose as in ${span(st.hi)}`,st.goalHigh,'money'],
    [`Share of windows in which ${pct(st.net,2)} a year after fees and tax kept up`,kept,'percent']
  ],
  note:`Across ${st.count} overlapping ${n}-year windows of Canadian CPI, the median rise in prices was ${pct(st.median,2)} a year. The fastest was ${span(st.hi)} at ${pct(st.hi.annual,2)} a year, when a dollar kept ${(st.hi.left*100).toFixed(0)} cents of its buying power, so ${money(input.ivwGoal)} of today’s spending would need ${money(st.goalHigh)}; at your ${input.ivwAssume}% assumption it needs ${money(st.goalAssume)}. ${pct(st.above,0)} of windows ran hotter than your assumption. A steady ${pct(st.net,2)} a year after fees and tax would have kept purchasing power in ${pct(kept,0)} of them. History is a range of past outcomes, not a forecast.`,
  charts:[
    yearlyChart,
    {id:'inflation-windows-left',type:'line',evidence:'Derived from official statistics',title:`What CAD 1 could still buy at the end of each ${n}-year window`,unit:'money',currency:'CAD',xLabel:`Last year of the ${n}-year window`,series:[{name:'Buying power left (CAD 1 at the start)',rows:w.map(r=>({x:r.end,value:r.left}))},{name:`At your ${input.ivwAssume}% assumption`,dash:true,rows:[{x:w[0].end,value:st.leftAssume},{x:w.at(-1).end,value:st.leftAssume}]}],source:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401',sourceLabel:'Calculated from Statistics Canada table 18-10-0004-01 annual-average CPI',note:`Each point divides the average CPI in the first year of a window by the average in its last year. Over ${span(st.hi)}, CAD 1 ended able to buy what ${cad2(st.hi.left)} bought at the start; over ${span(st.lo)}, what ${cad2(st.lo.left)} bought. ${fellNote} Windows overlap, so neighbouring points share most of their years and are not independent observations.`},
    {id:'inflation-windows-spread',type:'bar',evidence:'Derived from official statistics',title:`How often each rate of inflation occurred over ${yrs} (number of windows)`,unit:'number',rows:buckets,note:`Counts of the ${st.count} overlapping ${n}-year windows by their average yearly inflation. The median is ${pct(st.median,2)}; ${pct(st.above,0)} of windows were above your ${input.ivwAssume}% assumption. Longer windows bunch closer together because good and bad years average out, but they still differ widely in total: over ${yrs}, ${pct(st.lo.annual,2)} a year and ${pct(st.hi.annual,2)} a year end in very different places.`},
    {id:'inflation-windows-grid',type:'heatmap',evidence:'Official CPI · hypothetical constant returns',title:'Share of past windows in which a steady return kept purchasing power, after your fee and tax settings',unit:'percent',rowLabel:'Return before fees and tax',columns:cols.map(c=>`${c}-year windows`),rows:grid,note:`Each cell takes a constant yearly return, removes the ${input.ivwFee}% fee and taxes ${input.ivwTax}% of what is left each year, and counts the share of past windows (starting in or after ${input.ivwFrom}) in which that return at least matched the rise in CPI. Real investments do not earn a steady return: a balanced fund’s yearly results vary widely, and the high-inflation 1970s were also poor years for bonds. The grid shows what a return needed to clear, not what any investment delivered.`}
  ]};
}
