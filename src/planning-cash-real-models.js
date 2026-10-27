export const cashRealDefinitions={
  cashReal:{title:'Cash in treasury bills against inflation and tax, January 1956 to September 2026',fields:[
    ['crFrom','First year cash is held (1956–2025)',1956,1956,2025,1],
    ['crYears','Holding period for the rolling comparison (years)',10,1,30,1],
    ['crMarg','Marginal tax rate on interest in a taxable account (%)',40,0,55,1],
    ['crSpread','How far your savings rate sits below the treasury bill yield (percentage points)',0,0,3,.05],
    ['crTarget','Real return that counts as keeping up (% a year after inflation)',0,-2,3,.1],
    ['crAmount','Amount held in cash (CAD)',10000,500,5000000,500]
  ]}
};
export const cashRealWholeKeys=['crFrom','crYears'];

// Statistics Canada table 10-10-0122-01, Treasury bill auction - average yields: 3 month (vector v122541), and
// table 18-10-0004-01, all-items CPI, 2002=100 (vector v41690973), retrieved 27 October 2026 through the Web Data
// Service: 849 monthly values each from January 1956 to September 2026, no gaps (yields release 9 October 2026,
// CPI release 19 October 2026). The first 813 values are identical to the arrays in the trend-rule and record-high
// modules.
export const cashTbill=[2.53,2.56,2.64,2.89,2.72,2.52,2.65,2.9,3.16,3.34,3.52,3.67,3.7,3.76,3.7,3.75,3.76,3.81,3.81,4.03,3.8,3.8,3.58,3.62,3.25,2.86,2.27,1.58,1.54,1.72,0.87,1.49,2.27,2.83,2.88,3.49,3.28,4.07,4.3,4.76,4.9,5.11,5.47,5.33,5.5,5.02,4.86,5.12,4.6,4.61,3.01,3.26,3.01,3.07,2.92,2.01,1.7,3.03,3.95,3.25,3.04,3.11,3.21,3.28,3.14,2.57,2.55,2.26,2.59,2.5,2.5,2.99,3.07,3.21,3.12,3.07,3.52,5.45,5.47,4.95,4.99,4.16,3.71,3.91,3.65,3.68,3.62,3.66,3.19,3.24,3.43,3.71,3.56,3.59,3.63,3.78,3.77,3.88,3.88,3.7,3.58,3.59,3.67,3.8,3.73,3.7,3.87,3.82,3.74,3.74,3.62,3.77,3.9,3.93,4.05,4.08,4.13,4.15,4.16,4.54,4.63,4.69,5.06,5.08,5.11,5,5.02,5.04,5.01,5.19,5.15,4.96,4.68,4.58,4.13,4,4.24,4.28,4.32,4.34,4.76,4.95,5.46,5.95,6.29,6.8,6.98,6.99,6.95,6.56,6.03,5.48,5.66,5.57,5.66,6.24,6.38,6.43,6.58,6.8,6.74,7.13,7.62,7.69,7.77,7.6,7.76,7.81,7.78,7.6,7,6.78,6.34,5.94,5.7,5.51,5.39,5.01,4.4,4.44,4.68,4.06,3.16,3,3.03,3.37,3.68,3.79,4.06,3.47,3.24,3.21,3.36,3.45,3.57,3.64,3.73,3.5,3.46,3.5,3.62,3.57,3.68,3.65,3.9,3.99,4.46,4.9,5.18,5.48,5.74,6.18,6.5,6.53,6.43,6.35,6.22,6.07,6.51,7.64,8.63,8.75,9.1,9.11,8.94,8.31,7.49,7.12,6.4,6.26,6.33,6.85,6.87,6.99,7.44,7.87,8.41,8.16,8.52,8.64,8.59,8.79,9.07,8.99,8.94,8.98,9.07,9.13,9.11,9.01,8.59,8.14,8.04,7.65,7.54,7.58,7.05,7.07,7.14,7.14,7.1,7.24,7.26,7.17,7.13,7.3,7.73,8.19,8.2,8.26,8.66,8.8,9.17,9.85,10.36,10.46,10.85,10.82,10.92,10.82,10.84,10.78,11.24,11.45,11.64,13.61,13.62,13.66,13.5,13.55,15.24,15.15,11.58,10.38,10.06,10.49,10.95,11.91,13.7,17.01,16.86,16.83,16.44,17.35,18.43,18.83,20.29,20.82,19.35,17.96,15.07,14.41,14.34,14.58,15.07,14.98,15.18,16.33,15.25,13.7,12.73,11.21,10.72,9.8,9.58,9.23,9.17,9.12,9.25,9.17,9.24,9.29,9.24,9.24,9.48,9.71,9.73,9.82,10.53,10.59,11.29,12.11,12.73,12.13,12.02,11.42,10.5,9.84,9.5,11.27,10.4,9.77,9.51,9.33,9.06,8.95,8.75,8.53,8.85,9.24,10.55,11.55,10.19,8.72,8.33,8.59,8.26,8.33,8.35,8.3,8.24,8.24,7.24,7.28,6.8,8.08,8.19,8.29,8.97,8.99,9.35,7.84,8.31,8.41,8.37,8.32,8.53,8.87,8.92,9.19,9.29,9.98,10.33,10.29,10.76,10.94,11.18,11.61,12.14,12.37,12.17,12.08,12.11,12.16,12.23,12.17,12.21,12.22,12.34,13.16,13.26,13.55,13.67,13.58,13.23,12.67,12.4,12.36,12.01,11.47,10.48,9.72,9.67,9.241,8.812,8.65,8.656,8.534,8.339,7.79,7.406,7.422,7.04,7.25,7.239,6.719,6.081,5.596,5.17,4.821,7.371,6.055,8.566,7.111,6.562,5.843,5.113,5.345,4.848,4.539,4.156,4.74,4.648,4.383,4.09,3.856,3.632,3.85,5.388,5.818,6.335,6.672,5.794,5.354,5.291,5.374,5.789,7.181,7.979,7.768,8.217,7.917,7.394,6.721,6.623,6.338,6.456,5.929,5.816,5.541,5.119,5.18,5.025,4.726,4.645,4.695,4.425,4.033,3.962,3.193,2.69,2.799,2.841,2.858,3.186,3.138,3.005,2.861,3.321,3.13,3.099,3.628,3.574,4.46,4.183,4.571,4.565,4.825,4.75,4.882,4.926,4.876,4.936,4.744,4.815,4.697,4.658,4.835,4.749,4.601,4.42,4.622,4.636,4.834,4.687,4.85,4.815,4.93,5.076,5.051,5.277,5.449,5.751,5.551,5.625,5.622,5.564,5.619,5.736,5.557,5.142,4.804,4.604,4.41,4.401,4.242,4.029,3.805,3.039,2.54,2.207,1.996,1.966,2.07,2.343,2.41,2.622,2.738,2.849,2.996,2.826,2.805,2.734,2.669,2.813,2.861,3.142,3.241,3.197,3.127,2.808,2.7,2.597,2.651,2.714,2.59,2.26,2.133,1.99,1.944,2.018,2.042,2.084,2.14,2.412,2.583,2.556,2.477,2.437,2.464,2.546,2.461,2.451,2.473,2.581,2.758,2.813,3.025,3.304,3.395,3.49,3.712,3.788,3.974,4.175,4.3,4.157,4.129,4.165,4.169,4.177,4.161,4.156,4.184,4.173,4.168,4.286,4.418,4.562,4.009,4.105,3.968,3.92,3.862,3.455,3.239,2.025,2.702,2.727,2.691,2.417,2.518,1.877,2.215,1.835,0.945,0.927,0.801,0.416,0.247,0.197,0.243,0.241,0.238,0.222,0.232,0.228,0.202,0.179,0.17,0.289,0.401,0.427,0.579,0.641,0.692,0.893,0.915,0.982,0.998,0.986,0.967,0.918,0.979,0.959,0.915,0.934,0.932,0.868,0.865,0.886,0.826,0.877,0.941,0.926,1.042,1.006,0.902,0.972,1.034,1,1,0.988,0.98,0.934,0.96,0.978,0.993,0.999,1.024,1.013,0.995,0.986,0.915,0.939,0.888,0.891,0.866,0.88,0.939,0.915,0.928,0.946,0.936,0.918,0.878,0.895,0.912,0.592,0.467,0.528,0.647,0.665,0.576,0.427,0.376,0.413,0.393,0.442,0.497,0.481,0.462,0.462,0.541,0.551,0.494,0.504,0.512,0.533,0.504,0.509,0.473,0.456,0.48,0.513,0.548,0.529,0.683,0.74,0.742,1.009,0.895,0.872,1.05,1.196,1.171,1.086,1.2,1.3,1.247,1.442,1.509,1.546,1.734,1.713,1.665,1.627,1.682,1.652,1.666,1.687,1.661,1.645,1.638,1.624,1.662,1.652,1.671,1.642,1.638,0.233,0.272,0.255,0.209,0.165,0.149,0.136,0.086,0.109,0.115,0.056,0.073,0.096,0.101,0.109,0.142,0.18,0.178,0.146,0.146,0.129,0.174,0.517,0.618,0.773,1.376,1.477,2.105,2.696,3.318,3.652,4.172,4.133,4.303,4.458,4.564,4.407,4.45,4.563,4.932,5.034,5.157,5.145,5.161,5.042,5.037,5.031,4.981,4.999,4.94,4.872,4.659,4.409,4.205,3.979,3.643,3.481,3.14,2.962,2.838,2.645,2.653,2.644,2.688,2.694,2.661,2.433,2.328,2.218,2.192,2.194,2.191,2.312,2.286,2.323,2.284,2.29,2.289,2.387];
export const cashCpi=[14.2,14.1,14.1,14.1,14.1,14.3,14.4,14.5,14.4,14.5,14.6,14.6,14.6,14.6,14.6,14.7,14.7,14.8,14.8,14.9,15,15,15,14.9,15,15,15.1,15.1,15.1,15.1,15.1,15.1,15.3,15.3,15.3,15.3,15.3,15.3,15.2,15.2,15.3,15.1,15.3,15.3,15.5,15.5,15.5,15.5,15.5,15.5,15.4,15.5,15.5,15.5,15.5,15.5,15.5,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.8,15.8,15.9,15.9,16,15.9,16,16,16,16,16,16,16,16,16,16.2,16.3,16.2,16.2,16.3,16.3,16.3,16.3,16.3,16.4,16.4,16.4,16.5,16.5,16.5,16.5,16.5,16.6,16.6,16.6,16.6,16.7,16.7,16.9,16.9,16.9,16.9,16.9,17,17.1,17.1,17.2,17.3,17.4,17.4,17.5,17.5,17.6,17.6,17.6,17.6,17.7,17.7,17.7,17.8,17.9,18,18.1,18.2,18.3,18.3,18.3,18.3,18.4,18.5,18.5,18.6,18.6,18.6,18.7,18.9,19,19,19,19.2,19.2,19.2,19.2,19.3,19.6,19.6,19.7,19.8,19.9,19.9,19.9,19.9,20.1,20.2,20.2,20.2,20.3,20.3,20.3,20.5,20.5,20.4,20.4,20.4,20.3,20.4,20.5,20.5,20.7,20.7,20.8,21,21.2,21.1,21.2,21.2,21.3,21.4,21.5,21.6,21.7,21.7,21.7,22,22.2,22.3,22.3,22.3,22.4,22.6,22.8,22.8,23.1,23.2,23.4,23.7,24,24.1,24.2,24.4,24.5,24.7,24.9,25.2,25.4,25.9,26.1,26.3,26.6,26.8,27.1,27.3,27.6,27.6,27.9,28,28.2,28.5,28.8,29.2,29.5,29.6,29.8,30.1,30.2,30.3,30.5,30.6,30.7,30.9,31.1,31.3,31.3,31.5,31.7,31.8,31.9,32.2,32.4,32.8,33,33.4,33.5,33.9,33.9,34.2,34.5,34.7,34.9,35.1,35.4,35.7,35.8,36.3,36.6,37.1,37.2,37.1,37.6,37.8,37.9,38.1,38.6,39,39.3,39.7,39.9,40.2,40.3,40.7,41,41.4,41.6,41.8,42.3,42.6,42.9,43.4,43.9,44.2,44.7,45,45.4,46,46.2,46.9,47.4,48,48.3,48.7,49.5,49.9,50.3,50.7,51.2,51.6,51.8,52.2,52.8,53.5,53.8,54.5,55.1,55.4,55.6,55.9,56.3,56.6,56.6,56.5,56.8,57.4,57.4,57.5,58.1,58.4,58.7,58.7,59.1,59.1,59.2,59.6,59.9,60,60.2,60.2,60.6,60.8,60.8,60.9,61.1,61.4,61.4,61.7,62.1,62.2,62.5,62.7,63,63.3,63.3,63.4,63.6,63.8,64.1,64.4,64.7,64.9,64.9,65.3,65.4,65.9,66,66,66.4,66.7,66.8,67,67.3,67.5,67.9,68.3,68.5,68.9,69,69,69.2,69.5,69.6,69.7,70,70.4,70.6,71,71.2,71.6,71.7,71.8,72.2,72.3,72.3,72.7,73.2,73.6,73.8,74.6,74.9,75.4,75.5,75.6,75.9,76.1,76.1,76.7,77.2,77.5,77.5,77.9,78.2,78.5,78.6,78.8,79.5,80,79.9,82,82,82.3,82.3,82.7,83.1,83.2,83.3,83.1,83,83.3,82.9,83.3,83.3,83.6,83.7,83.8,84,84.2,84.2,84.2,84.3,84.7,84.7,85,85.3,85.2,85.2,85.4,85.4,85.6,85.7,85.7,85.9,86.3,86.1,86.1,85.4,85.4,85.4,85.2,85.4,85.7,85.8,85.9,85.7,86.2,86.3,86.6,87,87.2,87.5,87.7,87.7,87.9,87.7,87.8,87.7,88,87.8,88,88.1,88.5,88.7,89,89,89,89,89.1,89.3,89.7,89.7,89.9,90.1,90.2,90.2,90.3,90.5,90.5,90.6,90.6,90.6,90.5,90.4,90.9,91,91.1,91,91.3,91.4,91.4,91.4,91.2,91.6,91.6,91.3,91.5,91.6,92,92.5,92.7,92.9,93.1,93.3,93.6,93.7,93.6,93.7,93.5,94.1,94.8,94.5,94.9,95.5,95.8,95.7,96.1,96.3,96.6,96.7,96.3,96.8,97.1,97.8,98.6,98.7,98.4,98.4,98.6,98.1,97.2,97.4,97.6,98.2,98.9,99.5,99.7,99.9,100.5,100.9,100.9,101.2,101.5,101.1,102,102.8,103.1,102.4,102.5,102.5,102.6,102.9,103.1,102.8,103.1,103.2,103.3,103.5,103.9,104.1,105,105.1,105,104.8,105,105.2,105.6,105.4,105.3,105.7,106.3,106.6,106.7,106.9,107.1,107.5,108.4,107.9,107.7,107.6,108.2,108,108.6,109.2,109.7,109.5,109.6,109.8,109.2,109,109.2,109.4,109.4,110.2,111.1,111.6,112.1,111.9,112,111.7,111.9,111.6,111.9,112,111.8,112.2,112.6,113.5,114.6,115.4,115.8,115.6,115.7,114.5,114.1,113.3,113,113.8,114,113.9,114.7,115.1,114.7,114.7,114.7,114.6,115.2,114.8,115.1,115.6,115.6,116,116.3,116.2,116.8,116.7,116.9,117.4,117.5,117.5,117.8,118.1,119.4,119.8,120.6,119.8,120,120.3,120.6,120.8,120.9,120.2,120.7,121.2,121.7,122.2,122.1,121.6,121.5,121.8,122,122.2,121.9,121.2,121.3,122.7,122.9,122.7,123,123,123.1,123.1,123.3,123,123,122.7,123.1,124.1,124.8,125.2,125.8,125.9,125.7,125.7,125.8,125.9,125.4,124.5,124.3,125.4,126.3,126.2,126.9,127.2,127.3,127.3,127.1,127.2,127.1,126.5,126.8,127.1,127.9,128.3,128.8,129.1,128.9,128.7,128.8,129.1,128.6,128.4,129.5,129.7,129.9,130.4,130.5,130.4,130.4,130.5,130.8,130.9,131.3,130.8,131.7,132.5,132.9,133.3,133.4,133.6,134.3,134.2,133.7,134.1,133.5,133.4,133.6,134.5,135.4,136,136.6,136.3,137,136.8,136.2,136.6,136.4,136.4,136.8,137.4,136.6,135.7,136.1,137.2,137.2,137,136.9,137.5,137.7,137.4,138.2,138.9,139.6,140.3,141,141.4,142.3,142.6,142.9,143.9,144.2,144,145.3,146.8,148.9,149.8,151.9,152.9,153.1,152.6,152.7,153.8,154,153.1,153.9,154.5,155.3,156.4,157,157.2,158.1,158.7,158.5,158.6,158.8,158.3,158.3,158.8,159.8,160.6,161.5,161.4,162.1,161.8,161.1,161.8,161.8,161.2,161.3,163,163.5,163.4,164.3,164.4,164.9,164.8,164.9,165.3,165.4,165,165,165.9,167.4,168,169.6,169,169.9,169.8,170];
export const CASH_START=1956,CASH_MONTHS=cashTbill.length;

