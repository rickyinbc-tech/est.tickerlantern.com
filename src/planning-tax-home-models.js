export const federal2026={year:2026,reviewed:'2026-10-25',url:'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html',bands:[[58523,.14],[117045,.205],[181440,.26],[258482,.29],[Infinity,.33]]};
export const taxHomeDefinitions={
  federalTax:{title:'Explore 2026 federal tax brackets before credits',fields:[
    ['income','Taxable income before modeled deduction (CAD)',80000,0,400000,5000],['deduction','Illustrative deduction from that income (CAD)',5000,0,50000,1000],
    ['extra','Additional taxable income to compare (CAD)',10000,0,100000,1000]
  ]},
  fhsa:{title:'Explore a new FHSA contribution calendar',fields:[
    ['annual','Annual contribution requested after waiting (CAD)',10000,0,16000,1000],['wait','Initial years with no contribution',2,0,5,1],
    ['years','Years since first account opening',8,2,10,1],['rate','Assumed annual investment return (%)',4,-5,10,.5]
  ]},
  moving:{title:'Explore the cash available after a move',fields:[
    ['sale','Current home sale price (CAD)',900000,100000,3000000,10000],['oldDebt','Mortgage repaid on current home (CAD)',250000,0,2000000,10000],
    ['sellPercent','Sale costs / sale price (%)',4,0,10,.5],['sellFixed','Other sale costs and tax provision (CAD)',5000,0,300000,1000],
    ['buy','Replacement home price (CAD)',650000,100000,3000000,10000],['buyPercent','Purchase costs / replacement price (%)',3,0,10,.5],
    ['moving','Moving and setup costs (CAD)',5000,0,100000,1000],['newLTV','Assumed new mortgage / replacement price (%)',30,0,80,5]
  ]}
};
export function federalSlices(income){
  let lower=0;return federal2026.bands.map(([upper,rate])=>{const amount=Math.max(0,Math.min(income,upper)-lower),row={lower,upper,rate,amount,tax:amount*rate};lower=upper;return row;});
}
export function federalBracketTax(income){return federalSlices(income).reduce((sum,r)=>sum+r.tax,0);}
export function nextDollarRate(income){return federal2026.bands.find(([upper])=>income<upper)?.[1]??.33;}
export function fhsaCalendar(input,wait=input.wait){
  let carry=0,used=0,value=0,unplaced=0;const rows=[{x:0,value:0,used:0}];
  for(let year=1;year<=input.years;year++){
    const annualRoom=8000+carry,room=Math.min(annualRoom,Math.max(0,40000-used)),requested=year>wait?input.annual:0,deposit=Math.min(requested,room);
    value=value*(1+input.rate/100)+deposit;used+=deposit;unplaced+=requested-deposit;carry=Math.min(8000,annualRoom-deposit);
    rows.push({x:year,value,used,room,requested,deposit,carry});
  }
  return {rows,used,value,unplaced};
}
export function movingCash(input){
  const selling=input.sale*input.sellPercent/100,purchasing=input.buy*input.buyPercent/100,newDebt=input.buy*input.newLTV/100;
  const afterSale=input.sale-selling-input.sellFixed-input.oldDebt,cashNeeded=input.buy+purchasing+input.moving-newDebt;
  return {selling,purchasing,newDebt,afterSale,cashNeeded,released:afterSale-cashNeeded,costs:selling+input.sellFixed+purchasing+input.moving};
}
export function taxHomeResult(kind,input){
  if(kind==='federalTax'){
    const taxable=Math.max(0,input.income-input.deduction),after=Math.max(0,input.income+input.extra-input.deduction),tax=federalBracketTax(taxable),afterTax=federalBracketTax(after);
    const xmax=Math.max(300000,after),points=[...new Set([0,1,...Array.from({length:31},(_,i)=>i*10000),...federal2026.bands.map(b=>b[0]).filter(Number.isFinite),taxable,after,xmax])].sort((a,b)=>a-b);
    const rules={source:federal2026.url,sourceLabel:'CRA · federal rates for 2026',evidence:'2026 federal rules · hypothetical income'};
    return {metrics:[['Federal bracket tax before credits',tax,'money'],['Bracket tax / taxable income',taxable>0?tax/taxable:null,'percent',taxable>0?undefined:'Not defined at $0'],['Bracket rate on the next dollar',nextDollarRate(taxable),'percent']],note:'Illustration using 2026 federal ordinary-income brackets reviewed 25 October 2026. Input is taxable income before the selected illustrative deduction, not gross salary. No federal credits (including the basic personal amount), provincial/territorial tax, Quebec abatement, CPP/EI, benefit changes, alternative minimum tax or income-inclusion rules are calculated. This is bracket arithmetic before credits, not a tax return, total marginal-rate estimate or take-home-pay calculator.',charts:[
      {id:'federal-slices',type:'bar',...rules,title:'Each income slice is taxed at its own bracket rate',unit:'money',rows:federalSlices(taxable).map(r=>({label:(r.lower===0?'First $'+r.upper.toLocaleString('en-CA'):Number.isFinite(r.upper)?'$'+r.lower.toLocaleString('en-CA')+'–$'+r.upper.toLocaleString('en-CA'):'Above $'+r.lower.toLocaleString('en-CA'))+' · '+Number((r.rate*100).toFixed(1))+'%',value:r.tax})),note:'Bars show tax charged to the selected taxable-income portion in each federal band, before credits. A zero bar means no selected income falls in that band. This is not a display of provincial or combined tax.'},
      {id:'federal-rates',type:'line',...rules,title:'The rate on the next dollar differs from the average across income',unit:'percent',unitLabel:'Federal bracket rates before credits (%)',xUnit:'money',xLabel:'Taxable income (CAD)',series:[{name:'Rate on the next dollar',step:true,rows:points.map(x=>({x,value:nextDollarRate(x)}))},{name:'Bracket tax divided by income',dash:true,rows:points.filter(x=>x>0).map(x=>({x,value:federalBracketTax(x)/x}))}],note:'Average rate is undefined at zero income, so that curve begins at CAD 1. The stepped curve changes only for the next dollar above each threshold. Both curves exclude credits, other taxes and benefit interactions; they are not personal effective tax rates.'},
      {id:'federal-extra',type:'stackbar',...rules,title:'Additional income does not re-tax every earlier dollar at the new rate',unit:'money',seriesNames:['Federal bracket tax before credits','Taxable income less this bracket tax'],rows:[{label:'Before additional income',values:[tax,taxable-tax]},{label:'With additional income',values:[afterTax,after-afterTax]}],note:'The same modeled deduction applies in both cases. The second component is a partial arithmetic remainder, not take-home pay. Tax on the additional income equals the difference in the two tax components.'},
      {id:'federal-deduction',type:'heatmap',...rules,title:'A deduction can cross more than one federal band',unit:'money',columns:['$1k','$5k','$10k','$20k'],rows:[40000,60000,120000,190000].map(income=>({label:'$'+income/1000+'k',values:[1000,5000,10000,20000].map(d=>federalBracketTax(income)-federalBracketTax(Math.max(0,income-d)))})),note:'Columns are illustrative deductions from the displayed taxable income. Cells show federal bracket-tax reduction only, before credits. Deductibility and the actual tax value of a particular payment are not determined. The fixed grid uses its own income and deduction alternatives.'}
    ]};
  }
  if(kind==='fhsa'){
    const p=fhsaCalendar(input),now=fhsaCalendar(input,0);
    return {metrics:[['Cumulative modeled contributions',p.used,'money'],['Ending account value',p.value,'money'],['Requests not placed in this FHSA',p.unplaced,'money']],note:'Ordinary-case illustration under FHSA participation rules reviewed 25 October 2026: first account opens in year 1, initial room CAD 8,000, annual base CAD 8,000, participation-room carryforward capped at CAD 8,000 and ordinary lifetime capacity CAD 40,000. Eligibility throughout the modeled years is assumed. Contributions arrive at year-end; existing balance earns the selected annual return. No RRSP transfers, withdrawals, excesses, designated amounts, re-participation room, deductions, refunds or account-closing deadlines are calculated. Rules are held fixed for the scenario, not forecast.',charts:[
      {id:'fhsa-room',type:'groupbar',title:'Annual room and planned deposits follow a calendar',unit:'money',seriesNames:['Participation room before deposit','Contribution actually modeled'],rows:p.rows.slice(1).map(r=>({label:'Year '+r.x+' since opening',values:[r.room,r.deposit]})),note:'Waiting means the account is already open but no contribution is requested in those initial years. Requests are capped at the available modeled room; unplaced requests never enter the account. This does not verify room for deposits made in real accounts.'},
      {id:'fhsa-path',type:'line',title:'Compare contributing now with waiting inside an already open account',unit:'money',xLabel:'Years since first FHSA opening',series:[{name:'Selected waiting period',rows:p.rows},{name:'No initial wait',rows:now.rows,dash:true}],note:'Both scenarios share the same opening year, requested annual amount after waiting, return and finish date. Annual room may cause different actual deposits. This is not a comparison of investment performance or of opening an account at different dates.'},
      {id:'fhsa-bridge',type:'waterfall',title:'Account value can differ from the contribution total',unit:'money',rows:[{label:'Cumulative contributions',value:p.used},{label:'Modeled investment growth / loss',value:p.value-p.used}],totalLabel:'Ending account value',note:'Investment income generally does not consume participation room. A balance above CAD 40,000 can therefore coexist with CAD 40,000 of ordinary cumulative contributions. Losses do not create new contribution room in this illustration.'},
      {id:'fhsa-matrix',type:'heatmap',title:'Contributions placed by the selected finish date',unit:'money',columns:['Year 1','Year 2','Year 4','Year 6'],rows:[4000,8000,12000,16000].map(annual=>({label:'$'+annual/1000+'k / year',values:[0,1,3,5].map(wait=>fhsaCalendar({...input,annual},wait).used)})),note:'Columns are the first year contributions are requested, after opening in year 1. Rows are annual requests. Cells show cumulative deposits that fit the simplified room model, not balances or tax deductions. They do not change with investment return.'}
    ]};
  }
  if(kind==='moving'){
    const p=movingCash(input);
    return {metrics:[['Cash after selling and repaying old loan',p.afterSale,'money'],['Cash required for replacement and move',p.cashNeeded,'money'],['Cash released / additional cash needed',p.released,'money']],note:'Hypothetical sale and replacement purchase settled together. Sale proceeds first pay entered selling costs, other sale-side costs/tax provision and current mortgage. Replacement cash requirement includes price, purchase costs and moving costs less the assumed new mortgage. Percentage costs are placeholders, not statutory tax calculations or quotations. New financing, closing sequence, bridge interest, actual tax liabilities and mortgage approval are not determined. Negative released cash means additional funding is needed.',charts:[
      {id:'moving-bridge',type:'waterfall',title:'Bridge the sale price to the cash left after the move',unit:'money',rows:[{label:'Current home sale price',value:input.sale},{label:'Percentage-based selling costs',value:-p.selling},{label:'Other sale costs / tax provision',value:-input.sellFixed},{label:'Current mortgage repayment',value:-input.oldDebt},{label:'Replacement home price',value:-input.buy},{label:'Replacement purchase costs',value:-p.purchasing},{label:'Moving and setup costs',value:-input.moving},{label:'Assumed new mortgage funding',value:p.newDebt}],totalLabel:'Cash released / funding needed',note:'Step order reconciles amounts, not closing dates. Positive endpoint means cash released after these settlements; negative means cash to add. New borrowing can increase cash released while leaving more debt. Cash released is not the same as an investment profit or the difference in home prices.'},
      {id:'moving-balance',type:'groupbar',title:'Compare home values and mortgage balances separately',unit:'money',seriesNames:['Home value','Mortgage balance'],rows:[{label:'Current home before sale',values:[input.sale,input.oldDebt]},{label:'Replacement home after purchase',values:[input.buy,p.newDebt]}],note:'The difference within each pair is home equity before transaction costs. Equity is not automatically spendable cash: the replacement purchase, costs and timing still have to be funded.'},
      {id:'moving-costs',type:'bar',title:'The costs that reduce available equity',unit:'money',rows:[{label:'Percentage-based selling costs',value:p.selling},{label:'Other sale costs / tax provision',value:input.sellFixed},{label:'Replacement purchase costs',value:p.purchasing},{label:'Moving and setup',value:input.moving}],note:'Include actual applicable costs once. The other-sale-cost field can contain legal, discharge, prepayment or tax provisions as appropriate; none of those amounts is calculated from legal or contract rules here.'},
      {id:'moving-matrix',type:'heatmap',title:'Cash released under different sale and replacement prices',unit:'money',signed:true,columns:['−10%','Base','+10%','+20%'],rows:[-.1,0,.1,.2].map(x=>({label:x===0?'Buy base':'Buy '+(x<0?'−':'+')+Math.abs(x*100)+'%',values:[-.1,0,.1,.2].map(y=>movingCash({...input,sale:input.sale*(1+y),buy:input.buy*(1+x)}).released)})),note:'Columns scale the selected sale price; rows scale the replacement price. The current mortgage and fixed costs stay unchanged, while percentage costs and the assumed new mortgage scale with the relevant price. These signed cash positions are scenarios, not property-price forecasts or financing approvals.'}
    ]};
  }
  throw Error('Unknown tax or home-transition topic.');
}
