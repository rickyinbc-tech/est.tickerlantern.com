import {evidence,derive,history,median,sources,defaults,calculate,scenarioReturn} from './rbc-model.js';
import {seniorPreset,seniorDate} from './rbc-senior-model.js';
import {initializeReturnRegression} from './rbc-return-ui.js';
const $=s=>document.querySelector(s);
const f=(n,d=2)=>Number(n).toLocaleString('en-CA',{minimumFractionDigits:d,maximumFractionDigits:d});
const money=n=>'C$'+f(n),pct=n=>(n>=0?'+':'')+f(n*100)+'%';
let lastCalculation=null;
let assumptionBasis='Original provider-estimate case: FY2028 exit EPS19.96; reset restores these assumptions.';
function renderModel(){
  const values=Object.fromEntries(new FormData($('#valuation-form')));
  const r=calculate(values),error=$('#model-error');
  error.hidden=!r.error;error.textContent=r.error||'';
  $('#download-model').disabled=Boolean(r.error);lastCalculation=r.error?null:r;
  if(r.error){$('#model-result').textContent='Calculation unavailable until assumptions are corrected.';$('#return-matrix').replaceChildren();$('#live-audit').replaceChildren();return;}
  const v=r.inputs;
  $('#model-result').innerHTML=`<div class="model-output">${[['Current forward P/E',f(r.forwardPE)+'×'],['Current common P/B',f(r.pb)+'×'],['Illustrative exit price',money(r.exitPrice)],['One-year total return',pct(r.totalReturn)]].map(([k,x])=>`<div><span>${k}</span><strong>${x}</strong></div>`).join('')}</div><p class="model-reading">At a ${f(v.hurdle,1)}% one-year hurdle, the required exit price is <b>${money(r.requiredExitPrice)}</b>, requiring <b>${money(r.requiredEPSAt14)} EPS at 14×</b>. The steady-state assumptions imply <b>${f(r.justifiedPB)}× book</b> (${money(r.stableBookValue)} per share as a model cross-check). Today’s P/B implies <b>${f(r.impliedRoe,1)}% sustainable ROE</b> at the entered growth and required return.</p>`;
  let matrix='<div class="table-scroll" tabindex="0" role="region" aria-label="One-year total-return sensitivity"><table><caption>Assumed dividends included; no probabilities, taxes or costs</caption><thead><tr><th scope="col">Exit EPS / multiple</th>';
  for(let p=12;p<=18;p++)matrix+=`<th scope="col">${p}×</th>`;
  matrix+='</tr></thead><tbody>';
  for(const scale of [.8,.9,1,1.1]){const eps=v.exitEPS*scale;matrix+=`<tr${scale===1?' class="matrix-current"':''}><th scope="row">${money(eps)} (${f(scale*100,0)}%)</th>`;for(let p=12;p<=18;p++){const ret=scenarioReturn(v.price,eps,p,v.dividend).totalReturn;matrix+=`<td class="${ret>=0?'return-up':'return-down'}">${pct(ret)}</td>`;}matrix+='</tr>';}
  $('#return-matrix').innerHTML=matrix+'</tbody></table></div>';
  const pre=document.createElement('pre');pre.textContent=`Current forward P/E = ${v.price} / ${v.eps} = ${f(r.forwardPE,6)}×\nCurrent P/B = ${v.price} / ${v.book} = ${f(r.pb,6)}×\nExit price = ${v.exitEPS} × ${v.exitPE} = ${money(r.exitPrice)}\nPrice return = (${r.exitPrice} / ${v.price}) − 1 = ${pct(r.priceReturn)}\nTotal return = (${r.exitPrice} + ${v.dividend}) / ${v.price} − 1 = ${pct(r.totalReturn)}\nRequired exit = ${v.price} × (1 + ${v.hurdle}/100) − ${v.dividend}\n              = ${money(r.requiredExitPrice)}\nJustified P/B = (${v.roe} − ${v.growth}) / (${v.requiredReturn} − ${v.growth})\n              = ${f(r.justifiedPB,6)}×\nImplied ROE = ${v.growth}% + ${f(r.pb,6)} × (${v.requiredReturn}% − ${v.growth}%)\n            = ${f(r.impliedRoe,4)}%`;
  $('#live-audit').replaceChildren(pre);
}
$('#valuation-form').addEventListener('submit',event=>{event.preventDefault();renderModel();});
$('#valuation-form').addEventListener('input',()=>{assumptionBasis='Edited scenario assumptions;check every field and the earnings horizon.';$('#model-basis').textContent=assumptionBasis;renderModel();});
$('#load-senior-case').addEventListener('click',()=>{for(const [key,value] of Object.entries(seniorPreset))$('#model-'+key).value=value;assumptionBasis='Senior base case: our FY2027 EPS18 at 15.5× in October 2027; steady-state 18.1% ROE, 9.5% required return and 5% growth.';$('#model-basis').textContent=assumptionBasis;renderModel();});
// The reset event precedes the browser restoring default control values.
$('#valuation-form').addEventListener('reset',()=>setTimeout(()=>{assumptionBasis='Original provider-estimate case: FY2028 exit EPS19.96; reset restores these assumptions.';$('#model-basis').textContent=assumptionBasis;renderModel();},0));
$('#download-model').addEventListener('click',()=>{
  if(!lastCalculation)return;
  const data={title:'TickerLantern RBC valuation scenario',researchDate:seniorDate,originalValuationDate:evidence.researchDate,priceDate:evidence.priceDate,currency:'CAD',assumptionBasis,horizon:'Illustrative one-year exit around October 2027',...lastCalculation,sourceDefaults:defaults,sourceDefaultsDescription:'Original provider-estimate reset assumptions; actual calculation uses inputs and assumptionBasis',sources,limitations:['Provider estimates or original analyst assumptions as labelled; not company guidance','No probabilities assigned','No reinvestment, taxes or trading costs','Future dividends are assumptions']};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='tickerlantern-rbc-valuation-scenario.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('#print-note').addEventListener('click',()=>window.print());
let printDetails=[];
window.addEventListener('beforeprint',()=>{printDetails=[...document.querySelectorAll('details')].map(el=>({el,open:el.open}));printDetails.forEach(({el})=>el.open=true);});
window.addEventListener('afterprint',()=>printDetails.forEach(({el,open})=>el.open=open));

function renderHistory(metric='pe'){
  const current=derive(),now={pe:current.trailingPE,pb:current.pb,ps:current.ps}[metric];
  const label={pe:'Reported P/E',pb:'Common P/B',ps:'P/reported revenue'}[metric];
  const values=[...history.map(x=>x[metric]),now],sampleMedian=median(history.map(x=>x[metric]));
  const max=Math.ceil(Math.max(...values)*1.15*2)/2,W=900,H=260,L=48,R=55,T=24,B=36;
  const x=i=>L+i*(W-L-R)/(values.length-1),y=v=>T+(max-v)/max*(H-T-B);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}, 2016 through 2025 fiscal year-ends plus current observation"><title>${label}: current ${f(now)} times; historical median ${f(sampleMedian)} times</title>`;
  for(let i=0;i<=4;i++){const v=max*i/4;svg+=`<path d="M${L} ${y(v)}H${W-R}" stroke="#29333d"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" fill="#a5adb7" font-size="10">${f(v,1)}×</text>`;}
  svg+=`<path d="M${L} ${y(sampleMedian)}H${W-R}" stroke="#78caff" stroke-dasharray="5 5"/><text x="${L+6}" y="${y(sampleMedian)-6}" fill="#78caff" font-size="10">10-observation median ${f(sampleMedian)}×</text>`;
  svg+=`<path d="${values.map((v,i)=>(i?'L':'M')+x(i)+' '+y(v)).join(' ')}" stroke="#ff8a00" stroke-width="2" fill="none"/>`;
  values.forEach((v,i)=>{svg+=`<circle cx="${x(i)}" cy="${y(v)}" r="${i===10?5:3}" fill="${i===10?'#ffb000':'#ff8a00'}"><title>${i===10?'Current':history[i].year}: ${f(v)}×</title></circle><text x="${x(i)}" y="${H-12}" text-anchor="middle" fill="${i===10?'#ffb000':'#a5adb7'}" font-size="10">${i===10?'Now':history[i].year}</text>`;});
  svg+=`<text x="${x(10)}" y="${y(now)-11}" text-anchor="middle" fill="#ffb000" font-size="12">${f(now)}×</text></svg><p class="chart-caption">${label} · fiscal year-end sample, not point-in-time trading signals. Current observation: October 16 price / latest reported financials.</p>`;
  $('#history-chart').innerHTML=svg;
  document.querySelectorAll('[data-chart]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chart===metric)));
}
document.querySelectorAll('[data-chart]').forEach(b=>b.addEventListener('click',()=>renderHistory(b.dataset.chart)));
if('IntersectionObserver' in window){
  const sections=[...document.querySelectorAll('.research-section')];
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)document.querySelectorAll('.article-nav a').forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});},{rootMargin:'-10% 0px -65% 0px'});sections.forEach(el=>observer.observe(el));
}
renderModel();renderHistory();
initializeReturnRegression();
