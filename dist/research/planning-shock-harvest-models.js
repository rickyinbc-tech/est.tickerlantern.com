export const shockHarvestDefinitions={
  jointDecline:{title:'Test a balanced fund in a year when stocks fall, bond yields rise and inflation jumps',fields:[
    ['jdAmount','Balanced fund value at the start (CAD)',100000,1000,5000000,1000],
    ['jdEquity','Share held in stocks, rebalanced each year (%)',60,0,100,5],
    ['jdStockFall','Stock fall in the shock year (%)',12,0,60,1],
    ['jdYield','Bond yield before the shock (%)',1.5,0,10,.25],
    ['jdRise','Rise in bond yields during the shock year (percentage points)',2,0,6,.25],
    ['jdDuration','Bond sleeve duration (years)',7,0,20,.5],
    ['jdStockLater','Stock return in each later year (%)',6,-2,12,.25],
    ['jdInflShock','Inflation in the shock year (%)',6.3,0,15,.1],
    ['jdInflLater','Inflation in each later year (%)',2.5,0,8,.1],
    ['jdYears','Years followed, including the shock year',15,2,30,1]
  ]},
  lossHarvest:{title:'Compare holding a fund after a crash with selling it at a loss and switching',inputIssue:i=>i.lhValue>=i.lhCost?{message:'The market value must be below the adjusted cost base for there to be a loss to realize.',fields:['lhValue']}:null,fields:[
    ['lhCost','Adjusted cost base of the fund units (CAD)',100000,1000,5000000,1000],
    ['lhValue','Market value after the decline (CAD)',75000,0,5000000,1000],
    ['lhGains','Capital gains available to offset, this year or the three years before (CAD)',20000,0,5000000,1000],
    ['lhRateNow','Marginal tax rate on the gains offset now (%)',40,0,60,.5],
    ['lhRateLater','Marginal tax rate in the year of the final sale (%)',40,0,60,.5],
    ['lhGrowth','Original fund return each year (%)',6,-5,15,.25],
    ['lhGap','Replacement fund return minus original (percentage points a year)',0,-3,3,.05],
    ['lhSwitch','Cost of selling and buying, % of the value moved',.25,0,5,.05],
    ['lhYears','Years until the final sale',10,1,40,1]
  ]}
};
export const shockHarvestWholeKeys=['jdYears','lhYears'];

// Month-end observations, December 2021 to September 2026. CPI: Statistics Canada table 18-10-0004-01, all-items
// not seasonally adjusted (vector v41690973), as a 12-month change rounded to one decimal. Policy rate: Bank of Canada
// target for the overnight rate (Valet V39079). 10-year yield: Government of Canada benchmark bond yield
// (Valet BD.CDN.10YR.DQ.YLD) on the last business day of the month. Retrieved 26 October 2026.
export const ratesInflationObserved={start:'2021-12',
  cpi:[4.8,5.1,5.7,6.7,6.8,7.7,8.1,7.6,7.0,6.9,6.9,6.8,6.3,5.9,5.2,4.3,4.4,3.4,2.8,3.3,4.0,3.8,3.1,3.1,3.4,2.9,2.8,2.9,2.7,2.9,2.7,2.5,2.0,1.6,2.0,1.9,1.8,1.9,2.6,2.3,1.7,1.7,1.9,1.7,1.9,2.4,2.2,2.2,2.4,2.3,1.8,2.4,2.8,3.2,2.8,3.0,3.0,3.1],
  policy:[.25,.25,.25,.5,1,1,1.5,2.5,2.5,3.25,3.75,3.75,4.25,4.5,4.5,4.5,4.5,4.5,4.75,5,5,5,5,5,5,5,5,5,5,5,4.75,4.5,4.5,4.25,3.75,3.75,3.25,3,3,2.75,2.75,2.75,2.75,2.75,2.75,2.5,2.25,2.25,2.25,2.25,2.25,2.25,2.25,2.25,2.25,2.25,2.25,2.25],
  tenYear:[1.42,1.78,1.84,2.4,2.88,2.9,3.23,2.61,3.11,3.16,3.27,2.96,3.3,2.92,3.33,2.9,2.84,3.18,3.26,3.49,3.56,4.03,4.05,3.56,3.1,3.35,3.48,3.45,3.82,3.62,3.5,3.18,3.16,2.95,3.22,3.07,3.23,3.07,2.9,2.97,3.07,3.2,3.28,3.45,3.38,3.17,3.12,3.14,3.42,3.42,3.13,3.46,3.56,3.41,3.38,3.65,3.73,3.99]
};
const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function observedMonthLabel(k){const m=11+k;return `${monthNames[m%12]} ${2021+Math.floor(m/12)}`;}

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(n,d=1)=>(n*100).toFixed(d)+'%';