const label=t=>`${CASH_START+Math.floor(t/12)}-${String(t%12+1).padStart(2,'0')}`;
const xOf=t=>CASH_START+t/12;
const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(v,d=1)=>`${(v*100).toFixed(d)}%`;
const yrs=n=>`${n} year${n===1?'':'s'}`;
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const longLabel=t=>`${MONTHS[t%12]} ${CASH_START+Math.floor(t/12)}`;
export const TAX_ROWS=[0,20,30,40,50],HORIZONS=[1,5,10,20,30];

// Each month the balance earns one twelfth of that month's yield less the spread (never below zero), and tax at
// rate m is taken from the interest as it is earned, so the after-tax interest compounds. cum[t] is the log of the
// nominal growth factor from January 1956 to the start of month t.
const cumCache=new Map();
export function cumGrowth(m,spread){
  const key=`${m}|${spread}`;if(cumCache.has(key))return cumCache.get(key);
  const out=new Float64Array(CASH_MONTHS);for(let t=1;t<CASH_MONTHS;t++)out[t]=out[t-1]+Math.log1p(Math.max(0,cashTbill[t-1]-spread)/1200*(1-m));
  cumCache.set(key,out);return out;
}
// Nominal and CPI-adjusted growth of one dollar held from month-end s to month-end e.
export function growth(s,e,m,spread){const c=cumGrowth(m,spread),n=Math.exp(c[e]-c[s]);return {nominal:n,real:n*cashCpi[s]/cashCpi[e]};}
const annual=(r,months)=>r**(12/months)-1;
export const firstStart=input=>(input.crFrom-CASH_START)*12;

