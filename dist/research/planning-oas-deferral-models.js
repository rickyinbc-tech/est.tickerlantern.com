export const oasDeferralDefinitions={oasDeferralBridge:{title:'Compare OAS start ages with a transparent gross cash bridge',fields:[
 ['oasStartAge','OAS start age (whole years)',70,65,70,1],
 ['oasPensionShare','Illustrative share of full age-65 pension',100,25,100,5],
 ['oasProjectionAge','Compare cumulative payments through age',90,70,100,1]
]}};
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
const base=762.50;
export function oasDeferralResult(kind,i){
 if(kind!=='oasDeferralBridge')throw Error('Unknown OAS deferral illustration.');
 const start=i.oasStartAge, share=i.oasPensionShare/100, horizon=i.oasProjectionAge, lostMonths=(start-65)*12;
 const initial=base*share, delayed=initial*(1+.006*lostMonths), lost=initial*lostMonths;
 const monthsAfterStart=horizon>start?(horizon-start)*12:0;
 const laterGross=money(delayed*monthsAfterStart), earlyGross=money(initial*Math.max(0,(horizon-65)*12));
 const crossoverMonths=start===65?0:Math.ceil(lost/(delayed-initial));
 const crossoverAge=start===65?65:start+crossoverMonths/12;
 const points=[];
 for(let age=65;age<=horizon;age++){
  const early=initial*(age-65)*12;
  const later=age<=start?0:delayed*(age-start)*12;
  points.push({x:age,value:money(early),value2:money(later)});
 }
 const monthly=[65,66,67,68,69,70].map(age=>({label:'Start at '+age,value:money(base*(1+.072*(age-65)))}));
 return {metrics:[
  ['Base monthly amount at selected share · Oct–Dec 2026',money(initial),'money'],
  ['Illustrative monthly amount at selected start age',money(delayed),'money'],
  ['Gross OAS not received while waiting',money(lost),'money'],
  ['Simple fixed-rate cumulative crossover age',money(crossoverAge),'number',start===65?'No deferral; paths are identical':`About age ${crossoverAge.toFixed(1)}`],
  ['Cumulative gross difference at selected horizon',money(laterGross-earlyGross),'money']
 ],note:'Official anchor: Service Canada lists a maximum age-65 pension of CAD 762.50 per month for October–December 2026 and a 0.6% increase for each month after age 65, up to 36% at 70. The selected pension share is an editable teaching assumption, not an eligibility or residence calculation. Original arithmetic freezes today’s quarterly rate for every future payment and assumes 12 payments each year; actual OAS is adjusted quarterly for CPI. It excludes the separate 10% increase after age 75, tax/recovery tax, GIS, Allowance, other income, discounting, payment timing and mortality. The crossover is not a recommendation or forecast.',charts:[
  {id:'oas-start-amounts',type:'bar',unit:'money',title:'Published maximum monthly amount by start age',unitLabel:'CAD per month · October–December 2026',source:'https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/when-start.html',sourceLabel:'Service Canada · when to start OAS',rows:monthly,note:'Official Service Canada table for the maximum age-65-to-70 amount. The selected partial share control applies only to the personal scenario metrics and cash paths; this reference chart preserves published full maximums.'},
  {id:'oas-cash-paths',type:'line',unit:'money',title:'Cash received so far: start at 65 or at your selected age',unitLabel:'Cumulative gross OAS · CAD',xLabel:'Age at end of year',series:[{name:'Start at 65',rows:points.map(p=>({x:p.x,value:p.value}))},{name:`Start at ${start}`,rows:points.map(p=>({x:p.x,value:p.value2})),dash:true}],note:`Original fixed-rate illustration at ${i.oasPensionShare}% of the full base. No payment is counted before the selected start age. The annual checkpoints are a simplifying convention, not actual payment dates.`},
  {id:'oas-deferral-bridge',type:'bar',unit:'money',title:'Cumulative gross cash at the selected horizon',unitLabel:'Illustrative total through selected age · CAD',rows:[{label:'Payments forgone during deferral',value:money(lost)},{label:`Start at selected age · through ${horizon}`,value:laterGross},{label:`Start at 65 · through ${horizon}`,value:earlyGross}],note:'All bars are gross totals under the same frozen-rate convention. The separate metrics report the monthly increase and the approximate crossover age.'},
  {id:'oas-deferral-share',type:'bar',unit:'percent',title:'A partial pension changes dollars, not the percentage uplift',unitLabel:'Illustrative residence share',rows:[{label:'25% share',value:25},{label:'50% share',value:50},{label:'75% share',value:75},{label:'100% share',value:100}],note:'Service Canada says a partial pension can reflect years of Canadian residence divided by 40, subject to eligibility rules. This chart merely labels possible arithmetic shares and does not determine eligibility or an individual amount.'}
 ]};
}
