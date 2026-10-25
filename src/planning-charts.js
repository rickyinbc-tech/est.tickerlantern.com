import { definitions, defaults, planningResult } from './planning-models.js';
export const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=['#087f76','#102f50','#b8822e'];
export function format(value,unit,compact=false) {
  if(value==null)return unit==='months'?'NR':'Unavailable';
  if(unit==='percent')return (value*100).toFixed(compact?1:2)+'%';
  if(unit==='decimal')return value.toFixed(1);
  if(unit==='integer'||unit==='months')return Math.round(value).toLocaleString('en-CA');
  if(unit==='money') {
    if(compact&&Math.abs(value)>=1000000)return '$'+(value/1000000).toFixed(1)+'m';
    if(compact&&Math.abs(value)>=1000)return '$'+Number((value/1000).toFixed(Math.abs(value)>=100000?0:1)).toLocaleString('en-CA')+'k';
    return '$'+value.toLocaleString('en-CA',{maximumFractionDigits:compact?(Math.abs(value)<1?2:Number.isInteger(value)?0:1):2,minimumFractionDigits:0});
  }
  return String(value);
}
const txt=(x,y,value,anchor='start',extra='')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" ${extra}>${escapeHTML(value)}</text>`;
const line=(x1,y1,x2,y2,cls='plot-grid')=>`<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const niceMax=value=>{if(value<=0)return 1;const p=10**Math.floor(Math.log10(value));const n=value/p;return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p;};
const legend=names=>`<ul class="plot-legend">${names.map((name,i)=>`<li><span class="plot-key plot-key-${i}" aria-hidden="true"></span>${escapeHTML(name)}</li>`).join('')}</ul>`;
function svgShell(spec,width,height,inner,description) {
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${spec.id}-title ${spec.id}-desc"><title id="${spec.id}-title">${escapeHTML(spec.title)}</title><desc id="${spec.id}-desc">${escapeHTML(description)} Exact values are available in the chart data table below.</desc>${inner}</svg>`;
}
function linePlot(spec,width) {
  const height=310,left=65,right=20,top=22,bottom=52;
  const ymax=niceMax(Math.max(0,...spec.series.flatMap(s=>s.rows.map(r=>r.value)))),xmax=Math.max(1,...spec.series.flatMap(s=>s.rows.map(r=>r.x)));
  const x=v=>left+v/xmax*(width-left-right),y=v=>height-bottom-v/ymax*(height-top-bottom);
  let body='';
  for(let i=0;i<=4;i++) {const v=ymax*i/4;body+=line(left,y(v),width-right,y(v))+txt(left-9,y(v)+4,format(v,spec.unit,true),'end');}
  const count=width<500?2:4;
  const ticks=[...new Set(Array.from({length:count+1},(_,i)=>Math.round(xmax*i/count)))];
  ticks.forEach(v=>{body+=txt(x(v),height-bottom+24,v,'middle');});
  body+=line(left,top,left,height-bottom,'plot-axis')+line(left,height-bottom,width-right,height-bottom,'plot-axis');
  body+=txt(left+(width-left-right)/2,height-7,spec.xLabel,'middle');
  spec.series.forEach((s,i)=>{
    const d=s.rows.map((r,j)=>(j?'L':'M')+x(r.x).toFixed(2)+','+y(r.value).toFixed(2)).join(' ');
    body+=`<path d="${d}" fill="none" stroke="${colors[i%colors.length]}" stroke-width="2.8"${s.dash?' stroke-dasharray="7 5"':''}/>`;
    const end=s.rows.at(-1);body+=`<circle cx="${x(end.x)}" cy="${y(end.value)}" r="4" fill="${s.dash?'white':colors[i%colors.length]}" stroke="${colors[i%colors.length]}" stroke-width="2"/>`;
  });
  return legend(spec.series.map(s=>s.name+' · ends at '+format(s.rows.at(-1).value,spec.unit)))+svgShell(spec,width,height,body,'Line chart. '+spec.xLabel+'. Values in '+(spec.unit==='money'?'CAD':spec.unit)+'.');
}
function barPlot(spec,width) {
  const left=52,right=18,top=12,group=spec.type==='groupbar',stack=spec.type==='stackbar';
  const rowHeight=group?82:62, height=top+spec.rows.length*rowHeight+40;
  const rowMax=r=>r.values?stack?r.values.reduce((a,b)=>a+b,0):Math.max(...r.values):r.value??0;
  const max=niceMax(Math.max(0,...spec.rows.map(rowMax))),plotWidth=width-left-right;
  const x=v=>left+v/max*plotWidth;
  let body='';
  for(let i=0;i<=4;i++){const v=max*i/4;body+=line(x(v),top+17,x(v),height-32)+txt(x(v),height-10,format(v,spec.unit,true),'middle');}
  spec.rows.forEach((r,index)=>{
    const y=top+index*rowHeight;
    let label=r.label;
    if(label.length>(width<500?35:65))label=label.slice(0,width<500?32:62)+'…';
    body+=txt(left,y+12,label);
    if((stack||group)&&!r.values){body+=txt(left,y+38,'Not repaid in the model limit');return;}
    if(group){r.values.forEach((v,i)=>{body+=`<rect x="${left}" y="${y+22+i*20}" width="${Math.max(0,x(v)-left)}" height="13" fill="${colors[i]}"/>`;});}
    else if(stack){let previous=0;r.values.forEach((v,i)=>{body+=`<rect x="${x(previous)}" y="${y+24}" width="${Math.max(0,x(v)-left)}" height="18" fill="${colors[i]}"/>`;previous+=v;});}
    else body+=`<rect x="${left}" y="${y+24}" width="${Math.max(0,x(r.value)-left)}" height="18" fill="${colors[0]}"/>`;
    const labelValue=group?r.values.map(v=>format(v,spec.unit)).join(' / '):format(rowMax(r),spec.unit);
    // Values sit on a separate text row so long currency labels never clip the plot.
    body+=txt(left,y+(group?77:57),labelValue,'start','class="plot-value"');
  });
  body+=line(left,top+17,left,height-32,'plot-axis')+line(left,height-32,width-right,height-32,'plot-axis');
  return (spec.seriesNames?legend(spec.seriesNames):'')+svgShell(spec,width,height,body,'Horizontal '+(group?'grouped ':stack?'stacked ':'')+'bar chart. '+(spec.unit==='money'?'CAD; value axis starts at zero.':'Value axis starts at zero.'));
}
function heatPlot(spec,width) {
  const left=width<450?77:110,right=10,top=43,cellHeight=56;
  const cellWidth=(width-left-right)/spec.columns.length,height=top+spec.rows.length*cellHeight+13;
  const values=spec.rows.flatMap(r=>r.values).filter(v=>v!=null),min=Math.min(0,...values),max=Math.max(0,...values),span=Math.max(1e-9,max-min);
  let body='';
  spec.columns.forEach((label,i)=>body+=txt(left+(i+.5)*cellWidth,22,label,'middle'));
  spec.rows.forEach((row,i)=>{
    body+=txt(left-8,top+(i+.5)*cellHeight+5,row.label,'end');
    row.values.forEach((value,j)=>{
      const x=left+j*cellWidth,y=top+i*cellHeight;
      let fill='#f0f3f5';
      if(value!=null){
        const t=spec.signed?Math.abs(value)/Math.max(Math.abs(min),Math.abs(max),1e-9):(value-min)/span;
        const target=spec.signed&&value<0?[184,130,46]:[8,127,118];
        const rgb=target.map((c,k)=>Math.round([246,249,248][k]*(1-t*.65)+c*t*.65));
        fill='rgb('+rgb.join(',')+')';
      }
      body+=`<rect x="${x+1}" y="${y+1}" width="${cellWidth-2}" height="${cellHeight-2}" fill="${fill}"/>`;
      body+=txt(x+cellWidth/2,y+cellHeight/2+5,value==null?'NR':format(value,spec.unit,true),'middle','class="plot-cell-label"');
    });
  });
  const scale=spec.signed?'Negative purchasing-power returns use gold; positive returns use teal.':`Darker cells mean larger values. Scale: ${format(min,spec.unit,true)} to ${format(max,spec.unit,true)}.`;
  return svgShell(spec,width,height,body,'Scenario matrix. '+scale)+`<p class="plot-scale">${escapeHTML(scale)}</p>`;
}
function returnsPlot(spec,width) {
  const height=320,left=51,right=15,top=20,bottom=40,lo=-.25,hi=.20;
  const y=v=>top+(hi-v)/(hi-lo)*(height-top-bottom),step=(width-left-right)/spec.rows.length;
  let body='';
  [-.2,-.1,0,.1,.2].forEach(v=>body+=line(left,y(v),width-right,y(v),v===0?'plot-axis':'plot-grid')+txt(left-8,y(v)+4,Math.round(v*100)+'%','end'));
  spec.rows.forEach((r,i)=>{r.values.forEach((v,j)=>{
    const barWidth=step*.3,x=left+i*step+step*.14+j*step*.34;
    body+=`<rect x="${x}" y="${Math.min(y(v),y(0))}" width="${barWidth}" height="${Math.abs(y(v)-y(0))}" fill="${colors[j]}"/>`;
  });body+=txt(left+(i+.5)*step,height-14,r.label,'middle');});
  body+=line(left,top,left,height-bottom,'plot-axis');
  return legend(spec.seriesNames)+svgShell(spec,width,height,body,'Grouped annual return bars. Negative returns appear below the zero line.');
}
function chartTable(spec) {
  let headers,rows;
  if(spec.series){headers=[spec.xLabel,'Series','Value'];rows=spec.series.flatMap(s=>s.rows.map(r=>[r.x,s.name,format(r.value,spec.unit)]));}
  else if(spec.type==='heatmap'){headers=['Assumption',...spec.columns];rows=spec.rows.map(r=>[r.label,...r.values.map(v=>format(v,spec.unit))]);}
  else if(spec.seriesNames){headers=['Scenario',...spec.seriesNames];rows=spec.rows.map(r=>[r.label,...spec.seriesNames.map((_,i)=>r.values?format(r.values[i],spec.unit):'Not repaid')]);}
  else {headers=['Scenario','Value'];rows=spec.rows.map(r=>[r.label,format(r.value,spec.unit)]);}
  return `<details class="plot-data"><summary>View chart data</summary><div class="guide-table" tabindex="0" role="region" aria-label="${escapeHTML(spec.title)} data"><table><caption>${escapeHTML(spec.title)} · ${spec.unit==='money'?'CAD':spec.unit==='percent'?'percent':spec.unit}</caption><thead><tr>${headers.map(h=>`<th scope="col">${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>'<tr>'+row.map((v,i)=>i?`<td>${escapeHTML(v)}</td>`:`<th scope="row">${escapeHTML(v)}</th>`).join('')+'</tr>').join('')}</tbody></table></div></details>`;
}
export function renderFigure(spec,width=760) {
  width=Math.max(300,Math.round(width));
  const chart=spec.type==='line'?linePlot(spec,width):spec.type==='heatmap'?heatPlot(spec,width):spec.type==='returns'?returnsPlot(spec,width):barPlot(spec,width);
  return `<figure class="planning-figure" id="${spec.id}"><figcaption><span class="planning-evidence">${spec.source?'Official statistics':'Hypothetical scenario'}</span><h3>${escapeHTML(spec.title)}</h3><p class="plot-unit">${spec.unit==='money'?'Canadian dollars (CAD)':spec.unit==='percent'?'Percentage returns':spec.unit==='months'?'Months to repay':'Scenario values'}</p></figcaption><div class="plot-drawing">${chart}</div>${spec.note?'<p class="plot-note">'+escapeHTML(spec.note)+'</p>':''}${spec.source?`<p class="plot-note"><a href="${spec.source}">Statistics Canada · original source ↗</a></p>`:''}${chartTable(spec)}</figure>`;
}
export function renderResult(result,width=1000) {
  return `<div class="planning-metrics" aria-live="polite">${result.metrics.map(([label,value,unit,custom])=>`<div><span>${escapeHTML(label)}</span><strong>${escapeHTML(custom??(unit==='months'&&value==null?'Not repaid':format(value,unit)))}</strong></div>`).join('')}</div><p class="planning-assumptions">${escapeHTML(result.note)}</p><div class="planning-figures">${result.charts.map(c=>renderFigure(c,width)).join('')}</div>`;
}
export function renderPlanningExplorer(kind) {
  const def=definitions[kind];
  return `<section class="planning-explorer guide-width" data-planning-app="${kind}" aria-labelledby="explorer-title"><div class="planning-explorer-heading"><div><p class="guide-kicker">Change an assumption. Follow the result.</p><h2 id="explorer-title">${def.title}</h2></div><span class="planning-label">Interactive planning lab</span></div><form class="planning-controls" novalidate>${def.fields.map(([key,label,value,min,max,step])=>`<label for="planning-${key}">${escapeHTML(label)}<input type="number" inputmode="decimal" id="planning-${key}" name="${key}" value="${value}" min="${min}" max="${max}" step="${step}" aria-describedby="help-${key}"><small id="help-${key}">Range ${min.toLocaleString('en-CA')} to ${max.toLocaleString('en-CA')}</small></label>`).join('')}<button type="button" class="planning-reset">Restore example</button></form><p class="planning-error" role="alert" hidden></p><noscript><p>The example charts below work without JavaScript. Enable JavaScript to change assumptions.</p></noscript><div class="planning-results">${renderResult(planningResult(kind,defaults(kind)))}</div></section>`;
}