// Share of starting months (from the first year chosen) whose n-year real return met the target.
export function keptShare(input,mPct,n){
  const s0=firstStart(input),last=CASH_MONTHS-1-12*n;if(last<s0)return null;
  const need=(1+input.crTarget/100)**n;let ok=0;
  for(let s=s0;s<=last;s++)if(growth(s,s+12*n,mPct/100,input.crSpread).real>=need-1e-12)ok++;
  return {share:ok/(last-s0+1),count:last-s0+1};
}

export function rollingReal(input,mPct,n){
  const s0=firstStart(input),out=[];
  for(let s=s0;s+12*n<=CASH_MONTHS-1;s++)out.push({s,value:annual(growth(s,s+12*n,mPct/100,input.crSpread).real,12*n)});
  return out;
}

export function decadeRows(input){
  const s0=firstStart(input),e=CASH_MONTHS-1,m=input.crMarg/100,out=[];
  for(let d=Math.floor((CASH_START+s0/12)/10)*10;d<=2020;d+=10){
    const a=Math.max(s0,(d-CASH_START)*12),b=Math.min(e,(d+10-CASH_START)*12);if(b-a<12)continue;
    const g0=growth(a,b,0,input.crSpread),gm=growth(a,b,m,input.crSpread);
    const lbl=a===(d-CASH_START)*12&&b===(d+10-CASH_START)*12?`${d}s`:(Math.floor(a/12)===Math.floor((b-1)/12)?String(CASH_START+Math.floor(a/12)):`${CASH_START+Math.floor(a/12)}–${String(CASH_START+Math.floor((b-1)/12)).slice(2)}`);
    out.push({label:lbl,a,b,values:[annual(g0.nominal,b-a),annual(gm.nominal,b-a),annual(cashCpi[b]/cashCpi[a],b-a)]});
  }
  return out;
}

