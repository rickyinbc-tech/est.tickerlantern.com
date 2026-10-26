export const locationTimingDefinitions={
  assetLocation:{title:'Place a bond fund and an equity fund across a TFSA and a non-registered account',fields:[
    ['alTfsa','Amount invested in the TFSA (CAD)',40000,0,500000,1000],
    ['alTaxable','Amount invested in the non-registered account (CAD)',60000,0,2000000,1000],
    ['alBond','Bond fund share of the combined total (%)',40,0,100,5],
    ['alBondReturn','Bond fund return, paid out as interest each year (%)',4,0,10,.25],
    ['alEquityGrowth','Equity fund price growth each year, before distributions (%)',5,-5,12,.25],
    ['alEquityDist','Equity fund distributions each year, reinvested (%)',2,0,8,.25],
    ['alInterestTax','Marginal tax rate on interest and other ordinary income (%)',30,0,55,1],
    ['alDistTax','Tax rate on the equity fund distributions (%)',15,0,55,1],
    ['alYears','Years before the non-registered holdings are sold',20,1,40,1]
  ]},
  strongMonths:{title:'Test missed strong months, missed weak months and a real exit window',fields:[
    ['smCapital','Balance already invested at the start (CAD)',10000,1000,1000000,1000],
    ['smCount','Number of best and of worst months to remove',5,0,10,1],
    ['smScale','Scale of the authored monthly returns (%)',100,0,150,10],
    ['smCash','Effective annual interest on cash while out of the market (%)',2.25,0,8,.25],
    ['smExit','Leave the market after the close of month',46,1,119,1],
    ['smWindow','Stay out for this many months',6,1,24,1]
  ]}
};
export const locationTimingWholeKeys=['alYears','smCount','smExit','smWindow'];

// Capital gains inclusion rate shown in CRA's 2025 capital gains guidance; applied to the entered marginal rate.
export const capitalGainsInclusion=.5;

// CRA TFSA dollar limits, 2009–2026 (CRA "MP, DB, RRSP, DPSP, ALDA, TFSA limits, YMPE and the YAMPE", page dated 2025-12-01).
export const tfsaDollarLimits=[[2009,5000],[2010,5000],[2011,5000],[2012,5000],[2013,5500],[2014,5500],[2015,10000],[2016,5500],[2017,5500],[2018,5500],[2019,6000],[2020,6000],[2021,6000],[2022,6000],[2023,6500],[2024,7000],[2025,7000],[2026,7000]];

export const placements=[['bondFirst','Bond fund in the TFSA first'],['equityFirst','Equity fund in the TFSA first'],['sameMix','Same mix in both accounts']];

function holdings(input,placement){
  const total=input.alTfsa+input.alTaxable,bond=total*input.alBond/100,equity=total-bond;
  if(placement==='sameMix'){const w=input.alBond/100;return {tfsaBond:input.alTfsa*w,tfsaEquity:input.alTfsa*(1-w),taxBond:input.alTaxable*w,taxEquity:input.alTaxable*(1-w)};}
  if(placement==='bondFirst'){const tfsaBond=Math.min(bond,input.alTfsa);return {tfsaBond,tfsaEquity:input.alTfsa-tfsaBond,taxBond:bond-tfsaBond,taxEquity:equity-(input.alTfsa-tfsaBond)};}
  const tfsaEquity=Math.min(equity,input.alTfsa);return {tfsaEquity,tfsaBond:input.alTfsa-tfsaEquity,taxEquity:equity-tfsaEquity,taxBond:bond-(input.alTfsa-tfsaEquity)};
}

