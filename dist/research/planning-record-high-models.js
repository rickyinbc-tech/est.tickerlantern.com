export const recordHighDefinitions={
  recordHigh:{title:'Buying at a record high: what followed record months on the S&P/TSX, 1956 to 2023',fields:[
    ['rhYears','Holding period to look at (years)',5,1,10,1],
    ['rhFrom','First year in which months are counted (1957–2013)',1957,1957,2013,1],
    ['rhNear','Counts as a record if within this % of the earlier peak',0,0,10,.5],
    ['rhYield','Assumed dividend yield added to the price change (% a year)',2.5,0,6,.1],
    ['rhFee','Annual fund fee taken from that return (%)',.5,0,3,.05],
    ['rhCash','Cash or GIC return to compare with (% a year)',3,0,10,.25],
    ['rhAmount','Lump sum for the dollar illustration (CAD)',10000,500,5000000,500]
  ]}
};
export const recordHighWholeKeys=['rhYears','rhFrom'];

// Statistics Canada table 10-10-0125-01, S&P/TSX Composite Index, monthly close, vector v122620, retrieved
// 27 October 2026 through the Web Data Service: 813 values from January 1956 to September 2023, the last month
// the series holds. Price index only: dividends are not included.
export const tsxClose=[525.63,545.15,588.91,583.61,560.09,575.39,617.67,603.75,566.99,554.02,524.63,564.97,568.14,545.24,563.76,589.32,606.14,592.74,577.34,520.16,483.3,447.81,458.28,432.11,448.97,444.1,457.38,454.02,472.88,484.63,508.17,514.82,531.72,537.39,539.95,547.72,562.52,566.64,562.67,567.91,568.99,573.36,598.96,568.5,541.36,541.19,538.37,555.09,529.8,512.23,512.05,503.08,517.97,505.11,494.06,526.47,500.33,500.2,519.43,544.74,575.6,594.4,605.61,633.44,646.09,650.67,662.35,672.44,661.6,665.52,685.69,700.85,682.83,686.81,686.01,667.55,612.41,572.46,586.08,600.28,571.84,580.7,626.17,628.99,659.89,638.45,657.52,689.22,700.41,674.43,656.32,660.72,680.62,686.03,679.15,702.71,721.44,715.36,743.19,770.46,797.14,795.63,813.76,808.84,843.59,846.66,850.1,853.53,901.4,897.45,889.54,911.26,909.11,847.1,838.42,858.92,873.38,888.86,863.75,881.14,917.75,895.21,883.03,891.22,861.74,856.94,842.77,780.38,761.11,775.89,770.76,789.51,843.44,851.43,879.95,898.15,864.58,886.91,915.45,904.64,922.5,868.65,890.69,899.2,873.62,835.33,814.79,887.47,879.08,925.39,920.14,943.95,989.11,1003.97,1041.56,1062.88,1090.82,1039.02,1072.16,1102.46,1131.04,1008.55,950.75,998.53,991.79,1005.69,1031.26,1019.77,980.23,1006.4,1006.06,917.72,828.21,810.78,847.78,869.99,909.19,883.67,922.19,947.54,975.13,974.5,1000.73,1017,973.05,986.85,983.49,976.33,961.97,881.41,885.54,990.54,1078.92,1114.89,1087.72,1099.12,1129.41,1104.29,1129.86,1189.29,1167.44,1136.74,1186.74,1226.58,1246.82,1250.03,1239.14,1198.19,1153.39,1149,1226.4,1196,1250.38,1319.26,1182.57,1187.78,1196.44,1241.78,1214.88,1099.92,1031.74,1009.23,1056.96,919.88,847.19,895.71,850.4,835.42,979.6,1006.33,989.6,1008.53,1030.7,1055.29,1051.67,1038.9,976.37,930.93,980.81,953.54,1039.43,1074.38,1054.09,1075.02,1075.92,1055.55,1050.07,1048.3,1028.8,989.55,920.1,1011.52,996.6,1008.92,1022.11,994.79,981.19,1031.24,1033.53,1003.3,1000.07,970.53,1017.48,1059.59,998.44,1005.68,1063.26,1081.5,1128.76,1126.16,1193.79,1232.21,1284.66,1215.84,1269.8,1309,1355.4,1385.36,1466.37,1484.31,1519.67,1618.41,1558.1,1695.3,1751.89,1579.27,1699.62,1813.17,2027.7,2192.58,1797.58,1869.93,1971.73,2061.35,2197.38,2218.01,2260.04,2240.15,2402.23,2268.7,2226.66,2179.52,2333.08,2306.43,2371.22,2361.13,2253.9,2176.71,1883.42,1842.62,2012.09,1954.24,1786.91,1671.34,1587.83,1548.17,1523.68,1366.8,1411.9,1613.32,1602.01,1774.04,1838.31,1958.08,2031.47,2090.37,2156.06,2340.81,2420.65,2446.97,2477.62,2483.09,2499.58,2361.08,2540.89,2552.35,2468.88,2419.83,2382.1,2323.34,2229.75,2220.94,2139.99,2388.81,2392.65,2353.26,2368.54,2400.33,2595.05,2594.98,2612.81,2635.31,2736.31,2712.5,2778.6,2819.98,2632.25,2674.84,2857.18,2900.6,2842.96,2855.83,3047.26,3078.89,3121.97,3085.5,2935.33,3028.2,2979.3,3038.89,3046.8,3066.18,3348.85,3498.93,3739.47,3716.74,3685.24,3740.19,4030.35,3993.6,3902.37,3019.27,2978.34,3160.05,3057.22,3204.83,3313.79,3339.77,3249.22,3441.48,3376.73,3285.82,3283.71,3395.52,3294.68,3389.99,3616.64,3572.12,3578.22,3627.85,3707.44,3760.91,3970.8,4010.2,3943.1,3918.7,3942.8,3969.79,3704.5,3686.8,3639.6,3341,3581.99,3544,3561.2,3346.3,3159.4,3081.26,3151.1,3256.8,3273,3462.37,3495.7,3468.9,3546.2,3465.82,3539.64,3517.89,3387.88,3515.76,3448.51,3512.36,3596.12,3581.94,3412.14,3355.56,3387.93,3387.7,3443.42,3402.92,3297.88,3336.12,3282.83,3350.44,3305.47,3451.69,3602.44,3789.41,3882.68,3966.37,3967.23,4137.55,3990.61,4255.54,4180.21,4321.43,4554.85,4423.84,4329.62,4267.12,4326.77,4025.25,4178.97,4349.5,4354.18,4291.65,4093.41,4213.61,4017.48,4124.81,4313.61,4279.47,4448.64,4527.15,4615.05,4516.7,4529.75,4459.16,4661.18,4713.54,4968.43,4933.72,4970.83,5146.47,5246.4,5044.07,4929.15,5143.43,5291.07,5598.82,6016.67,5927.03,6109.58,6157.84,5850.22,5976.63,6382.12,6437.74,6877.68,6611.79,7040.23,6842.36,6512.78,6699.44,6700.2,7092.49,7558.5,7664.99,7589.78,7366.89,6931.43,5530.71,5614.12,6208.28,6343.87,6485.94,6729.56,6312.69,6597.79,7014.7,6841.8,7010.07,7081.03,6970.81,6957.72,7256.22,7523.23,8413.75,8481.11,9128.99,9462.39,9347.61,9251.99,10195.45,10406.31,11247.91,10377.92,9639.57,8819.92,8933.68,9321.87,8078.72,7608,7946.63,8161.87,7736.35,7689.69,7399.22,6838.56,6885.7,7425.65,7688.41,7648.49,7637.5,7851.47,7663.39,7656.13,7145.61,6605.42,6611.95,6180.42,6248.79,6570.42,6614.54,6569.49,6555.12,6343.29,6586.07,6859.8,6983.14,7257.92,7510.32,7421.13,7772.7,7859.39,8220.89,8521.39,8788.49,8585.93,8243.97,8417.32,8545.58,8458.07,8377.03,8668.29,8870.97,9030.05,9246.65,9204.05,9668.32,9612.38,9369.3,9607.3,9902.77,10422.93,10668.94,11011.83,10383.32,10824.14,11272.26,11945.64,11688.34,12110.61,12204.17,11744.52,11612.87,11830.96,12073.75,11761.27,12344.59,12752.38,12908.39,13034.12,13045.02,13165.5,13416.68,14056.78,13906.57,13868.63,13660.48,14098.89,14625,13689.12,13833.06,13155.1,13582.69,13350.13,13937.04,14714.73,14467.03,13592.91,13771.25,11752.9,9762.76,9270.62,8987.7,8694.9,8123.02,8720.39,9324.83,10370.07,10374.91,10787.15,10868.21,11394.96,10910.75,11447.2,11746.11,11094.31,11629.63,12037.73,12210.7,11762.99,11294.42,11713.43,11913.86,12368.65,12676.24,12952.88,13443.22,13551.99,14136.5,14116.1,13944.79,13802.88,13300.87,12945.63,12768.7,11623.84,12252.06,12204.11,11955.09,12452.15,12644.01,12392.18,12292.69,11513.21,11596.56,11664.71,11949.26,12317.46,12422.91,12239.36,12433.53,12685.24,12821.83,12749.9,12456.5,12650.42,12129.11,12486.64,12653.9,12787.2,13361.26,13395.4,13621.55,13694.94,14209.59,14335.31,14651.87,14604.16,15146.01,15330.74,15625.73,14960.51,14613.32,14744.7,14632.44,14673.48,15234.34,14902.44,15224.52,15014.09,14553.33,14468.44,13859.12,13306.96,13529.17,13469.83,13009.95,12822.13,12860.35,13494.36,13951.45,14065.78,14064.54,14582.74,14597.95,14725.86,14787.27,15082.85,15287.59,15385.96,15399.24,15547.75,15586.13,15349.91,15182.19,15143.87,15211.87,15634.94,16025.59,16067.48,16209.13,15951.67,15442.68,15367.29,15607.88,16061.5,16277.73,16434.01,16262.88,16073.14,15027.28,15197.82,14322.86,15540.6,15999.01,16102.09,16580.73,16037.49,16382.2,16406.56,16442.07,16658.63,16483.16,17040.2,17063.43,17318.49,16263.05,13378.75,14780.74,15192.83,15515.22,16169.2,16514.44,16121.38,15580.64,17190.25,17433.36,17337.02,18060.26,18700.67,19108.33,19730.99,20165.58,20287.8,20582.94,20070.25,21037.07,20659.99,21222.84,21098.29,21126.36,21890.16,20762,20729.34,18861.36,19692.92,19330.81,18444.22,19426.14,20453.26,19384.92,20767.38,20221.19,20099.89,20636.54,19572.24,20155.29,20626.64,20292.62,19541.27];
// Statistics Canada table 18-10-0004-01, all-items CPI (2002=100), vector v41690973, for the same 813 months.
export const cpiMonthly=[14.2,14.1,14.1,14.1,14.1,14.3,14.4,14.5,14.4,14.5,14.6,14.6,14.6,14.6,14.6,14.7,14.7,14.8,14.8,14.9,15,15,15,14.9,15,15,15.1,15.1,15.1,15.1,15.1,15.1,15.3,15.3,15.3,15.3,15.3,15.3,15.2,15.2,15.3,15.1,15.3,15.3,15.5,15.5,15.5,15.5,15.5,15.5,15.4,15.5,15.5,15.5,15.5,15.5,15.5,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.7,15.8,15.8,15.9,15.9,16,15.9,16,16,16,16,16,16,16,16,16,16.2,16.3,16.2,16.2,16.3,16.3,16.3,16.3,16.3,16.4,16.4,16.4,16.5,16.5,16.5,16.5,16.5,16.6,16.6,16.6,16.6,16.7,16.7,16.9,16.9,16.9,16.9,16.9,17,17.1,17.1,17.2,17.3,17.4,17.4,17.5,17.5,17.6,17.6,17.6,17.6,17.7,17.7,17.7,17.8,17.9,18,18.1,18.2,18.3,18.3,18.3,18.3,18.4,18.5,18.5,18.6,18.6,18.6,18.7,18.9,19,19,19,19.2,19.2,19.2,19.2,19.3,19.6,19.6,19.7,19.8,19.9,19.9,19.9,19.9,20.1,20.2,20.2,20.2,20.3,20.3,20.3,20.5,20.5,20.4,20.4,20.4,20.3,20.4,20.5,20.5,20.7,20.7,20.8,21,21.2,21.1,21.2,21.2,21.3,21.4,21.5,21.6,21.7,21.7,21.7,22,22.2,22.3,22.3,22.3,22.4,22.6,22.8,22.8,23.1,23.2,23.4,23.7,24,24.1,24.2,24.4,24.5,24.7,24.9,25.2,25.4,25.9,26.1,26.3,26.6,26.8,27.1,27.3,27.6,27.6,27.9,28,28.2,28.5,28.8,29.2,29.5,29.6,29.8,30.1,30.2,30.3,30.5,30.6,30.7,30.9,31.1,31.3,31.3,31.5,31.7,31.8,31.9,32.2,32.4,32.8,33,33.4,33.5,33.9,33.9,34.2,34.5,34.7,34.9,35.1,35.4,35.7,35.8,36.3,36.6,37.1,37.2,37.1,37.6,37.8,37.9,38.1,38.6,39,39.3,39.7,39.9,40.2,40.3,40.7,41,41.4,41.6,41.8,42.3,42.6,42.9,43.4,43.9,44.2,44.7,45,45.4,46,46.2,46.9,47.4,48,48.3,48.7,49.5,49.9,50.3,50.7,51.2,51.6,51.8,52.2,52.8,53.5,53.8,54.5,55.1,55.4,55.6,55.9,56.3,56.6,56.6,56.5,56.8,57.4,57.4,57.5,58.1,58.4,58.7,58.7,59.1,59.1,59.2,59.6,59.9,60,60.2,60.2,60.6,60.8,60.8,60.9,61.1,61.4,61.4,61.7,62.1,62.2,62.5,62.7,63,63.3,63.3,63.4,63.6,63.8,64.1,64.4,64.7,64.9,64.9,65.3,65.4,65.9,66,66,66.4,66.7,66.8,67,67.3,67.5,67.9,68.3,68.5,68.9,69,69,69.2,69.5,69.6,69.7,70,70.4,70.6,71,71.2,71.6,71.7,71.8,72.2,72.3,72.3,72.7,73.2,73.6,73.8,74.6,74.9,75.4,75.5,75.6,75.9,76.1,76.1,76.7,77.2,77.5,77.5,77.9,78.2,78.5,78.6,78.8,79.5,80,79.9,82,82,82.3,82.3,82.7,83.1,83.2,83.3,83.1,83,83.3,82.9,83.3,83.3,83.6,83.7,83.8,84,84.2,84.2,84.2,84.3,84.7,84.7,85,85.3,85.2,85.2,85.4,85.4,85.6,85.7,85.7,85.9,86.3,86.1,86.1,85.4,85.4,85.4,85.2,85.4,85.7,85.8,85.9,85.7,86.2,86.3,86.6,87,87.2,87.5,87.7,87.7,87.9,87.7,87.8,87.7,88,87.8,88,88.1,88.5,88.7,89,89,89,89,89.1,89.3,89.7,89.7,89.9,90.1,90.2,90.2,90.3,90.5,90.5,90.6,90.6,90.6,90.5,90.4,90.9,91,91.1,91,91.3,91.4,91.4,91.4,91.2,91.6,91.6,91.3,91.5,91.6,92,92.5,92.7,92.9,93.1,93.3,93.6,93.7,93.6,93.7,93.5,94.1,94.8,94.5,94.9,95.5,95.8,95.7,96.1,96.3,96.6,96.7,96.3,96.8,97.1,97.8,98.6,98.7,98.4,98.4,98.6,98.1,97.2,97.4,97.6,98.2,98.9,99.5,99.7,99.9,100.5,100.9,100.9,101.2,101.5,101.1,102,102.8,103.1,102.4,102.5,102.5,102.6,102.9,103.1,102.8,103.1,103.2,103.3,103.5,103.9,104.1,105,105.1,105,104.8,105,105.2,105.6,105.4,105.3,105.7,106.3,106.6,106.7,106.9,107.1,107.5,108.4,107.9,107.7,107.6,108.2,108,108.6,109.2,109.7,109.5,109.6,109.8,109.2,109,109.2,109.4,109.4,110.2,111.1,111.6,112.1,111.9,112,111.7,111.9,111.6,111.9,112,111.8,112.2,112.6,113.5,114.6,115.4,115.8,115.6,115.7,114.5,114.1,113.3,113,113.8,114,113.9,114.7,115.1,114.7,114.7,114.7,114.6,115.2,114.8,115.1,115.6,115.6,116,116.3,116.2,116.8,116.7,116.9,117.4,117.5,117.5,117.8,118.1,119.4,119.8,120.6,119.8,120,120.3,120.6,120.8,120.9,120.2,120.7,121.2,121.7,122.2,122.1,121.6,121.5,121.8,122,122.2,121.9,121.2,121.3,122.7,122.9,122.7,123,123,123.1,123.1,123.3,123,123,122.7,123.1,124.1,124.8,125.2,125.8,125.9,125.7,125.7,125.8,125.9,125.4,124.5,124.3,125.4,126.3,126.2,126.9,127.2,127.3,127.3,127.1,127.2,127.1,126.5,126.8,127.1,127.9,128.3,128.8,129.1,128.9,128.7,128.8,129.1,128.6,128.4,129.5,129.7,129.9,130.4,130.5,130.4,130.4,130.5,130.8,130.9,131.3,130.8,131.7,132.5,132.9,133.3,133.4,133.6,134.3,134.2,133.7,134.1,133.5,133.4,133.6,134.5,135.4,136,136.6,136.3,137,136.8,136.2,136.6,136.4,136.4,136.8,137.4,136.6,135.7,136.1,137.2,137.2,137,136.9,137.5,137.7,137.4,138.2,138.9,139.6,140.3,141,141.4,142.3,142.6,142.9,143.9,144.2,144,145.3,146.8,148.9,149.8,151.9,152.9,153.1,152.6,152.7,153.8,154,153.1,153.9,154.5,155.3,156.4,157,157.2,158.1,158.7,158.5];
export const TSX_START=1956,TSX_MONTHS=tsxClose.length;
const label=i=>`${TSX_START+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`;
const xOf=i=>TSX_START+i/12;
export const monthLabel=label;

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(v,d=1)=>`${(v*100).toFixed(d)}%`;
const median=v=>{const s=[...v].sort((a,b)=>a-b),k=s.length>>1;return s.length%2?s[k]:(s[k-1]+s[k])/2;};

