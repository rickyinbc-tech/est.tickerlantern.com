// Client-facing risk explanations: KYC risk profile stress test and Fund Facts risk bands.
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
const round=(n,d=4)=>Math.round((n+Number.EPSILON)*10**d)/10**d;
export const PROFILE_SHARES=[20,40,60,80,100];
// NI 81-102 Appendix F: annualised 10-year standard deviation of monthly returns.
export const RISK_BANDS=[['Low',0,6],['Low to medium',6,11],['Medium',11,16],['Medium to high',16,20],['High',20,Infinity]];
export const riskBand=sd=>RISK_BANDS.find(([,lo,hi])=>sd>=lo&&sd<hi)[0];

export const clientRiskDefinitions={
 riskProfileStress:{title:'Test each equity mix against your loss limit and time horizon',fields:[
  ['rpsAmount','Amount invested (CAD)',100000,1000,5000000,1000],
  ['rpsEquityShock','Stress year · stock return (%)',-35,-70,0,1],
  ['rpsBondShock','Stress year · bond return (%)',2,-20,15,0.5],
  ['rpsEquityReturn','Later years · stock return per year (%)',7,-5,15,0.5],
  ['rpsBondReturn','Later years · bond return per year (%)',3.5,-5,10,0.5],
  ['rpsMaxLoss','Largest one-year drop you could live with (%)',15,1,60,1],
  ['rpsHorizon','Years until you need the money',5,1,30,1]
 ]},
 fundRiskBand:{title:'Read a Fund Facts risk rating as a range of yearly outcomes',fields:[
  ['frbAmount','Amount invested (CAD)',50000,1000,5000000,1000],
  ['frbReturn','Assumed average yearly return (%)',5,-5,15,0.5],
  ['frbSd','Fund standard deviation (% per year)',9,1,40,0.5]
 ]}
};
export const clientRiskWholeKeys=['rpsHorizon'];

export function stressPath(i,share,years){
 const w=share/100,rows=[{x:0,value:i.rpsAmount}];let v=i.rpsAmount;
 for(let t=1;t<=years;t++){
  const r=t===1?w*i.rpsEquityShock+(1-w)*i.rpsBondShock:w*i.rpsEquityReturn+(1-w)*i.rpsBondReturn;
  v*=1+r/100;rows.push({x:t,value:money(v)});
 }
 return rows;
}
export function recoveryYears(i,share){
 const path=stressPath(i,share,60);
 if(path[1].value>=i.rpsAmount)return 0;
 const hit=path.findIndex((p,t)=>t>1&&p.value>=i.rpsAmount-0.005);
 return hit<0?null:hit;
}

function riskProfileStress(i){
 const years=Math.max(10,i.rpsHorizon);
 const rows=PROFILE_SHARES.map(share=>{
  const path=stressPath(i,share,years),loss=money(i.rpsAmount-path[1].value),pct=round(loss/i.rpsAmount),rec=recoveryYears(i,share);
  return {share,path,loss,pct,rec,end:path[i.rpsHorizon].value,lossOk:pct*100<=i.rpsMaxLoss+1e-9,timeOk:rec!=null&&rec<=i.rpsHorizon};
 });
 const best=key=>rows.filter(r=>r[key]).at(-1)?.share??0;
 const tolerance=best('lossOk'),capacity=best('timeOk'),profile=Math.min(tolerance,capacity);
 const label=s=>s?`${s}% stocks`:'Below 20% stocks';
 return {metrics:[
  ['Highest mix within your loss limit (willingness)',tolerance,'number',label(tolerance)],
  ['Highest mix that recovers within your time horizon (ability)',capacity,'number',label(capacity)],
  ['Mix suggested by the lower of the two',profile,'number',label(profile)],
  ['Stress-year loss at that mix',profile?rows.find(r=>r.share===profile).loss:null,'money']
 ],note:'Original illustration. Each mix is rebalanced every year to its stock share; the rest is bonds. Year one uses the stress returns you enter, later years use your steady returns. "Recovers" means the account is back to the amount invested. These returns are reader assumptions, not forecasts or historical results, and the 20%–100% mixes are generic, not any firm\'s model portfolios or suitability limits. Your advisor\'s risk profile also weighs income, assets, debts, liquidity needs and investment knowledge.',charts:[
  {id:'risk-profile-stress-loss',type:'bar',unit:'money',title:'Loss in the stress year for each stock share',rowLabel:'Mix',rows:rows.map(r=>({label:`${r.share}% stocks`,value:-r.loss})),note:`Dollar change in year one on CAD ${i.rpsAmount.toLocaleString('en-CA')}. Your stated limit is a ${i.rpsMaxLoss}% drop, or CAD ${money(i.rpsAmount*i.rpsMaxLoss/100).toLocaleString('en-CA')}.`},
  {id:'risk-profile-recovery-years',type:'bar',unit:'decimal',title:'Years until the account is back to the amount invested',unitLabel:'Years after investing',rowLabel:'Mix',rows:rows.map(r=>({label:`${r.share}% stocks`,value:r.rec??60})),note:`Counted from the day you invest. A mix that needs more than your ${i.rpsHorizon}-year horizon could still be below what you put in when you need the money.`},
  {id:'risk-profile-paths',type:'line',unit:'money',title:'Account value after a bad first year',xLabel:'Years after investing',series:rows.map(r=>({name:`${r.share}% stocks`,rows:r.path,dash:r.share>profile})),note:'Dashed lines are mixes above the lower of your loss limit and time-horizon test.'},
  {id:'risk-profile-horizon-value',type:'bar',unit:'money',title:`Value when you need the money (year ${i.rpsHorizon})`,rowLabel:'Mix',rows:rows.map(r=>({label:`${r.share}% stocks`,value:r.end})),note:'Same stress-then-steady assumptions. In a scenario without a bad first year, higher stock shares would usually end higher; this chart shows the cost of meeting the bad year early.'}
 ]};
}

