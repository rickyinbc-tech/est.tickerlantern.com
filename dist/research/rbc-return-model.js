import {returnResearch} from './rbc-return-data.js';

export const forwardPELimits=Object.freeze({min:8,max:20,step:.01});

export function calculateReturnRegression(raw){
  if(raw==null||String(raw).trim()===''||!Number.isFinite(Number(raw)))
    return {error:'Enter a finite forward P/E between 8 and 20.'};
  const input=Number(raw);
  if(input<forwardPELimits.min||input>forwardPELimits.max)
    return {error:'Enter a forward P/E between 8 and 20.'};
  const pe=Math.round(input*100)/100;
  const model=returnResearch.fits.full[String(returnResearch.selectedHorizon)];
  const totalReturnPercent=model.intercept+model.slope*pe;
  if(totalReturnPercent<=-100)
    return {error:'The linear extrapolation implies a loss of 100% or more. This model cannot support a meaningful return at that input.'};
  const annualEquivalentPercent=((1+totalReturnPercent/100)**(1/model.horizon)-1)*100;
  return {pe,horizon:model.horizon,n:model.n,totalReturnPercent,annualEquivalentPercent,
    extrapolation:pe<model.pe_min||pe>model.pe_max,observedPEMin:model.pe_min,observedPEMax:model.pe_max};
}

// Independent public-data reproduction. No forecasts are reconstructed from later actual EPS.
export function fitReturnObservations(rows){
  if(rows.length<3)throw new Error('At least three observations are required.');
  const x=rows.map(r=>r.forwardPE),y=rows.map(r=>r.totalReturnPercent);
  if(![...x,...y].every(Number.isFinite))throw new Error('Observations must be finite.');
  const n=x.length,xMean=x.reduce((a,b)=>a+b,0)/n,yMean=y.reduce((a,b)=>a+b,0)/n;
  const sxx=x.reduce((sum,v)=>sum+(v-xMean)**2,0);
  if(sxx<=0)throw new Error('The predictor must vary.');
  const sxy=x.reduce((sum,v,i)=>sum+(v-xMean)*(y[i]-yMean),0);
  const slope=sxy/sxx,intercept=yMean-slope*xMean;
  const sse=y.reduce((sum,v,i)=>sum+(v-intercept-slope*x[i])**2,0);
  const sst=y.reduce((sum,v)=>sum+(v-yMean)**2,0);
  return {n,xMean,yMean,sxx,sxy,slope,intercept,rSquared:1-sse/sst};
}