// Running peak from January 1956 and the distance below it at each month-end close.
export function drawdowns(){
  let peak=0;
  return tsxClose.map((v,i)=>{const record=v>=peak;if(record)peak=v;return {i,close:v,peak,dd:v/peak-1,record};});
}

// Spells between one record close and the next: months taken to close above the old peak and the deepest fall.
export function underwaterSpells(){
  const d=drawdowns(),out=[];let last=0;
  for(let i=1;i<=d.length;i++){
    if(i===d.length||d[i].record){
      if(i-last>1){let lo=last;for(let j=last;j<i;j++)if(d[j].close<d[lo].close)lo=j;out.push({peak:last,trough:lo,regained:i<d.length?i:null,months:i-last,fall:d[lo].close/d[last].close-1});}
      last=i;
    }
  }
  return out;
}

export const stateBuckets=near=>[
  {label:near?`At or within ${near}% of a record`:'At a record close',test:dd=>dd>=-near/100-1e-12},
  {label:`Up to 10% below the peak`,test:dd=>dd<-near/100-1e-12&&dd>-.1},
  {label:'10% to 20% below',test:dd=>dd<=-.1&&dd>-.2},
  {label:'More than 20% below',test:dd=>dd<=-.2}
];

// Price change and CPI-adjusted change over h years from every month counted.
export function forward(input,years=input.rhYears){
  const h=years*12,d=drawdowns(),near=input.rhNear/100,first=(input.rhFrom-TSX_START)*12,rows=[];
  for(let i=Math.max(0,first);i+h<TSX_MONTHS;i++){
    const price=tsxClose[i+h]/tsxClose[i]-1,cpi=cpiMonthly[i+h]/cpiMonthly[i];
    rows.push({i,dd:d[i].dd,atRecord:d[i].dd>=-near-1e-12,price,real:(1+price)/cpi-1});
  }
  return rows;
}