// Year order: bond interest and equity distributions are paid and taxed in the non-registered account, the after-tax
// cash is reinvested in the same fund (raising its adjusted cost base), and equity units change in price. Each year-end
// value is also shown after a hypothetical sale of the non-registered holdings; a loss on sale is given no tax value.
export function assetLocationPlan(input,placement,overrides={}){
  const i={...input,...overrides},h=holdings(i,placement),rb=i.alBondReturn/100,g=i.alEquityGrowth/100,d=i.alEquityDist/100,ti=i.alInterestTax/100,td=i.alDistTax/100,tg=ti*capitalGainsInclusion;
  let tb=h.tfsaBond,te=h.tfsaEquity,xb=h.taxBond,xe=h.taxEquity,acb=h.taxEquity,annualTax=0;
  const saleTax=()=>Math.max(0,xe-acb)*tg;
  const rows=[{x:0,tfsa:tb+te,taxable:xb+xe,saleTax:0,afterTax:tb+te+xb+xe,annualTax:0}];
  for(let year=1;year<=i.alYears;year++){
    tb*=1+rb;te*=1+g+d;
    const interest=xb*rb,dist=xe*d;annualTax+=interest*ti+dist*td;
    xb+=interest*(1-ti);acb+=dist*(1-td);xe=xe*(1+g)+dist*(1-td);
    const s=saleTax();rows.push({x:year,tfsa:tb+te,taxable:xb+xe,saleTax:s,afterTax:tb+te+xb+xe-s,annualTax});
  }
  const last=rows.at(-1);
  return {holdings:h,rows,tfsaEnd:last.tfsa,taxableAfterSale:last.taxable-last.saleTax,saleTax:last.saleTax,annualTax:last.annualTax,afterTax:last.afterTax,acb};
}

// Authored 120-month total-return path for teaching only: calm years, a 14-month crisis in which large gains and
// losses alternate, then recovery. It is not an index history, a forecast or a probability.
export const strongMonthReturns=[
  .011,.006,-.012,.014,.009,.004,-.008,.013,.007,.010,.005,-.015,.012,.009,.006,.011,-.006,.008,.013,.004,
  .010,-.011,.007,.012,.006,.009,-.004,.011,.008,.005,.012,-.009,.010,.006,.013,-.003,.008,.004,-.014,.007,
  -.062,.048,-.094,-.071,.083,-.118,.097,.064,-.052,.072,-.038,.055,.041,.029,
  .018,.012,-.010,.015,.009,.011,-.007,.014,.008,.006,.010,-.013,.012,.007,.009,.005,-.024,.031,.011,.008,
  .006,.010,-.009,.013,.007,.004,.011,-.006,.009,.012,.005,-.011,.010,.008,.006,.013,-.017,.022,.009,.007,
  .011,-.005,.008,.012,.004,.009,-.008,.010,.006,.013,.007,-.012,.011,.005,.009,.008,-.004,.010,.012,.006,
  .008,-.009,.011,.007,.010,.009
];

// Best months are the highest returns (earlier month first on ties); worst months come from the remaining months.
export function rankedMonths(input,count=input.smCount){
  const r=strongMonthReturns.map((x,k)=>({month:k+1,ret:x*input.smScale/100}));
  const best=[...r].sort((a,b)=>b.ret-a.ret||a.month-b.month).slice(0,count),taken=new Set(best.map(m=>m.month));
  const worst=r.filter(m=>!taken.has(m.month)).sort((a,b)=>a.ret-b.ret||a.month-b.month).slice(0,count);
  return {best,worst};
}