// Annual steps, with the fund rebalanced to its stock share at each year-end, as a balanced fund does internally.
// Shock-year bond return: starting yield less duration × yield rise (a first-order estimate that ignores convexity).
// Later years: bonds earn the new yield, which is held constant. The comparison path keeps the same stock returns
// but leaves bond yields unchanged. Real values divide by a price index that rises with the entered inflation.
export function jointDeclinePlan(input,overrides={}){
  const i={...input,...overrides},w=i.jdEquity/100,y0=i.jdYield/100,dy=i.jdRise/100;
  const bondShock=y0-i.jdDuration*dy,bondLater=y0+dy,stockShock=-i.jdStockFall/100,stockLater=i.jdStockLater/100;
  const shock=w*stockShock+(1-w)*bondShock,later=w*stockLater+(1-w)*bondLater;
  const flatShock=w*stockShock+(1-w)*y0,flatLater=w*stockLater+(1-w)*y0;
  let value=i.jdAmount,flat=i.jdAmount,price=1,recovery=null;
  const rows=[{x:0,value,flat,real:value,price}];
  for(let year=1;year<=i.jdYears;year++){
    value*=1+(year===1?shock:later);flat*=1+(year===1?flatShock:flatLater);price*=1+(year===1?i.jdInflShock:i.jdInflLater)/100;
    rows.push({x:year,value,flat,real:value/price,price});
    if(recovery==null&&value/price>=i.jdAmount*(1-1e-12))recovery=year;
  }
  const last=rows.at(-1);
  return {rows,bondShock,bondLater,shock,later,flatShock,realShock:(1+shock)/(1+i.jdInflShock/100)-1,value:last.value,flat:last.flat,real:last.real,recovery};
}

// Years until the real value first regains the starting amount, searching up to 40 years past the start.
export function realRecoveryYear(input,overrides={}){return jointDeclinePlan(input,{...overrides,jdYears:40}).recovery;}

// A loss realized by selling is applied first against the available gains (this year, or carried back up to three
// years); the remainder is carried forward and here is assumed to be used against the gain on the final sale. Any loss
// still unused at the final sale is given no tax value in either path. The tax saving is assumed to be reinvested in
// the replacement fund at the start; in practice the refund or lower balance owing arrives after filing.
export function lossHarvestPlan(input,overrides={}){
  const i={...input,...overrides},loss=Math.max(0,i.lhCost-i.lhValue),used=Math.min(loss,i.lhGains),carried=loss-used;
  const saving=used*.5*i.lhRateNow/100,later=i.lhRateLater/100*.5,g=i.lhGrowth/100,g2=g+i.lhGap/100,moved=i.lhValue*(1-i.lhSwitch/100);
  const start=moved+saving;
  const at=t=>{
    const hold=i.lhValue*Math.pow(1+g,t),sw=start*Math.pow(1+g2,t),same=moved*Math.pow(1+g,t);
    const holdTax=Math.max(0,hold-i.lhCost)*later,swTax=Math.max(0,sw-start-carried)*later,sameTax=Math.max(0,same-moved-loss)*later;
    return {x:t,hold,sw,same,holdTax,swTax,sameTax,holdAfter:hold-holdTax,swAfter:sw-swTax,sameAfter:same-sameTax};
  };
  const rows=Array.from({length:i.lhYears+1},(_,t)=>at(t)),end=rows.at(-1),n=i.lhYears;
  const bridge={saving:saving*Math.pow(1+g2,n),switchCost:-i.lhValue*i.lhSwitch/100*Math.pow(1+g2,n),gap:i.lhValue*(Math.pow(1+g2,n)-Math.pow(1+g,n)),tax:-(end.swTax-end.holdTax)};
  return {loss,used,carried,saving,start,rows,end,bridge,advantage:end.swAfter-end.holdAfter};
}