// Price ratio plus an assumed constant yield less the fee, compared with cash compounded at a constant rate.
export const fundRatio=(price,input,years)=>(1+price)*(1+(input.rhYield-input.rhFee)/100)**years;
export const beatCash=(price,input,years)=>fundRatio(price,input,years)>=(1+input.rhCash/100)**years-1e-12;

export function recordHighStats(input){
  const n=input.rhYears,f=forward(input),rec=f.filter(r=>r.atRecord),oth=f.filter(r=>!r.atRecord);
  const share=(a,t)=>a.length?a.filter(t).length/a.length:null,med=a=>a.length?median(a.map(r=>r.price)):null;
  const counted=drawdowns().filter(r=>r.i>=(input.rhFrom-TSX_START)*12);
  return {f,rec,oth,counted:counted.length,recordMonths:counted.filter(r=>r.dd>=-input.rhNear/100-1e-12).length,
    medRec:med(rec),medOth:med(oth),lowerRec:share(rec,r=>r.price<0),lowerOth:share(oth,r=>r.price<0),
    medRealRec:rec.length?median(rec.map(r=>r.real)):null,realLowerRec:share(rec,r=>r.real<0),
    cashRec:share(rec,r=>beatCash(r.price,input,n)),cashOth:share(oth,r=>beatCash(r.price,input,n)),
    worstRec:rec.length?rec.reduce((a,b)=>b.price<a.price?b:a):null};
}