export function strongMonthsPlan(input,{out=new Set()}={}){
  const cash=Math.expm1(Math.log1p(input.smCash/100)/12);let value=input.smCapital;const rows=[{x:0,value}];
  strongMonthReturns.forEach((x,k)=>{value*=1+(out.has(k+1)?cash:x*input.smScale/100);rows.push({x:k+1,value});});
  return {rows,end:value};
}
const windowSet=(exit,length)=>new Set(Array.from({length},(_,k)=>exit+1+k).filter(m=>m<=strongMonthReturns.length));
export function strongMonthsSummary(input,count=input.smCount){
  const {best,worst}=rankedMonths(input,count),set=list=>new Set(list.map(m=>m.month));
  const invested=strongMonthsPlan(input).end;
  return {best,worst,invested,missBest:strongMonthsPlan(input,{out:set(best)}).end,missWorst:strongMonthsPlan(input,{out:set(worst)}).end,missBoth:strongMonthsPlan(input,{out:set([...best,...worst])}).end};
}
export function exitWindowPlan(input,exit=input.smExit,length=input.smWindow){return strongMonthsPlan(input,{out:windowSet(exit,length)});}

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=n=>(n*100).toFixed(1)+'%';
export function locationTimingResult(kind,input){
  if(kind==='assetLocation'){
    const plans=placements.map(([key,label])=>({key,label,p:assetLocationPlan(input,key)})),[bf,ef,sm]=plans.map(x=>x.p);
    const total=input.alTfsa+input.alTaxable,cumulative=tfsaDollarLimits.reduce((a,[,v])=>a+v,0);
    const grid=[2,4,6,8].map(growth=>({label:`Equity price growth ${growth}%`,values:[2,3,4,5,6].map(bond=>assetLocationPlan(input,'equityFirst',{alEquityGrowth:growth,alBondReturn:bond}).afterTax-assetLocationPlan(input,'bondFirst',{alEquityGrowth:growth,alBondReturn:bond}).afterTax)}));
    return {metrics:[['After-tax value · bond fund in the TFSA first',bf.afterTax,'money'],['After-tax value · equity fund in the TFSA first',ef.afterTax,'money'],['After-tax value · same mix in both accounts',sm.afterTax,'money'],['Equity first minus bond first',ef.afterTax-bf.afterTax,'money'],['Tax paid on yearly income · bond first',bf.annualTax,'money'],['Tax paid on yearly income · equity first',ef.annualTax,'money']],
    note:`Every placement starts with the same ${money(total)}: ${money(input.alTfsa)} in the TFSA, ${money(input.alTaxable)} in the non-registered account and ${input.alBond}% of the total in the bond fund. Only the location of each fund changes. Bond interest and equity distributions in the non-registered account are taxed in the year paid at the entered rates and the after-tax cash is reinvested. Unrealized equity growth is taxed only when the units are sold at the horizon, at the entered marginal rate times the one-half inclusion rate. Returns are constant hypothetical inputs, not forecasts. Fund fees are assumed to be inside the entered returns. No new contributions, withdrawals, rebalancing, foreign withholding tax, dividend gross-up or credit calculation, provincial details, or use of a capital loss is modeled.`,
    charts:[
      {id:'asset-location-tfsa-limits',type:'groupbar',title:'TFSA room arrives a few thousand dollars a year, so the space is worth allocating',unit:'money',source:'https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html',sourceLabel:'CRA · TFSA dollar limits, 2009–2026',seriesNames:['TFSA dollar limit'],rows:tfsaDollarLimits.map(([year,v])=>({label:String(year),values:[v]})),note:`CRA lists a TFSA dollar limit of CAD 7,000 for 2024, 2025 and 2026. The 2009–2026 limits sum to ${money(cumulative)}, which is the most a person could have accumulated only if they were 18 or older and resident in Canada from 2009 and never contributed. Actual room also depends on prior contributions and withdrawals; check your own room with CRA.`},
      {id:'asset-location-ending',type:'stackbar',title:'Same funds, same money, different locations: ending value after the non-registered sale',unit:'money',seriesNames:['TFSA value','Non-registered value after tax on sale'],rows:plans.map(({label,p})=>({label,values:[p.tfsaEnd,p.taxableAfterSale]})),note:`After ${input.alYears} years. The bond-first placement shelters ${money(bf.holdings.tfsaBond)} of bond fund; the equity-first placement shelters ${money(ef.holdings.tfsaEquity)} of equity fund. Tax on the final sale is ${money(bf.saleTax)} for bond first, ${money(ef.saleTax)} for equity first and ${money(sm.saleTax)} for the same mix. A placement that grows the TFSA faster also leaves a different after-tax mix of risk.`},
      {id:'asset-location-difference',type:'line',title:'How the advantage of each placement changes with the holding period',unit:'money',xLabel:'Year-end, assuming a sale of the non-registered holdings at that date',series:[{name:'Equity first minus bond first',rows:ef.rows.map((r,k)=>({x:r.x,value:r.afterTax-bf.rows[k].afterTax}))},{name:'Same mix minus bond first',dash:true,rows:sm.rows.map((r,k)=>({x:r.x,value:r.afterTax-bf.rows[k].afterTax}))}],note:'A positive value means that placement leaves more after-tax money than putting the bond fund in the TFSA first. Annual tax on interest favours sheltering bonds; tax-free compounding of a higher expected equity return favours sheltering equity. The crossover depends entirely on the entered returns and tax rates.'},
      {id:'asset-location-grid',type:'heatmap',title:'Equity first minus bond first across return assumptions',unit:'money',columns:['Bond 2%','Bond 3%','Bond 4%','Bond 5%','Bond 6%'],rows:grid,note:`Each cell reruns the ${input.alYears}-year comparison with the entered amounts, tax rates and equity distribution yield, changing only the equity price growth (rows) and the bond fund return (columns). Positive cells favour holding the equity fund in the TFSA first. These are assumptions, not expected returns for any fund.`}
    ]};
  }
  if(kind==='strongMonths'){
    const s=strongMonthsSummary(input),full=strongMonthsPlan(input),win=exitWindowPlan(input),last=Math.min(input.smExit+input.smWindow,strongMonthReturns.length);
    const marked=[...s.best.map(m=>({...m,kind:'best'})),...s.worst.map(m=>({...m,kind:'worst'}))].sort((a,b)=>a.month-b.month);
    const sens=Array.from({length:11},(_,n)=>({n,q:strongMonthsSummary(input,n)}));
    const exits=[36,40,43,46,49],lengths=[3,6,12];
    const gap=s.best.length?s.best.reduce((a,b)=>a+Math.min(...s.worst.map(w=>Math.abs(w.month-b.month))),0)/s.best.length:0;
    return {metrics:[['Ending value · fully invested',s.invested,'money'],[`Ending value · out for the ${input.smCount} best months`,s.missBest,'money'],[`Ending value · out for the ${input.smCount} worst months`,s.missWorst,'money'],['Ending value · out for both sets',s.missBoth,'money'],[`Ending value · out for months ${input.smExit+1}–${last}`,win.end,'money'],['Exit window minus fully invested',win.end-s.invested,'money']],
    note:`An existing ${money(input.smCapital)} balance follows one authored 120-month path. Removing a month replaces its return with interest on cash at the entered effective annual rate, converted to a monthly rate. The best and worst months are identified with hindsight, which no investor has in advance. The exit window is a rule a person could actually follow: leave after one month-end close and return after a fixed number of months. No fees, trading costs, tax, spreads or distributions are modeled. The path is a teaching example, not market history, a forecast or a probability.`,
    charts:[
      {id:'strong-months-path',type:'line',title:'One authored decade: stay invested, or step out for a window',unit:'money',xLabel:'Month-end',series:[{name:'Fully invested',rows:full.rows},{name:`Out after month ${input.smExit} for ${input.smWindow} month${input.smWindow===1?'':'s'}`,dash:true,rows:win.rows}],note:`The calm months average under 1%, then months 41–54 alternate large losses and large gains before a recovery. The exit window earns cash interest for months ${input.smExit+1}–${last} and then rejoins the path. It ends ${win.end>=s.invested?'above':'below'} the fully invested balance by ${money(Math.abs(win.end-s.invested))}.`},
      {id:'strong-months-cluster',type:'signedbar',title:'The strongest and weakest months sit next to each other',unit:'percent',rows:marked.length?marked.map(m=>({label:`Month ${m.month} · ${m.kind==='best'?'a best':'a worst'} month`,value:m.ret})):[{label:'No months removed',value:0}],note:`Listed in calendar order. ${s.best.length?`On average, each best month is ${gap.toFixed(1)} months from the nearest worst month in this path.`:''} An exit that avoids one of the worst months is likely to be out for one of the best, because both arrive during the same volatile stretch.`},
      {id:'strong-months-count',type:'line',title:'Missing best months, worst months, or both, by how many are removed',unit:'money',xLabel:'Number of best and/or worst months removed',series:[{name:'Out for the best months',rows:sens.map(({n,q})=>({x:n,value:q.missBest}))},{name:'Out for the worst months',rows:sens.map(({n,q})=>({x:n,value:q.missWorst}))},{name:'Out for both sets',rows:sens.map(({n,q})=>({x:n,value:q.missBoth}))},{name:'Fully invested',dash:true,rows:sens.map(({n,q})=>({x:n,value:q.invested}))}],note:'Removing only the best months is the familiar warning; removing only the worst is the familiar temptation. Both use perfect hindsight. The “both” line is closer to what an imperfect exit tends to do when gains and losses cluster: it misses some of each.'},
      {id:'strong-months-windows',type:'heatmap',title:'A real exit window: ending value minus staying invested',unit:'money',columns:exits.map(e=>`Exit after month ${e}`),rows:lengths.map(len=>({label:`Out ${len} months`,values:exits.map(e=>exitWindowPlan(input,e,len).end-s.invested)})),note:'Each cell leaves after the stated month-end close and returns after the stated number of months, earning the entered cash rate while out. Positive cells beat staying invested in this one authored path; negative cells trail it. The result depends on the exact dates, which were chosen here with the whole path in view.'}
    ]};
  }
  throw Error('Unknown location-timing topic');
}
