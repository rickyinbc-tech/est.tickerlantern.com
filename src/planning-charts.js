import { definitions, defaults, planningResult } from './planning-models.js';
export const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=['#087f76','#102f50','#b8822e'];
export function format(value,unit,compact=false) {
  if(value==null)return unit==='months'?'NR':'Unavailable';
  if(unit==='count') {
    const amount=Math.abs(value);
    if(compact&&amount>=1000000)return Number((value/1000000).toFixed(1)).toLocaleString('en-CA')+'m';
    if(compact&&amount>=1000)return Number((value/1000).toFixed(1)).toLocaleString('en-CA')+'k';
    return Math.round(value).toLocaleString('en-CA');
  }
  if(unit==='percent')return (value*100).toFixed(compact?1:2)+'%';
  if(unit==='pp')return (compact?Number((value*100).toFixed(2)):(value*100).toFixed(2))+' pp';
  if(unit==='cents')return value.toFixed(compact?1:2)+'¢';
  if(unit==='decimal')return value.toFixed(1);
  if(unit==='shares') {
    if(compact&&Math.abs(value)>=1000000)return Number((value/1000000).toFixed(2)).toLocaleString('en-CA')+'m';
    if(compact&&Math.abs(value)>=1000)return Number((value/1000).toFixed(2)).toLocaleString('en-CA')+'k';
    return value.toLocaleString('en-CA',{maximumFractionDigits:compact?2:6});
  }
  if(unit==='billions')return value.toLocaleString('en-CA',{maximumFractionDigits:compact?0:3});
  if(unit==='integer'||unit==='months')return Math.round(value).toLocaleString('en-CA');
  if(unit==='money') {
    const prefix=(value<0?'-':'')+'$',amount=Math.abs(value);
    if(compact&&amount>=1000000000)return prefix+Number((amount/1000000000).toFixed(1)).toLocaleString('en-CA')+'b';
    if(compact&&amount>=1000000)return prefix+(amount/1000000).toFixed(1)+'m';
    if(compact&&amount>=1000)return prefix+Number((amount/1000).toFixed(amount>=100000?0:1)).toLocaleString('en-CA')+'k';
    return prefix+amount.toLocaleString('en-CA',{maximumFractionDigits:compact?(amount<1?2:Number.isInteger(amount)?0:1):2,minimumFractionDigits:0});
  }
  return String(value);
}
const txt=(x,y,value,anchor='start',extra='')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" ${extra}>${escapeHTML(value)}</text>`;
const line=(x1,y1,x2,y2,cls='plot-grid')=>`<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const niceMax=value=>{if(value<=0)return 1;const p=10**Math.floor(Math.log10(value));const n=value/p;return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p;};
const legend=(names,fill=false,series=null)=>`<ul class="plot-legend">${names.map((name,i)=>`<li><span class="plot-key plot-key-${i}${fill?' plot-key-fill':''}"${series&&!fill?` style="border-color:${colors[i%colors.length]};border-top-style:${series[i].dash?'dashed':'solid'}"`:''} aria-hidden="true"></span>${escapeHTML(name)}</li>`).join('')}</ul>`;
function svgShell(spec,width,height,inner,description) {
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${spec.id}-title ${spec.id}-desc"><title id="${spec.id}-title">${escapeHTML(spec.title)}</title><desc id="${spec.id}-desc">${escapeHTML(description)} Exact values are available in the chart data table below.</desc>${inner}</svg>`;
}
function fanPlot(spec,width) {
  const height=340,left=65,right=20,top=20,bottom=52;
  const rows=spec.rows;
  if(!rows.length||rows.some(r=>![r.x,r.low,r.q25,r.median,r.q75,r.high].every(Number.isFinite)||r.low<0||r.low>r.q25||r.q25>r.median||r.median>r.q75||r.q75>r.high))throw Error('Fan-chart quantiles must be finite, non-negative and ordered.');
  const xmax=Math.max(1,...rows.map(r=>r.x)),ymax=niceMax(Math.max(...rows.map(r=>r.high)));
  const x=v=>left+v/xmax*(width-left-right),y=v=>height-bottom-v/ymax*(height-top-bottom);
  let body='';
  for(let i=0;i<=4;i++){const v=ymax*i/4;body+=line(left,y(v),width-right,y(v))+txt(left-9,y(v)+4,format(v,spec.unit,true),'end');}
  const ticks=[...new Set(Array.from({length:width<500?3:5},(_,i)=>Math.round(xmax*i/(width<500?2:4))))];
  for(const v of ticks)body+=txt(x(v),height-bottom+24,v,'middle');
  const band=(lower,upper,fill)=>{
    const points=rows.map(r=>x(r.x).toFixed(2)+','+y(r[upper]).toFixed(2)).concat([...rows].reverse().map(r=>x(r.x).toFixed(2)+','+y(r[lower]).toFixed(2)));
    return `<polygon points="${points.join(' ')}" fill="${fill}"/>`;
  };
  body+=band('low','high','#dbece8')+band('q25','q75','#a6cec7');
  body+=`<path d="${rows.map((r,i)=>(i?'L':'M')+x(r.x).toFixed(2)+','+y(r.median).toFixed(2)).join(' ')}" fill="none" stroke="#102f50" stroke-width="2.8"/>`;
  body+=line(left,top,left,height-bottom,'plot-axis')+line(left,height-bottom,width-right,height-bottom,'plot-axis')+txt(left+(width-left-right)/2,height-7,spec.xLabel,'middle');
  const keys='<ul class="plot-legend"><li><span class="plot-key plot-key-fill plot-key-fan-outer" aria-hidden="true"></span>5th–95th percentiles</li><li><span class="plot-key plot-key-fill plot-key-fan-inner" aria-hidden="true"></span>25th–75th percentiles</li><li><span class="plot-key plot-key-fan-median" aria-hidden="true"></span>Median</li></ul>';
  return keys+svgShell(spec,width,height,body,'Pointwise percentile fan. Shaded regions describe the assumed distribution at each year, not a prediction interval for an entire investment path. Vertical axis begins at zero; values in CAD.');
}
function scatterPlot(spec,width) {
  if(!spec.rows.length||spec.rows.some(r=>!Number.isFinite(r.x)||r.x<0||!Number.isFinite(r.value)))throw Error('Scatter coordinates must be finite; this chart requires a non-negative horizontal measure.');
  const height=350,left=64,right=22,top=25,bottom=58;
  const xmax=niceMax(Math.max(.01,...spec.rows.map(r=>r.x))),minimum=Math.min(0,...spec.rows.map(r=>r.value)),maximum=Math.max(0,...spec.rows.map(r=>r.value));
  const ymin=minimum<0?-niceMax(-minimum):0,ymax=maximum>0?niceMax(maximum):minimum<0?0:.01;
  const x=v=>left+v/xmax*(width-left-right),y=v=>height-bottom-(v-ymin)/(ymax-ymin)*(height-top-bottom);
  let body='';
  for(let i=0;i<=4;i++){
    const xv=xmax*i/4,yv=ymin+(ymax-ymin)*i/4;
    body+=line(x(xv),top,x(xv),height-bottom)+txt(x(xv),height-bottom+24,format(xv,spec.xUnit,true),'middle');
    body+=line(left,y(yv),width-right,y(yv))+txt(left-9,y(yv)+4,format(yv,spec.unit,true),'end');
  }
  body+=line(left,top,left,height-bottom,'plot-axis')+line(left,height-bottom,width-right,height-bottom,'plot-axis');
  if(ymin<0&&ymax>0)body+=line(left,y(0),width-right,y(0),'plot-axis');
  for(const row of [...spec.rows].sort((a,b)=>Number(Boolean(a.selected))-Number(Boolean(b.selected)))){
    const px=x(row.x),py=y(row.value),selected=Boolean(row.selected);
    body+=`<circle cx="${px}" cy="${py}" r="${selected?5.5:3.5}" fill="${selected?colors[0]:'white'}" stroke="${selected?colors[0]:colors[1]}" stroke-width="${selected?2.4:1.5}" tabindex="0" role="img" aria-label="${escapeHTML(row.label+': '+spec.xLabel+' '+format(row.x,spec.xUnit)+', '+spec.yLabel+' '+format(row.value,spec.unit))}"><title>${escapeHTML(row.label+': '+format(row.x,spec.xUnit)+' / '+format(row.value,spec.unit))}</title></circle>`;
  }
  const placed=[],overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  for(const row of spec.rows.filter(r=>r.annotate||r.selected).sort((a,b)=>Number(Boolean(b.selected))-Number(Boolean(a.selected)))){
    const px=x(row.x),py=y(row.value),labelWidth=String(row.label).length*7.5;
    const candidates=[-12,22,-30,40,-48,58].flatMap(dy=>[[-10,dy,'end'],[10,dy,'start']]).map(([dx,dy,anchor])=>{
      const tx=px+dx,ty=py+dy,box={left:anchor==='end'?tx-labelWidth:tx,right:anchor==='end'?tx:tx+labelWidth,top:ty-13,bottom:ty+3};
      const outside=box.left<left+2||box.right>width-right-2||box.top<top+2||box.bottom>height-bottom-2;
      const collisions=spec.rows.filter(r=>overlap(box,{left:x(r.x)-8,right:x(r.x)+8,top:y(r.value)-8,bottom:y(r.value)+8})).length+placed.filter(b=>overlap(box,b)).length;
      return {tx,ty,anchor,box,score:collisions+(outside?100:0)};
    });
    const chosen=candidates.reduce((best,c)=>c.score<best.score?c:best);placed.push(chosen.box);
    if(spec.labelLeaders)body+=line(px,py,chosen.tx+(chosen.anchor==='end'?3:-3),chosen.ty-4,'plot-grid');
    body+=txt(chosen.tx,chosen.ty,row.label,chosen.anchor);
  }
  body+=txt(left+(width-left-right)/2,height-7,spec.xLabel,'middle');
  return `<p class="plot-unit">Vertical axis: ${escapeHTML(spec.yLabel)}</p>`+svgShell(spec,width,height,body,'Scatter chart. Horizontal axis: '+spec.xLabel+'. Vertical axis: '+spec.yLabel+'. '+(spec.pointContext??'Filled larger marker identifies the selected allocation; hollow markers are alternatives.'))+'<p class="plot-scale">'+escapeHTML(spec.pointContext??'Filled larger point: selected allocation. Hollow points: alternative allocations. All points are calculated scenarios, not observed annual returns.')+'</p>';
}
function linePlot(spec,width) {
  const height=310,left=65,right=20,top=22,bottom=52;
  const values=spec.series.flatMap(s=>s.rows.map(r=>r.value)),ymax=spec.yMax??niceMax(Math.max(0,...values)),ymin=spec.yMin??(Math.min(0,...values)<0?-niceMax(-Math.min(...values)):0);
  if(values.some(v=>!Number.isFinite(v))||!Number.isFinite(ymin)||!Number.isFinite(ymax)||ymax<=ymin||Math.min(...values)<ymin||Math.max(...values)>ymax)throw Error('Line-chart axis must include all finite observations.');
  const xmin=spec.xMin??0,xmax=Math.max(xmin+1,...spec.series.flatMap(s=>s.rows.map(r=>r.x)));
  const x=v=>left+(v-xmin)/(xmax-xmin)*(width-left-right),y=v=>height-bottom-(v-ymin)/(ymax-ymin)*(height-top-bottom);
  let body='';
  const yticks=[...new Set([...Array.from({length:5},(_,i)=>ymin+(ymax-ymin)*i/4),...(ymin<0?[0]:[])])];
  for(const v of yticks) {body+=line(left,y(v),width-right,y(v));if(v===0||ymin===0||Math.abs(y(v)-y(0))>=18)body+=txt(left-9,y(v)+4,format(v,spec.unit,spec.compactYTicks!==false),'end');}
  const count=width<500?2:4;
  const ticks=spec.xTicks??[...new Set(Array.from({length:count+1},(_,i)=>Math.round(xmin+(xmax-xmin)*i/count)))].map(value=>({value,label:spec.xUnit?format(value,spec.xUnit,true):value}));
  ticks.forEach(t=>{body+=txt(x(t.value),height-bottom+24,t.label,'middle');});
  body+=line(left,top,left,height-bottom,'plot-axis')+line(left,height-bottom,width-right,height-bottom,'plot-axis');
  if(ymin<0)body+=line(left,y(0),width-right,y(0),'plot-axis');
  body+=txt(left+(width-left-right)/2,height-7,spec.xLabel,'middle');
  spec.series.forEach((s,i)=>{
    const d=s.rows.map((r,j)=>j&&s.step?'H'+x(r.x).toFixed(2)+'V'+y(r.value).toFixed(2):(j?'L':'M')+x(r.x).toFixed(2)+','+y(r.value).toFixed(2)).join(' ');
    body+=`<path d="${d}" fill="none" stroke="${colors[i%colors.length]}" stroke-width="2.8"${s.dash?' stroke-dasharray="7 5"':''}/>`;
    const end=s.rows.at(-1);body+=`<circle cx="${x(end.x)}" cy="${y(end.value)}" r="4" fill="${s.dash?'white':colors[i%colors.length]}" stroke="${colors[i%colors.length]}" stroke-width="2"/>`;
  });
  return legend(spec.series.map(s=>s.name+' · ends at '+format(s.rows.at(-1).value,spec.unit)),false,spec.series)+svgShell(spec,width,height,body,'Line chart. '+spec.xLabel+'. Values in '+(spec.valueUnitLabel??(spec.unit==='money'?(spec.currency??'CAD'):spec.unit))+'.'+(spec.yMin!=null||spec.yMax!=null?' Vertical axis '+format(ymin,spec.unit)+' to '+format(ymax,spec.unit)+'.':''));
}
function barPlot(spec,width) {
  const left=52,right=spec.axisRight??(spec.unit==='percent'?30:18),top=12,group=spec.type==='groupbar',stack=spec.type==='stackbar';
  const interval=spec.type==='intervalbar';
  const groupCount=spec.seriesNames?.length??2,rowHeight=group?42+20*groupCount:interval?86:62, height=top+spec.rows.length*rowHeight+40;
  const rowMax=r=>r.values?stack?r.values.reduce((a,b)=>a+b,0):Math.max(...r.values):interval?Math.max(r.value,r.upper):r.value??0;
  const max=niceMax(Math.max(0,...spec.rows.map(rowMax))),plotWidth=width-left-right;
  const x=v=>left+v/max*plotWidth;
  let body='';
  const tickCount=spec.axisTicks??4;
  for(let i=0;i<=tickCount;i++){const v=max*i/tickCount;body+=line(x(v),top+17,x(v),height-32)+txt(x(v),height-10,format(v,spec.unit,true),'middle');}
  spec.rows.forEach((r,index)=>{
    const y=top+index*rowHeight;
    let label=r.label;
    if(label.length>(width<500?35:65))label=label.slice(0,width<500?32:62)+'…';
    body+=txt(left,y+12,label);
    if((stack||group)&&!r.values){body+=txt(left,y+38,'Not repaid in the model limit');return;}
    if(group){r.values.forEach((v,i)=>{body+=`<rect x="${left}" y="${y+22+i*20}" width="${Math.max(0,x(v)-left)}" height="13" fill="${colors[i]}"/>`;});}
    else if(stack){let previous=0;r.values.forEach((v,i)=>{body+=`<rect x="${x(previous)}" y="${y+24}" width="${Math.max(0,x(v)-left)}" height="18" fill="${colors[i]}"/>`;previous+=v;});}
    else body+=`<rect x="${left}" y="${y+24}" width="${Math.max(0,x(r.value)-left)}" height="18" fill="${colors[0]}"/>`;
    if(interval){
      const lo=x(r.lower),hi=x(r.upper),cy=y+33,d=`M${lo},${cy}H${hi}M${lo},${cy-5}V${cy+5}M${hi},${cy-5}V${cy+5}`;
      body+=`<path d="${d}" fill="none" stroke="white" stroke-width="4"/><path d="${d}" fill="none" stroke="${colors[1]}" stroke-width="1.6"/>`;
      body+=txt(left,y+77,'95% CI: '+format(r.lower,spec.unit)+'–'+format(r.upper,spec.unit),'start','class="plot-value"');
    }
    const labelValue=group?r.values.map(v=>format(v,spec.unit)).join(' / '):format(interval?r.value:rowMax(r),spec.unit);
    // Values sit on a separate text row so long currency labels never clip the plot.
    body+=txt(left,y+(group?37+20*groupCount:57),labelValue,'start','class="plot-value"');
  });
  body+=line(left,top+17,left,height-32,'plot-axis')+line(left,height-32,width-right,height-32,'plot-axis');
  return (spec.seriesNames?legend(spec.seriesNames,true):'')+svgShell(spec,width,height,body,'Horizontal '+(group?'grouped ':stack?'stacked ':'')+'bar chart. '+(spec.unit==='money'?(spec.currency??'CAD')+'; value axis starts at zero.':'Value axis starts at zero.')+(interval?' Whiskers show the published lower and upper bounds of a 95% confidence interval around each estimate.':''));
}
function signedBarPlot(spec,width) {
  const left=64,right=30,top=12,rowHeight=70,height=top+spec.rows.length*rowHeight+42;
  const values=spec.rows.map(r=>r.value),min=Math.min(0,...values),max=Math.max(0,...values);
  const lo=min<0?-niceMax(-min):0,hi=max>0?niceMax(max):lo<0?0:1;
  const x=value=>left+(value-lo)/(hi-lo)*(width-left-right);
  let body='';
  const ticks=[...new Set([...Array.from({length:5},(_,i)=>lo+(hi-lo)*i/4),0])].sort((a,b)=>a-b);
  for(const v of ticks){
    if(v!==0&&Math.abs(x(v)-x(0))<34)continue;
    const label=spec.axisDecimals==null?format(v,spec.unit,true):Number(v.toFixed(spec.axisDecimals)).toLocaleString('en-CA',{useGrouping:false});
    body+=line(x(v),top+18,x(v),height-32,v===0?'plot-axis':'plot-grid')+txt(x(v),height-10,label,'middle');
  }
  spec.rows.forEach((row,index)=>{
    const y=top+index*rowHeight,maxLabel=width<500?32:65,label=row.label.length>maxLabel?row.label.slice(0,maxLabel-1)+'…':row.label;
    body+=txt(left,y+12,label);
    body+=`<rect x="${Math.min(x(row.value),x(0))}" y="${y+24}" width="${Math.abs(x(row.value)-x(0))}" height="18" fill="${row.value<0?colors[2]:colors[0]}"/>`;
    body+=txt(left,y+57,format(row.value,spec.unit),'start','class="plot-value"');
  });
  body+=line(left,height-32,width-right,height-32,'plot-axis');
  return svgShell(spec,width,height,body,'Horizontal signed bars around an explicit zero axis. Negative values extend left of zero, and positive values extend right. Signs and exact values are included in labels and the data table.');
}
function tornadoPlot(spec,width) {
  if(!spec.rows.length||spec.rows.some(r=>!Number.isFinite(r.low)||!Number.isFinite(r.high)))throw Error('Sensitivity endpoints must be finite.');
  const left=65,right=24,top=12,rowHeight=93,height=top+spec.rows.length*rowHeight+43;
  const values=spec.rows.flatMap(r=>[r.low,r.high]),minimum=Math.min(0,...values),maximum=Math.max(0,...values);
  const lo=minimum<0?-niceMax(-minimum):0,hi=maximum>0?niceMax(maximum):minimum<0?0:1;
  const x=v=>left+(v-lo)/(hi-lo)*(width-left-right);
  let body='';
  const ticks=[...new Set([...Array.from({length:5},(_,i)=>lo+(hi-lo)*i/4),0])].sort((a,b)=>a-b);
  for(const value of ticks){if(value!==0&&value!==lo&&value!==hi&&Math.abs(x(value)-x(0))<38)continue;body+=line(x(value),top+20,x(value),height-33,value===0?'plot-axis':'plot-grid')+txt(x(value),height-10,format(value,spec.unit,true),'middle');}
  spec.rows.forEach((row,index)=>{
    const y=top+index*rowHeight;
    body+=txt(left,y+12,row.label);
    body+=`<rect x="${x(Math.min(row.low,row.high))}" y="${y+25}" width="${Math.abs(x(row.high)-x(row.low))}" height="14" fill="#dce8eb"/>`;
    body+=`<circle cx="${x(row.low)}" cy="${y+32}" r="4.5" fill="${colors[0]}" stroke="${colors[0]}" stroke-width="1.8"/><circle cx="${x(row.high)}" cy="${y+32}" r="4.5" fill="white" stroke="${colors[1]}" stroke-width="2"/>`;
    body+=txt(left,y+59,'Lower input: '+format(row.low,spec.unit),'start','class="plot-value"');
    body+=txt(left,y+78,'Higher input: '+format(row.high,spec.unit),'start','class="plot-value"');
  });
  body+=line(left,height-33,width-right,height-33,'plot-axis');
  return '<p class="plot-unit">Filled teal marker: lower input. Open navy marker: higher input. Zero means no change from the baseline gap.</p>'+svgShell(spec,width,height,body,'One-at-a-time sensitivity chart. Each neutral bar joins the output changes at the lower and higher tested input. Negative changes reduce the gap; positive changes increase it. Ranges are authored scenarios, not confidence intervals or probabilities.');
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
      body+=txt(x+cellWidth/2,y+cellHeight/2+5,value==null?(spec.unavailableLabel??'NR'):format(value,spec.unit,spec.compactValues!==false),'middle','class="plot-cell-label"');
    });
  });
  const scale=spec.signed?'Negative values use gold; positive values use teal. Read the signed cell labels.':`Darker cells mean larger values. Scale: ${format(min,spec.unit,true)} to ${format(max,spec.unit,true)}.`;
  return svgShell(spec,width,height,body,'Scenario matrix. '+scale)+`<p class="plot-scale">${escapeHTML(scale)}</p>`;
}
function waterfallPlot(spec,width){
  const left=64,right=20,top=14,rowHeight=67;
  let cumulative=0;
  const rows=spec.rows.map(r=>{const start=cumulative;cumulative+=r.value;return {...r,start,end:cumulative};});
  rows.push({label:spec.totalLabel||'Net total',value:cumulative,start:0,end:cumulative,total:true});
  const low=-niceMax(Math.abs(Math.min(0,...rows.flatMap(r=>[r.start,r.end]))));
  const high=niceMax(Math.max(0,...rows.flatMap(r=>[r.start,r.end])));
  const lo=rows.every(r=>r.start>=0&&r.end>=0)?0:low,hi=rows.every(r=>r.start<=0&&r.end<=0)?0:high;
  const span=hi>lo?hi-lo:1,height=top+rows.length*rowHeight+42;
  const x=v=>left+(v-lo)/span*(width-left-right);
  let body='';
  const ticks=[...new Set([...Array.from({length:5},(_,i)=>lo+span*i/4),0])];
  for(const v of ticks){body+=line(x(v),top,x(v),height-34);if(v===0||lo===0||hi===0||Math.abs(x(v)-x(0))>=38)body+=txt(x(v),height-10,format(v,spec.unit,true),'middle');}
  body+=line(x(0),top,x(0),height-34,'plot-axis');
  rows.forEach((r,i)=>{
    const y=top+i*rowHeight,label=r.label.length>(width<500?32:65)?r.label.slice(0,width<500?29:62)+'…':r.label;
    body+=txt(left,y+12,label);
    body+=`<rect x="${x(Math.min(r.start,r.end))}" y="${y+23}" width="${Math.abs(x(r.end)-x(r.start))}" height="18" fill="${r.total?colors[1]:r.value>=0?colors[0]:colors[2]}"/>`;
    body+=txt(left,y+57,(r.total?'':r.value>0?'+':'')+format(r.value,spec.unit),'start','class="plot-value"');
    if(i<rows.length-2)body+=`<line x1="${x(r.end)}" x2="${x(r.end)}" y1="${y+41}" y2="${y+rowHeight+23}" stroke="#7f939e" stroke-dasharray="2 3"/>`;
  });
  body+=line(left,height-34,width-right,height-34,'plot-axis');
  return svgShell(spec,width,height,body,'Horizontal waterfall. Teal steps add to the running amount, gold steps subtract, and the navy endpoint is the total. Negative endpoints extend left of zero on the value scale.');
}
function donutPlot(spec,width){
  const height=270,total=spec.rows.reduce((sum,r)=>sum+r.value,0),cx=width/2,cy=130,r=86;
  let body=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e3ebed" stroke-width="34"/>`,offset=0;
  if(total>0)spec.rows.forEach((row,i)=>{
    const share=row.value/total*100;
    body+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i%colors.length]}" stroke-width="34" pathLength="100" stroke-dasharray="${share} ${100-share}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset+=share;
  });
  body+=txt(cx,cy-7,format(total,spec.unit,true),'middle','class="plot-donut-total"')+txt(cx,cy+20,spec.centerLabel||(total?'Total listed assets':'No listed assets'),'middle');
  const keys=spec.rows.map(row=>row.label+' · '+format(row.value,spec.unit)+' · '+(total?(row.value/total*100).toFixed(1)+'%':'allocation unavailable'));
  return svgShell(spec,width,height,body,spec.description||'Donut chart showing the composition of listed gross assets, before debt. Zero total assets produce an empty ring.')+legend(keys,true);
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
  return legend(spec.seriesNames,true)+svgShell(spec,width,height,body,'Grouped annual return bars. Negative returns appear below the zero line.');
}
function chartTable(spec) {
  let headers,rows;
  if(spec.type==='scatter'){headers=[spec.pointLabelHeader??'Allocation',spec.xLabel,spec.yLabel];rows=spec.rows.map(r=>[r.label,format(r.x,spec.xUnit),format(r.value,spec.unit)]);}
  else if(spec.type==='tornado'){headers=['Assumption','Lower tested input','Change in gap at lower input','Higher tested input','Change in gap at higher input'];rows=spec.rows.map(r=>[r.label,r.lowLabel,format(r.low,spec.unit),r.highLabel,format(r.high,spec.unit)]);}
  else if(spec.type==='fan'){headers=[spec.xLabel,'5th percentile','25th percentile','Median','75th percentile','95th percentile'];rows=spec.rows.map(r=>[r.x,...['low','q25','median','q75','high'].map(key=>format(r[key],spec.unit))]);}
  else if(spec.type==='waterfall'){let cumulative=0;headers=['Step','Change','Running total'];rows=spec.rows.map(r=>{cumulative+=r.value;return [r.label,format(r.value,spec.unit),format(cumulative,spec.unit)];});rows.push([spec.totalLabel||'Net total','—',format(cumulative,spec.unit)]);}
  else if(spec.series){headers=[spec.xLabel,'Series','Value'];rows=spec.series.flatMap(s=>s.rows.map(r=>[r.label??r.x,s.name,format(r.value,spec.unit)]));}
  else if(spec.type==='heatmap'){headers=[spec.rowLabel??'Assumption',...spec.columns];rows=spec.rows.map(r=>[r.label,...r.values.map(v=>v==null&&spec.unavailableLabel?spec.unavailableLabel:format(v,spec.unit))]);}
  else if(spec.seriesNames){headers=[spec.rowLabel??'Scenario',...spec.seriesNames];rows=spec.rows.map(r=>[r.label,...spec.seriesNames.map((_,i)=>r.values?format(r.values[i],spec.unit):'Not repaid')]);}
  else if(spec.type==='intervalbar'){headers=[spec.rowLabel??'Scenario','Estimate','95% CI lower','95% CI upper'];rows=spec.rows.map(r=>[r.label,format(r.value,spec.unit),format(r.lower,spec.unit),format(r.upper,spec.unit)]);}
  else {headers=[spec.rowLabel??'Scenario','Value'];rows=spec.rows.map(r=>[r.label,format(r.value,spec.unit)]);}
  const tableUnit=spec.tableUnit??(spec.unit==='money'?'CAD':spec.unit==='percent'?'percent':spec.unit);
  return `<details class="plot-data"><summary>View chart data</summary><div class="guide-table" tabindex="0" role="region" aria-label="${escapeHTML(spec.title)} data"><table><caption>${escapeHTML(spec.title)} · ${escapeHTML(tableUnit)}</caption><thead><tr>${headers.map(h=>`<th scope="col">${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>'<tr>'+row.map((v,i)=>i?`<td>${escapeHTML(v)}</td>`:`<th scope="row">${escapeHTML(v)}</th>`).join('')+'</tr>').join('')}</tbody></table></div></details>`;
}
export function renderFigure(spec,width=760) {
  width=Math.max(300,Math.round(width));
  const chart=spec.type==='tornado'?tornadoPlot(spec,width):spec.type==='scatter'?scatterPlot(spec,width):spec.type==='fan'?fanPlot(spec,width):spec.type==='line'?linePlot(spec,width):spec.type==='heatmap'?heatPlot(spec,width):spec.type==='returns'?returnsPlot(spec,width):spec.type==='waterfall'?waterfallPlot(spec,width):spec.type==='donut'?donutPlot(spec,width):spec.type==='signedbar'?signedBarPlot(spec,width):barPlot(spec,width);
  return `<figure class="planning-figure" id="${spec.id}"><figcaption><span class="planning-evidence">${escapeHTML(spec.evidence||(spec.source?'Official statistics':'Hypothetical scenario'))}</span><h3>${escapeHTML(spec.title)}</h3><p class="plot-unit">${escapeHTML(spec.unitLabel||(spec.unit==='money'?'Canadian dollars (CAD)':spec.unit==='percent'?'Percentage returns':spec.unit==='months'?'Months to repay':'Scenario values'))}</p></figcaption><div class="plot-drawing">${chart}</div>${spec.note?'<p class="plot-note">'+escapeHTML(spec.note)+'</p>':''}${spec.source?`<p class="plot-note"><a href="${escapeHTML(spec.source)}">${escapeHTML(spec.sourceLabel||'Statistics Canada · original source')} ↗</a></p>`:''}${chartTable(spec)}</figure>`;
}
export function renderResult(result,width=1000) {
  return `<div class="planning-metrics" aria-live="polite">${result.metrics.map(([label,value,unit,custom])=>`<div><span>${escapeHTML(label)}</span><strong>${escapeHTML(custom??(unit==='months'&&value==null?'Not repaid':format(value,unit)))}</strong></div>`).join('')}</div><p class="planning-assumptions">${escapeHTML(result.note)}</p><div class="planning-figures">${result.charts.map(c=>renderFigure(c,width)).join('')}</div>`;
}
export function renderPlanningExplorer(kind) {
  const def=definitions[kind];
  const sourceData=def.mode==='statistics';
  return `<section class="planning-explorer guide-width" data-planning-app="${kind}" aria-labelledby="explorer-title"><div class="planning-explorer-heading"><div><p class="guide-kicker">${sourceData?'Choose a '+escapeHTML(def.sourceChoice??'source year')+'. Compare the measures.':'Change an assumption. Follow the result.'}</p><h2 id="explorer-title">${def.title}</h2></div><span class="planning-label">${sourceData?'Interactive data explorer':'Interactive planning lab'}</span></div><form class="planning-controls" novalidate>${def.fields.map(([key,label,value,min,max,step])=>`<label for="planning-${key}">${escapeHTML(label)}<input type="number" inputmode="decimal" id="planning-${key}" name="${key}" value="${value}" min="${min}" max="${max}" step="${step}" aria-describedby="help-${key}"><small id="help-${key}">Range ${sourceData?min:min.toLocaleString('en-CA')} to ${sourceData?max:max.toLocaleString('en-CA')}</small></label>`).join('')}<button type="button" class="planning-reset">${sourceData?'Restore '+escapeHTML(def.sourceChoice??'source year'):'Restore example'}</button></form><p class="planning-error" role="alert" hidden></p><noscript><p>${sourceData?'The source charts':'The example charts'} below work without JavaScript. Enable JavaScript to ${sourceData?'select a '+escapeHTML(def.sourceChoice??'source year'):'change assumptions'}.</p></noscript><div class="planning-results">${renderResult(planningResult(kind,defaults(kind)))}</div></section>`;
}
