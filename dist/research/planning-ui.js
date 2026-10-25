import { definitions, defaults, planningResult, validInputs, wholeInputKeys } from './planning-models.js';
import { renderResult, renderFigure } from './planning-charts.js';
for (const preview of document.querySelectorAll('[data-planning-preview]')) {
  let previousWidth=0;
  const draw=()=>{
    const width=Math.max(300,Math.round(preview.getBoundingClientRect().width)-40);
    if(width===previousWidth)return;
    previousWidth=width;
    preview.innerHTML=renderFigure({...planningResult('savings').charts[0],id:'planning-preview',title:'A monthly habit, over thirty years',note:'Hypothetical example: CAD 10,000 initially, CAD 500 at each month-end, 5% effective annual return for 30 years. Before tax, fees and inflation. This is not a forecast.'},width);
  };
  new ResizeObserver(draw).observe(preview);
  draw();
}
for(const app of document.querySelectorAll('[data-planning-app]')) {
  const kind=app.dataset.planningApp, form=app.querySelector('form'), output=app.querySelector('.planning-results'), error=app.querySelector('.planning-error');
  let accepted=defaults(kind), frame;
  const paint=()=>{const width=Math.max(300,Math.min(1000,Math.floor(output.getBoundingClientRect().width)-48));output.innerHTML=renderResult(planningResult(kind,accepted),width);};
  const update=()=>{
    const input=Object.fromEntries(definitions[kind].fields.map(([key])=>[key,form.elements[key].value===''?NaN:Number(form.elements[key].value)]));
    let valid=validInputs(kind,input);
    error.hidden=valid;
    error.textContent=valid?'':'Enter values within the displayed ranges. Use whole numbers for ages, years, months and claim counts. Charts retain the last valid scenario.';
    for(const [key,,,min,max] of definitions[kind].fields)form.elements[key].setAttribute('aria-invalid',String(!Number.isFinite(input[key])||input[key]<min||input[key]>max||(wholeInputKeys.includes(key)&&!Number.isInteger(input[key]))));
    if(valid){accepted=input;cancelAnimationFrame(frame);frame=requestAnimationFrame(paint);}
  };
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('input',update);
  form.querySelector('.planning-reset').addEventListener('click',()=>{for(const [key,value] of Object.entries(defaults(kind)))form.elements[key].value=value;update();});
  let previousWidth=0;
  new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width);if(width!==previousWidth){previousWidth=width;cancelAnimationFrame(frame);frame=requestAnimationFrame(paint);}}).observe(output);
  paint();
}