export function normalBands(sd,ret){
 // Two-thirds and 95% ranges of one-year returns under a normal approximation.
 return {one:[ret-sd,ret+sd],two:[ret-2*sd,ret+2*sd]};
}
function fundRiskBand(i){
 const band=riskBand(i.frbSd),b=normalBands(i.frbSd,i.frbReturn);
 const typical=[3,8.5,13.5,18,24];
 return {metrics:[
  ['Fund Facts risk level for this standard deviation',null,'number',band],
  ['About two years in three: one-year return between',null,'number',`${round(b.one[0],1)}% and ${round(b.one[1],1)}%`],
  ['About 19 years in 20: one-year return between',null,'number',`${round(b.two[0],1)}% and ${round(b.two[1],1)}%`],
  ['A bad year (2 standard deviations below average) on your amount',money(i.frbAmount*b.two[0]/100),'money']
 ],note:'Fund Facts risk levels come from the 10-year standard deviation of monthly returns, annualised, under National Instrument 81-102 Appendix F. The ranges here assume returns spread roughly like a bell curve around the average you enter; real markets have more extreme years than this assumption suggests, so treat the 19-in-20 range as a floor for how bad a year can be, not a limit. A risk level describes past volatility, not the chance of loss or future returns.',charts:[
  {id:'fund-risk-band-thresholds',type:'bar',unit:'decimal',title:'Fund Facts risk levels by standard deviation band',unitLabel:'Upper edge of each band · % per year',rowLabel:'Risk level',rows:[{label:'Low (0 to under 6)',value:6},{label:'Low to medium (6 to under 11)',value:11},{label:'Medium (11 to under 16)',value:16},{label:'Medium to high (16 to under 20)',value:20}],source:'https://www.fcnb.ca/sites/default/files/2020-03/81-102-AI-NI-2017-03-08-E.pdf',sourceLabel:'CSA · NI 81-102 Appendix F (2017)',note:'High is 20 or greater and has no upper edge. A fund may be rated higher than its band if reasonable, but not lower.'},
  {id:'fund-risk-band-ranges',type:'groupbar',unit:'percent',title:'Typical one-year range for a fund in the middle of each band',seriesNames:['Bad year (−2 SD)','Lower two-in-three edge','Upper two-in-three edge','Good year (+2 SD)'],rowLabel:'Risk level (example SD)',rows:RISK_BANDS.map(([name],k)=>{const r=normalBands(typical[k],i.frbReturn);return {label:`${name} (${typical[k]}%)`,values:[r.two[0]/100,r.one[0]/100,r.one[1]/100,r.two[1]/100]};}),note:`Illustrative standard deviations near the middle of each band, all with your ${i.frbReturn}% average return. Same bell-curve assumption as above.`},
  {id:'fund-risk-band-dollars',type:'bar',unit:'money',title:`What a bad year could look like on CAD ${i.frbAmount.toLocaleString('en-CA')}`,rowLabel:'Risk level (example SD)',rows:RISK_BANDS.map(([name],k)=>({label:`${name} (${typical[k]}%)`,value:money(i.frbAmount*(i.frbReturn-2*typical[k])/100)})),note:'Dollar change in a year two standard deviations below average. Roughly one year in 40 would be worse under the bell-curve assumption; real markets produce such years more often.'}
 ]};
}

export function clientRiskResult(kind,i){
 if(kind==='riskProfileStress')return riskProfileStress(i);
 if(kind==='fundRiskBand')return fundRiskBand(i);
 throw Error('Unknown client risk illustration.');
}
