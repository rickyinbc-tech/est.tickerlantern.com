import {returnResearch as research} from './rbc-return-data.js';
import {calculateReturnRegression,forwardPELimits} from './rbc-return-model.js';
const format=(v,n=2)=>Number(v).toLocaleString('en-CA',{minimumFractionDigits:n,maximumFractionDigits:n});
const percent=v=>(v<0?'−':'+')+format(Math.abs(v))+'%';
const escape=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export function initializeReturnRegression(){
  const form=document.getElementById('return-regression-form');
  if(!form)return;
  const slider=document.getElementById('return-pe-slider'),number=document.getElementById('return-pe-number');
  const display=document.getElementById('return-pe-display'),error=document.getElementById('return-regression-error');
  const total=document.getElementById('return-total'),annual=document.getElementById('return-annual');
  const scope=document.getElementById('return-scope'),chart=document.getElementById('return-regression-chart');
  const download=document.getElementById('download-return-calculation');
  const model=research.fits.full['3'],points=research.observations.filter(o=>o.horizon===3);
  let result=calculateReturnRegression(research.referencePE),scales=null;
  const predict=pe=>model.intercept+model.slope*pe;

  function moveMarker(){
    if(!scales)return;
    const marker=chart.querySelector('[data-return-selection]');
    marker.hidden=Boolean(result.error);marker.style.display=result.error?'none':'';
    if(result.error)return;
    const x=scales.x(result.pe),y=scales.y(result.totalReturnPercent);
    const dot=marker.querySelector('circle'),guide=marker.querySelector('line');
    dot.setAttribute('cx',x);dot.setAttribute('cy',y);
    guide.setAttribute('x1',x);guide.setAttribute('x2',x);guide.setAttribute('y1',y);guide.setAttribute('y2',scales.bottom);
    chart.querySelector('svg').setAttribute('aria-label',`Entry forward P/E ${format(result.pe)} times; fitted three-year total return ${percent(result.totalReturnPercent)}. ${result.extrapolation?'Extrapolation beyond observed valuations.':'Within observed valuations; exploratory fit.'}`);
  }
  function render(raw,origin='number'){
    result=calculateReturnRegression(raw);
    error.hidden=!result.error;error.textContent=result.error||'';
    number.setAttribute('aria-invalid',String(Boolean(result.error)));download.disabled=Boolean(result.error);
    if(result.error){
      total.textContent='—';annual.textContent='—';display.textContent='—';
      scope.textContent='No fitted return: correct the forward-P/E input.';moveMarker();return;
    }
    slider.value=String(result.pe);
    if(origin!=='number')number.value=result.pe.toFixed(2);
    display.textContent=format(result.pe)+'×';
    slider.setAttribute('aria-valuetext',`${format(result.pe)} times forward earnings`);
    total.textContent=percent(result.totalReturnPercent);annual.textContent=percent(result.annualEquivalentPercent);
    const range=`${format(model.pe_min)}–${format(model.pe_max)}×`;
    scope.textContent=result.extrapolation
      ?`Extrapolation · outside the observed ${range} range. This is not a validated expected return.`
      :`Within the observed ${range} range · exploratory fit, not a validated expected return.`;
    moveMarker();
  }
  function draw(){
    const width=chart.clientWidth;
    if(width<160)return;
    const height=width<440?310:340,left=66,right=width-14,top=22,bottom=height-54;
    const xs=[...points.map(o=>o.forwardPE),forwardPELimits.min,forwardPELimits.max];
    const ys=[...points.map(o=>o.totalReturnPercent),predict(forwardPELimits.min),predict(forwardPELimits.max),0];
    const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const xpad=(xmax-xmin)*.02,ypad=(ymax-ymin)*.1;
    const x=v=>left+7+(v-(xmin-xpad))/(xmax-xmin+2*xpad)*(right-left-14);
    const y=v=>bottom-7-(v-(ymin-ypad))/(ymax-ymin+2*ypad)*(bottom-top-14);
    scales={x,y,bottom};
    const step=Math.max(25,Math.ceil((ymax-ymin+2*ypad)/4/25)*25),yticks=[];
    for(let v=Math.ceil((ymin-ypad)/step)*step;v<=ymax+ypad;v+=step)yticks.push(v);
    const xticks=width<440?[8,12,16,20]:[8,10,12,14,16,18,20];
    let svg=`<svg viewBox="0 0 ${width} ${height}" height="${height}" role="img" aria-labelledby="return-chart-title return-chart-description"><title id="return-chart-title">Entry forward P/E and subsequent three-year total return</title><desc id="return-chart-description">46 observed quarterly entry periods from 2010 to 2023. The fitted line is solid within observed P/E values and dashed outside them. Historical outcomes overlap. Moving the slider changes the selected estimate.</desc><rect class="regression-frame" x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/><rect class="regression-observed-area" x="${x(model.pe_min)}" y="${top}" width="${x(model.pe_max)-x(model.pe_min)}" height="${bottom-top}"/>`;
    for(const v of yticks)svg+=`<line class="regression-grid" x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}"/><text x="${left-8}" y="${y(v)+4}" text-anchor="end">${format(v,0)}%</text>`;
    svg+=`<line class="regression-zero" x1="${left}" x2="${right}" y1="${y(0)}" y2="${y(0)}"/>`;
    for(const v of xticks)svg+=`<text x="${x(v)}" y="${bottom+21}" text-anchor="middle">${v}</text>`;
    svg+=`<text x="${(left+right)/2}" y="${height-8}" text-anchor="middle">Entry forward P/E (×)</text><text transform="translate(14 ${(top+bottom)/2}) rotate(-90)" text-anchor="middle">Three-year total return (%)</text>`;
    for(const [a,b,outside] of [[8,model.pe_min,true],[model.pe_min,model.pe_max,false],[model.pe_max,20,true]])
      svg+=`<path class="${outside?'regression-extrapolation':'regression-fit'}" d="M${x(a)} ${y(predict(a))} L${x(b)} ${y(predict(b))}"/>`;
    for(const o of points)svg+=`<circle class="regression-observation" cx="${x(o.forwardPE)}" cy="${y(o.totalReturnPercent)}" r="3.5"><title>${escape(o.entry)} · ${escape(o.source)} · ${format(o.forwardPE)}× · ${percent(o.totalReturnPercent)} over three years</title></circle>`;
    svg+='<g data-return-selection><line class="regression-guide"/><circle class="regression-selected" r="6"/></g></svg>';
    chart.innerHTML=svg;moveMarker();
  }
  form.addEventListener('submit',event=>{event.preventDefault();render(number.value);});
  slider.addEventListener('input',()=>render(slider.value,'slider'));
  number.addEventListener('input',()=>render(number.value));
  number.addEventListener('change',()=>{render(number.value);if(!result.error)number.value=result.pe.toFixed(2);});
  download.addEventListener('click',()=>{
    if(result.error)return;
    const payload={title:'TickerLantern RBC forward-P/E return calculation',researchDate:research.updated,priceCutoff:research.priceCutoff,currency:'CAD',
      ...result,fit:model,method:'Direct cumulative three-year total-return OLS; annual equivalent converted from fitted total.',
      sources:research.sources,limitations:research.limitations};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='tickerlantern-rbc-forward-pe-calculation.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  if('ResizeObserver' in window)new ResizeObserver(draw).observe(chart);
  else window.addEventListener('resize',draw);
  render(research.referencePE,'initial');draw();
}