export function cashRealStats(input){
  const s=firstStart(input),e=CASH_MONTHS-1,m=input.crMarg/100,months=e-s;
  const tfsa=growth(s,e,0,input.crSpread),taxed=growth(s,e,m,input.crSpread);
  const n=input.crYears,rT=rollingReal(input,0,n),rM=rollingReal(input,input.crMarg,n);
  const worst=r=>r.length?r.reduce((x,y)=>y.value<x.value?y:x):null;
  return {s,e,months,tfsa,taxed,cpiRatio:cashCpi[e]/cashCpi[s],
    tfsaReal:annual(tfsa.real,months),taxedReal:annual(taxed.real,months),
    keptT:keptShare(input,0,n),keptM:keptShare(input,input.crMarg,n),worstT:worst(rT),worstM:worst(rM),rT,rM};
}

export function cashRealResult(kind,input){
  if(kind!=='cashReal')throw Error('Unknown cash-real topic');
  const st=cashRealStats(input),{s,e,tfsa,taxed}=st,A=input.crAmount,N=yrs(input.crYears),NY=`${input.crYears}-year`,M=input.crMarg;
  const src='https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1010012201',srcLabel='Calculated from Statistics Canada tables 10-10-0122-01 (treasury bills) and 18-10-0004-01 (CPI)';
  const ev='Official yields and CPI · hypothetical tax rate, spread and amount';
  const sp=input.crSpread?`, ${input.crSpread} percentage points below the treasury bill yield,`:'';
  const ticks=[1960,1970,1980,1990,2000,2010,2020].filter(v=>v>=xOf(s)&&v<=xOf(e)).map(v=>({value:v,label:String(v)}));
  const step=Math.max(1,Math.ceil((e-s)/160)),idx=[];for(let t=s;t<=e;t+=step)idx.push(t);if(idx[idx.length-1]!==e)idx.push(e);
  const real=(t,mm)=>A*growth(s,t,mm,input.crSpread).real;
  const decs=decadeRows(input);
  // When the chosen period does not fit after the first year, the rolling chart uses the longest one that does.
  const nR=st.rT.length?input.crYears:Math.floor(st.months/12),NR=`${nR}-year`,rT=st.rT.length?st.rT:rollingReal(input,0,nR),rM=st.rT.length?st.rM:rollingReal(input,input.crMarg,nR);
  const wT=rT.reduce((x,y)=>y.value<x.value?y:x),wM=rM.reduce((x,y)=>y.value<x.value?y:x);
  const rs=rT.length,rstep=Math.max(1,Math.ceil(rs/160)),rpick=(r,i,a)=>i%rstep===0||i===a.length-1;
  const grid=TAX_ROWS.map(r=>({label:r?`${r}% tax`:'No tax (TFSA)',values:HORIZONS.map(n=>keptShare(input,r,n)?.share??null)}));
  const tgt=input.crTarget?`a real return of at least ${input.crTarget}% a year`:'at least the purchasing power it started with';
  const metrics=[
    [`Months held (${label(s)} to ${label(e)})`,st.months,'integer'],
    ['Prices rose by a factor of (CPI)',st.cpiRatio,'decimal'],
    [`In a TFSA: ${money(A)} became (dollars of the day)`,A*tfsa.nominal,'money'],
    [`In a TFSA: worth in ${longLabel(s)} dollars`,A*tfsa.real,'money'],
    [`Taxed at ${M}%: worth in ${longLabel(s)} dollars`,A*taxed.real,'money'],
    [`Cash earning nothing: worth in ${longLabel(s)} dollars`,A/st.cpiRatio,'money'],
    ['In a TFSA: real return a year',st.tfsaReal,'percent'],
    [`Taxed at ${M}%: real return a year`,st.taxedReal,'percent'],
    [`In a TFSA: share of ${NY} periods that kept up`,st.keptT?.share??null,'percent'],
    [`Taxed at ${M}%: share of ${NY} periods that kept up`,st.keptM?.share??null,'percent'],
    [`Taxed at ${M}%: worst ${NY} real return a year`,st.worstM?.value??null,'percent']
  ];
  const note=`From ${label(s)} to ${label(e)}, ${money(A)} rolled over in 3-month treasury bills${sp} grew to ${money(A*tfsa.nominal)} inside a TFSA and to ${money(A*taxed.nominal)} with interest taxed at ${M}%. Prices rose ${st.cpiRatio.toFixed(2)} times, so in ${longLabel(s)} dollars those balances are worth ${money(A*tfsa.real)} and ${money(A*taxed.real)} (${pct(st.tfsaReal,2)} and ${pct(st.taxedReal,2)} a year after inflation); the same cash earning nothing would be worth ${money(A/st.cpiRatio)}. ${st.keptM?`Across ${st.keptM.count} rolling ${NY} periods, cash kept ${tgt} in ${pct(st.keptT.share,0)} of them in a TFSA and ${pct(st.keptM.share,0)} at a ${M}% tax rate.`:`No complete ${NY} period fits after ${label(s)}; choose an earlier first year or a shorter period.`} Treasury bill yields are auction averages, not the rate on any savings account, and the past range is not a forecast.`;
  return {metrics,note,charts:[
    {id:'cash-real-path',type:'line',evidence:ev,title:`What ${money(A)} held in cash could buy, in ${longLabel(s)} dollars`,unit:'money',xLabel:'Month-end',xMin:xOf(s),xTicks:ticks,series:[
      {name:'Treasury bills in a TFSA',rows:idx.map(t=>({x:xOf(t),label:label(t),value:real(t,0)}))},
      {name:`Treasury bills taxed at ${M}%`,rows:idx.map(t=>({x:xOf(t),label:label(t),value:real(t,M/100)}))},
      {name:'Cash earning nothing',dash:true,rows:idx.map(t=>({x:xOf(t),label:label(t),value:A*cashCpi[s]/cashCpi[t]}))}],
      source:src,sourceLabel:srcLabel,note:`Each balance is divided by the rise in the all-items CPI since ${longLabel(s)}, so a flat line means the cash bought the same basket throughout. Interest${sp} is added monthly; in the taxable line ${M}% of it is paid as tax when earned. Ending values: ${money(A*tfsa.real)}, ${money(A*taxed.real)} and ${money(A/st.cpiRatio)}. ${step>1?`Every ${step}th month is plotted; the table has the same points.`:'Every month-end is plotted.'}`},
    {id:'cash-real-decades',type:'groupbar',evidence:ev,title:'Treasury bill yield before and after tax against inflation, by decade',unit:'percent',rowLabel:'Period',seriesNames:['Treasury bill yield (compounded)',`After ${M}% tax`,'CPI inflation'],rows:decs.map(r=>({label:r.label,values:r.values})),source:src,sourceLabel:srcLabel,note:`Annualised over each period from ${longLabel(decs[0]?.a??s)}${input.crSpread?`, with the yield reduced by ${input.crSpread} points`:''}. Where the after-tax bar is shorter than the inflation bar, taxed cash lost purchasing power over that decade even if the pre-tax yield was higher than inflation. A partial first or last period is labelled with its years.`},
    {id:'cash-real-rolling',type:'line',evidence:ev,title:`Real return a year over every ${NR} period, by starting month`,unit:'percent',xLabel:'Starting month',xMin:xOf(s),xTicks:ticks.filter(t=>t.value<=xOf(rT[rT.length-1].s)),series:[
      {name:'In a TFSA',rows:rT.filter(rpick).map(r=>({x:xOf(r.s),label:label(r.s),value:r.value}))},
      {name:`Taxed at ${M}%`,rows:rM.filter(rpick).map(r=>({x:xOf(r.s),label:label(r.s),value:r.value}))},
      {name:input.crTarget?`Target: ${input.crTarget}% a year`:'Level: purchasing power kept',dash:true,rows:rT.filter(rpick).map(r=>({x:xOf(r.s),label:label(r.s),value:input.crTarget/100}))}],
      source:src,sourceLabel:srcLabel,note:`${st.rT.length?'':`No complete ${NY} period fits after ${label(s)}, so this chart uses ${yrs(nR)}. `}Each point starts at that month-end and holds for ${yrs(nR)}. The worst start in a TFSA was ${label(wT.s)} (${pct(wT.value,2)} a year); taxed at ${M}%, ${label(wM.s)} (${pct(wM.value,2)} a year). ${rstep>1?`Every ${rstep}th start is plotted.`:''}`},
    {id:'cash-real-kept',type:'heatmap',evidence:ev,title:'Share of rolling periods in which cash kept up with inflation, by tax rate and length',unit:'percent',rowLabel:'Tax on interest',columns:HORIZONS.map(n=>yrs(n)),rows:grid,unavailableLabel:'No periods',source:src,sourceLabel:srcLabel,note:`Each cell starts at every month-end from ${longLabel(s)} that has the full period after it and counts how often the balance kept ${tgt}${input.crSpread?`, with the yield ${input.crSpread} points lower`:''}. Overlapping periods share most of their months, so the shares rest on far fewer independent outcomes than the counts suggest.`}
  ]};
}