export function shockHarvestResult(kind,input){
  if(kind==='jointDecline'){
    const p=jointDeclinePlan(input),w=input.jdEquity/100,A=input.jdAmount,o=ratesInflationObserved;
    const shockEnd=A*(1+p.shock),inflLoss=shockEnd-shockEnd/(1+input.jdInflShock/100);
    const shares=[20,40,60,80,100],falls=[0,10,20,30,40];
    const cross=p.rows.find(r=>r.x>0&&r.value>=r.flat);
    return {metrics:[['Bond sleeve return in the shock year',p.bondShock,'percent'],['Balanced fund return in the shock year',p.shock,'percent'],['Shock-year return after inflation',p.realShock,'percent'],[`Value after ${input.jdYears} years`,p.value,'money'],[`Value after ${input.jdYears} years in start-year dollars`,p.real,'money'],['Year the real value regains the start',p.recovery??NaN,'integer']].filter(m=>Number.isFinite(m[1])),
    note:`A ${money(A)} fund holds ${input.jdEquity}% stocks and ${100-input.jdEquity}% bonds, rebalanced each year-end. In the shock year stocks fall ${input.jdStockFall}% and bond yields rise ${input.jdRise} percentage points from ${input.jdYield}%, so a bond sleeve with ${input.jdDuration} years of duration returns about ${pct(p.bondShock)} (yield less duration × rise). Afterwards stocks return ${input.jdStockLater}% and bonds earn the new ${+(input.jdYield+input.jdRise).toFixed(2)}% yield each year. Inflation is ${input.jdInflShock}% in the shock year and ${input.jdInflLater}% later. Fees are assumed to be inside the returns; tax, contributions and withdrawals are not modeled. Every return is a hypothetical input, not a forecast or the record of any fund.`,
    charts:[
      {id:'joint-decline-observed',type:'line',title:'Canada, December 2021 to September 2026: inflation, the policy rate and the 10-year bond yield',unit:'percent',xLabel:'Month-end observation',xTicks:[0,12,24,36,48,57].map(k=>({value:k,label:observedMonthLabel(k)})),series:[{name:'CPI, 12-month change',rows:o.cpi.map((v,k)=>({x:k,label:observedMonthLabel(k),value:v/100}))},{name:'Bank of Canada policy rate',dash:true,rows:o.policy.map((v,k)=>({x:k,label:observedMonthLabel(k),value:v/100}))},{name:'Government of Canada 10-year benchmark yield',rows:o.tenYear.map((v,k)=>({x:k,label:observedMonthLabel(k),value:v/100}))}],note:'Dated official observations, not model output and unaffected by the inputs. Consumer price inflation peaked at 8.1% in June 2022. The policy rate rose from 0.25% in February 2022 to 5% by July 2023, and the 10-year yield went from 1.42% at the end of December 2021 to 3.30% at the end of December 2022. Rising yields lower the prices of bonds already held.'},
      {id:'joint-decline-shock-year',type:'waterfall',title:'Shock year: from the starting value to the year-end value in start-of-year dollars',unit:'money',totalLabel:'Year-end value in start-of-year dollars',rows:[{label:'Starting value',value:A},{label:`Stocks fall ${input.jdStockFall}%`,value:A*w*-input.jdStockFall/100},{label:`Bond income at ${input.jdYield}%`,value:A*(1-w)*input.jdYield/100},{label:'Bond prices fall as yields rise',value:-A*(1-w)*input.jdDuration*input.jdRise/100},{label:`Purchasing power lost to ${input.jdInflShock}% inflation`,value:-inflLoss}],note:`The fund ends the shock year at ${money(shockEnd)} in nominal dollars, a ${pct(p.shock)} return. In this example the bonds ${p.bondShock<0?`lose ${pct(-p.bondShock)}, so they add to the fall instead of offsetting it`:`return ${pct(p.bondShock)}, which cushions the stock fall`}. After ${input.jdInflShock}% inflation, the year-end value buys what ${money(shockEnd/(1+input.jdInflShock/100))} bought at the start.`},
      {id:'joint-decline-paths',type:'line',title:'After the shock: the higher bond yield starts working for the fund',unit:'money',xLabel:'Year-end',series:[{name:'Fund, bond yields rose',rows:p.rows.map(r=>({x:r.x,value:r.value}))},{name:'Same fund if bond yields had not risen',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.flat}))},{name:'Fund, bond yields rose, in start-year dollars',rows:p.rows.map(r=>({x:r.x,value:r.real}))}],note:`Both nominal paths share the same stock returns. The yield rise costs the fund ${money(p.rows[1].flat-p.rows[1].value)} in the shock year, but afterwards its bonds earn ${+(input.jdYield+input.jdRise).toFixed(2)}% instead of ${input.jdYield}%. ${cross?`It catches up with the no-rise path by year ${cross.x}`:`It has not caught up with the no-rise path within ${input.jdYears} years`}; the bond sleeve’s duration is a rough guide to that catch-up time. ${p.recovery?`In start-year dollars the fund is back to ${money(A)} in year ${p.recovery}.`:`In start-year dollars the fund does not get back to ${money(A)} within the horizon.`}`},
      {id:'joint-decline-recovery',type:'heatmap',title:'Year in which the real value regains the starting amount, by stock share and stock fall',unit:'integer',rowLabel:'Stock share',unavailableLabel:'Not within 40 years',columns:falls.map(f=>f?`Stocks −${f}%`:'No stock fall'),rows:shares.map(s=>({label:`${s}% stocks`,values:falls.map(f=>realRecoveryYear(input,{jdEquity:s,jdStockFall:f}))})),note:`Each cell keeps the entered bond yields, ${input.jdRise}-point rise, ${input.jdDuration}-year duration, later returns and inflation, and changes only the stock share and the shock-year stock fall. When stocks and bonds fall together, a lower stock share protects less than usual: in the “No stock fall” column the whole loss comes from bonds and inflation. A count of years is an arithmetic result for these inputs, not a promised recovery date.`}
    ]};
  }
  if(kind==='lossHarvest'){
    const p=lossHarvestPlan(input),e=p.end,L=p.loss;
    const years=[1,3,5,10,20,30].filter(y=>y<=40),rates=[20,30,40,50];
    return {metrics:[['Capital loss if sold now',L,'money'],['Loss usable now against available gains',p.used,'money'],['Tax saved now on those gains',p.saving,'money'],[`After-tax value in year ${input.lhYears} · held`,e.holdAfter,'money'],[`After-tax value in year ${input.lhYears} · sold and switched`,e.swAfter,'money'],['Switching minus holding, after tax',p.advantage,'money']],
    note:`Units bought for ${money(input.lhCost)} are worth ${money(input.lhValue)}. Selling realizes a ${money(L)} capital loss; half of it is an allowable loss. ${money(p.used)} offsets available gains at a ${input.lhRateNow}% marginal rate, saving ${money(p.saving)}, and ${money(p.carried)} is carried forward to the final sale. The proceeds less a ${input.lhSwitch}% switching cost, plus the tax saving, buy a different fund that returns ${+(input.lhGrowth+input.lhGap).toFixed(2)}% a year, against ${input.lhGrowth}% for the original. Both holdings are sold after ${input.lhYears} years, with half of any gain taxed at ${input.lhRateLater}%. A loss still unused at the final sale is given no value. Returns and tax rates are hypothetical inputs; this is not a personal tax calculation.`,
    charts:[
      {id:'loss-harvest-outcomes',type:'stackbar',title:`What happens to the ${money(L)} loss under four choices`,unit:'money',rowLabel:'Choice within the 61-day window',seriesNames:['Used now against available gains','Carried forward to later gains','Added to the cost base of the repurchased units','Denied with no later benefit to you','Not realized; still inside the units held'],rows:[{label:'Sell and buy a different fund',values:[p.used,p.carried,0,0,0]},{label:'Sell and rebuy the same fund within 30 days',values:[0,0,L,0,0]},{label:'Sell, then buy the same fund in your TFSA or RRSP within 30 days',values:[0,0,0,L,0]},{label:'Keep holding the fund',values:[0,0,0,0,L]}],note:`CRA treats a loss as superficial when you or an affiliated person, such as a spouse, buy the same or identical property in the 30 calendar days before or after the sale and still hold it 30 days after. A superficial loss cannot be deducted. When you are the buyer you can usually add it to the cost base of the new units, which only postpones the benefit. When the substituted property is bought in a registered plan, the loss is generally denied without a cost-base addition you can use. Confirm a specific case with a tax professional.`},
      {id:'loss-harvest-paths',type:'line',title:'After-tax value if everything were sold at each year-end',unit:'money',xLabel:'Years after the decision',series:[{name:'Sold and switched to a different fund',rows:p.rows.map(r=>({x:r.x,value:r.swAfter}))},{name:'Kept holding the original fund',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.holdAfter}))},{name:'Sold and rebought the same fund (superficial loss)',rows:p.rows.map(r=>({x:r.x,value:r.sameAfter}))}],note:`Switching starts ahead by the tax saving, less the switching cost: ${money(p.rows[0].swAfter)} against ${money(p.rows[0].holdAfter)}. Its new cost base is lower, so more of the later growth is taxable; the extra tax at the final sale is ${money(e.swTax-e.holdTax)}. Rebuying the same fund only pays the switching cost, because the denied loss returns through the cost base.`},
      {id:'loss-harvest-bridge',type:'waterfall',title:`Year ${input.lhYears}: from the held fund’s after-tax value to the switched fund’s`,unit:'money',totalLabel:'After-tax value, sold and switched',rows:[{label:'After-tax value, kept holding',value:e.holdAfter},{label:'Tax saved now, with its growth',value:p.bridge.saving},{label:'Switching cost, with its lost growth',value:p.bridge.switchCost},{label:'Return gap of the replacement fund',value:p.bridge.gap},{label:'Extra tax on the larger gain at the final sale',value:p.bridge.tax}],note:`Selling at a loss mostly moves tax in time: it lowers tax now and raises the gain, and the tax, at the final sale. The net result is ${p.advantage>=0?'a gain':'a loss'} of ${money(Math.abs(p.advantage))}. It grows with the years the saving compounds and with a lower tax rate at the final sale; it shrinks or turns negative with a higher later rate, higher switching costs or a replacement fund that lags.`},
      {id:'loss-harvest-grid',type:'heatmap',title:'Switching minus holding, after tax, by years held and later tax rate',unit:'money',rowLabel:'Years until the final sale',columns:rates.map(r=>`${r}% rate at sale`),rows:years.map(y=>({label:`${y} year${y===1?'':'s'}`,values:rates.map(r=>lossHarvestPlan(input,{lhYears:y,lhRateLater:r}).advantage)})),note:`Each cell keeps the entered loss, available gains, ${input.lhRateNow}% rate now, returns and switching cost, and changes only the holding period and the marginal rate when the units are finally sold. A sale in retirement at a lower rate favours switching; a sale in a high-income year, or a large sale that pushes income into a higher bracket, works against it.`}
    ]};
  }
  throw Error('Unknown shock-harvest topic');
}