export function recordHighResult(kind,input){
  if(kind!=='recordHigh')throw Error('Unknown record-high topic');
  const n=input.rhYears,yrs=`${n} year${n===1?'':'s'}`,st=recordHighStats(input),d=drawdowns(),spells=underwaterSpells();
  const deep=[...spells].sort((a,b)=>a.fall-b.fall)[0],long=[...spells].sort((a,b)=>b.months-a.months||a.peak-b.peak)[0];
  const lastCpi=cpiMonthly[TSX_MONTHS-1],q=d.filter(r=>r.i%3===2);
  const levelChart={id:'record-high-level',type:'line',evidence:'Official statistics',title:'S&P/TSX Composite close at each quarter-end, as published and in September 2023 prices',unit:'number',xLabel:'Quarter-end',xMin:TSX_START,xTicks:[1960,1980,2000,2020].map(v=>({value:v,label:String(v)})),series:[{name:'Index close as published',rows:q.map(r=>({x:xOf(r.i),label:label(r.i),value:r.close}))},{name:'Adjusted by CPI to September 2023 prices',dash:true,rows:q.map(r=>({x:xOf(r.i),label:label(r.i),value:r.close*lastCpi/cpiMonthly[r.i]}))}],source:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1010012501',sourceLabel:'Statistics Canada table 10-10-0125-01 (index) and 18-10-0004-01 (CPI)',note:`The index rose from 525.63 in January 1956 to 19,541.27 in September 2023, the last month Statistics Canada’s series holds; its highest month-end close was 21,890.16 in March 2022. Quarter-end months are plotted; the second chart uses every month. It is a price index, so the dividends that index funds receive are not in these numbers. The dashed line restates each close in September 2023 prices using the CPI: in those terms January 1956 stood at about ${Math.round(525.63*lastCpi/cpiMonthly[0]).toLocaleString('en-CA')}.`};
  if(!st.rec.length)return {metrics:[['Record months with a full holding period after them',0,'number']],note:`No month from ${input.rhFrom} onward with a full ${yrs} of data after it counts as a record under these settings. Choose an earlier first year or a shorter holding period.`,charts:[levelChart]};
  const hz=[1,3,5,10],near=input.rhNear;
  const grp=hz.map(h=>{const f=forward(input,h),r=f.filter(x=>x.atRecord),o=f.filter(x=>!x.atRecord);return {label:`${h} year${h===1?'':'s'} later`,values:[r.length?median(r.map(x=>x.price)):0,o.length?median(o.map(x=>x.price)):0],nr:r.length,no:o.length};});
  const buckets=stateBuckets(near);
  const grid=buckets.map(b=>({label:b.label,values:hz.map(h=>{const f=forward(input,h).filter(r=>b.test(r.dd));return f.length?f.filter(r=>beatCash(r.price,input,h)).length/f.length:null;})}));
  const def=near?`within ${near}% of the highest earlier close`:'at or above every earlier close';
  const lump=input.rhAmount*fundRatio(st.medRec,input,n);
  return {metrics:[
    [`Months from ${input.rhFrom} to September 2023 that closed ${def}`,st.recordMonths,'number'],
    [`Share of all ${st.counted} months counted`,st.recordMonths/st.counted,'percent'],
    [`Median price change ${yrs} after a record month`,st.medRec,'percent'],
    [`Median price change ${yrs} after any other month`,st.medOth,'percent'],
    [`Record months followed by a lower index ${yrs} later`,st.lowerRec,'percent'],
    [`Other months followed by a lower index ${yrs} later`,st.lowerOth,'percent'],
    [`Record months in which the fund assumption beat ${input.rhCash}% cash over ${yrs}`,st.cashRec,'percent'],
    [`${money(input.rhAmount)} after ${yrs} at the median record-month outcome, with yield less fee`,lump,'money']
  ],
  note:`Of the ${st.counted} month-end closes from ${input.rhFrom} to September 2023, ${st.recordMonths} (${pct(st.recordMonths/st.counted,0)}) were ${def}. Over the next ${yrs}, the index price was higher after ${pct(1-st.lowerRec,0)} of record months and after ${pct(1-st.lowerOth,0)} of other months; the median change was ${pct(st.medRec)} after records and ${pct(st.medOth)} otherwise. So in this history a record was not a reliable sign of a fall, but later gains were smaller on average than after months spent below a peak. Adding a ${input.rhYield}% yield and removing a ${input.rhFee}% fee, a fund bought in a record month beat ${input.rhCash}% cash over ${yrs} ${pct(st.cashRec,0)} of the time. Months overlap and the record covers one market; none of this is a forecast.`,
  charts:[
    levelChart,
    {id:'record-high-drawdown',type:'line',evidence:'Derived from official statistics',title:'How far each month-end close sat below the highest close before it',unit:'percent',xLabel:'Month-end',xMin:TSX_START,yMin:-.5,yMax:0,xTicks:[1960,1980,2000,2020].map(v=>({value:v,label:String(v)})),series:[{name:'Distance below the running peak',rows:d.map(r=>({x:xOf(r.i),label:label(r.i),value:r.dd}))}],source:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1010012501',sourceLabel:'Calculated from Statistics Canada table 10-10-0125-01',note:`Zero marks a record close. The deepest fall was ${pct(-deep.fall)} from ${label(deep.peak)} to ${label(deep.trough)}, regained in ${deep.regained==null?'no month in the data':label(deep.regained)}. The longest wait to close above an old peak was ${long.months} months (${label(long.peak)} to ${label(long.regained)}); ${spells.filter(s=>s.fall<=-.2).length} spells included a fall of 20% or more. Prices only: with dividends reinvested the recoveries would have been shorter, and after inflation (the dashed line in the first chart) longer.`},
    {id:'record-high-forward',type:'groupbar',evidence:'Derived from official statistics',title:'Median index price change after record months and after all other months',unit:'percent',rowLabel:'Holding period',seriesNames:['After a record month','After any other month'],rows:grp.map(g=>({label:g.label,values:g.values})),note:`Starting months from ${input.rhFrom} that have the full period of data after them: ${grp.map(g=>`${g.label}, ${g.nr} record and ${g.no} other`).join('; ')}. Each month is a starting point, so a 10-year result shares most of its years with its neighbours and the counts overstate how much independent evidence there is. “Other months” include months deep in a fall, which had the most room to rebound.`},
    {id:'record-high-grid',type:'heatmap',evidence:'Official index · hypothetical yield, fee and cash rate',title:`Share of starting months after which the index plus ${input.rhYield}% yield, less a ${input.rhFee}% fee, beat ${input.rhCash}% cash`,unit:'percent',rowLabel:'Where the index stood when bought',columns:hz.map(h=>`${h} year${h===1?'':'s'}`),rows:grid,unavailableLabel:'No months',note:`Each cell takes every month from ${input.rhFrom} in that starting position, applies the actual index price change over the period, adds the assumed yield and removes the fee each year, and counts how often the result was at least ${input.rhCash}% a year compounded. The yield, fee and cash rate are your constant assumptions, not history: dividends, fees and deposit rates all changed over these decades.`}
  ]};
}
