const METRICS={forwardPE:['source','sync','asOf'],mean10YearForwardPE:['meanSource','meanSync','meanAsOf'],dividendYield:['yieldSource','yieldSync','yieldAsOf']};
const failed=status=>['retained','unavailable'].includes(status);
const availability=status=>['not-meaningful','withdrawn'].includes(status);
export const safeFailure = value => String(value || '').replace(/[\x00-\x1f<>]/g,' ').replace(/(authorization|cookie|password|token|api[_-]?key)\s*[:=]\s*\S+/gi,'$1=[redacted]').replace(/\s+/g,' ').trim().slice(0,240) || null;
export function metricSource(row,key) {
  if(key==='growthForecast') return row?.growthForecast?.source || {};
  const own=row?.[METRICS[key][0]];
  return own || (key==='forwardPE' || row?.[key]!=null || availability(row?.metricStates?.[key]) ? row?.source : null) || {};
}
const ownSync=(row,key)=>key==='growthForecast'?row?.growthForecast?.sync || row?.growthSync || {}:row?.[METRICS[key][1]] || {};
const sameDocument=(a,b)=>!!a.url && a.url===b.url && !(a.adapterId && b.adapterId && a.adapterId!==b.adapterId);
export function resolvedSync(row,key) {
  const source=metricSource(row,key),own=ownSync(row,key);
  const candidates=own.status?[{status:own,source,own:true}]:[];
  if(key!=='growthForecast') for(const other of Object.keys(METRICS)) {
    const status=ownSync(row,other),evidence=metricSource(row,other);
    if(other!==key && status.status && sameDocument(source,evidence) && (!status.metrics || status.metrics.includes(key))) candidates.push({status,source:evidence,own:false});
  }
  if(!candidates.length) return {status:'unknown',lastAttempt:null,lastSuccess:source.checkedAt || null,error:null};
  const stamp=item=>item.status.lastAttempt || item.status.lastSuccess || item.source.checkedAt || '';
  candidates.sort((a,b)=>stamp(b).localeCompare(stamp(a)) || Number(failed(b.status.status))-Number(failed(a.status.status)) || Number(b.own)-Number(a.own));
  const selected=candidates[0],status={...selected.status};
  if(availability(status.status)) status.status='ok';
  return {...status,lastAttempt:status.lastAttempt || null,lastSuccess:(failed(status.status)?own.lastSuccess:null) || status.lastSuccess || selected.source.checkedAt || null,error:safeFailure(status.error)};
}
const group=(row,key,status)=>status.ownerId || metricSource(row,key).checkOwner || metricSource(row,key).adapterId || metricSource(row,key).url || row.id+':'+key;
export function updateHealth(feed, now = new Date()) {
  const checks=[feed?.sourceCheckAt,feed?.growthCheckAt];
  const missed=checks.some(date=>!date || now-new Date(date)>36*3600000);
  const valuations=new Set(),growth=new Set();
  for(const row of feed?.indices || []) for(const key of [...Object.keys(METRICS),'growthForecast']) {
    const status=resolvedSync(row,key);
    if(failed(status.status)) (key==='growthForecast'?growth:valuations).add(group(row,key,status));
  }
  const primary=(feed?.primarySourceJobs || []).filter(job=>!['ok','browser-verified'].includes(job.status));
  const supplemental=(feed?.sourceJobs || []).filter(job=>!['ok','browser-verified'].includes(job.status));
  const jobs=new Set([...primary,...supplemental].map(job=>job.id));
  for(const id of jobs) valuations.add(id);
  // The old aggregate counts each failed primary target, rather than each job.
  // Remove targets accounted for by explicit outcomes before using the remainder
  // as a lower bound. A three-index factsheet failure is still one source check.
  const reported=Number.isSafeInteger(feed?.refresh?.failed)?feed.refresh.failed:0;
  const accounted=primary.reduce((n,job)=>n+(job.indices?.length || 1),0)+supplemental.length;
  const valuationFailures=Math.max(valuations.size,jobs.size+Math.max(0,reported-accounted));
  const growthFailures=Math.max(growth.size,feed?.growthRefresh?.failures?.length || 0);
  const failures=valuationFailures+growthFailures;
  const browserDependencies=(feed?.sourceJobs || []).filter(job=>job.status==='browser-verified' && job.hostedError).length;
  return {missed,failures,valuationFailures,growthFailures,browserDependencies,message:missed?'Publisher checks are overdue. The workflow may be paused, delayed or failing; retained observations keep their original dates.':failures?'Some publisher checks failed. Affected observations are retained with their own dates and warnings.':browserDependencies?'Hosted publisher access failed; independently dated browser checks supply the retained evidence. Their verification times and device dependency remain visible.':'Recent publisher checks completed. Observation dates and publication cadences still differ.'};
}
export const checkTime = date => date ? new Date(date).toLocaleString('en-GB',{timeZone:'America/Vancouver',dateStyle:'medium',timeStyle:'short'})+' PT' : 'not yet evidenced';
export function metricHealth(row, key, now = new Date()) {
  const definition=row?.metricDefinitions?.[key],policy=definition?.freshnessPolicy || {};
  const source=metricSource(row,key),status=resolvedSync(row,key);
  const observed=key==='growthForecast'?row?.growthForecast?.asOf:row?.[METRICS[key][2]] || (key==='dividendYield'?row?.asOf:null);
  const observationAgeDays=observed?(now-new Date(observed+'T00:00:00Z'))/86400000:null;
  const checked=status.lastSuccess;
  const checkAgeHours=checked?(now-new Date(checked))/3600000:null;
  const referenceOnly=policy.referenceOnly===true || source.syncMode==='dated-reference';
  const maxAge=Number.isFinite(policy.observationMaxAgeDays)?policy.observationMaxAgeDays:referenceOnly?Infinity:key==='growthForecast'?90:source.publisher==='FactSet'?21:65;
  return {evaluatedAt:now.toISOString(),checkStatus:status.status,lastAttempt:status.lastAttempt,lastSuccess:status.lastSuccess,failureSummary:status.error,
    observationDate:observed || null,observationAgeDays,checkAgeHours,referenceOnly,browserDependent:source.transport==='scheduled-browser',
    observationStale:observationAgeDays!=null && observationAgeDays>maxAge,checkOverdue:checkAgeHours!=null && checkAgeHours>(policy.checkMaxAgeHours || 48),
    sourceFailure:failed(status.status),superseded:status.status==='superseded',definitionReview:definition?.evidenceStatus==='definition-review-required' || status.status==='definition-review-required'};
}
export function metricStatusText(row,key,now=new Date()) {
  const s=metricHealth(row,key,now);
  return [s.referenceOnly?'Dated reference':null,s.observationStale?'Observation older than its source cadence':null,s.checkOverdue?'Source check overdue':null,s.sourceFailure?'Source check failed; last verified retained':null,s.superseded?'Superseded reference':null,s.definitionReview?'Definition review required':null].filter(Boolean).join(' · ');
}
export function metricDisclosure(row,key,now=new Date()) {
  const h=metricHealth(row,key,now),text=metricStatusText(row,key,now);
  if(!(h.sourceFailure || h.checkOverdue || h.observationStale || h.definitionReview || h.superseded)) return text;
  return `${text}. Last attempt: ${checkTime(h.lastAttempt)}. Last successful validation: ${checkTime(h.lastSuccess)}.${h.sourceFailure && h.failureSummary?' '+h.failureSummary+'.':''}${h.browserDependent?' Browser check requires the owner’s desktop browser.':''}`;
}
export function metricProvenance(row,key,now=new Date()) {
  return {...row?.metricDefinitions?.[key],synchronization:resolvedSync(row,key),health:metricHealth(row,key,now)};
}
