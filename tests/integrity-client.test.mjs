import test from 'node:test';
import assert from 'node:assert/strict';
import {historicalAssessment,canCompareHistory,eligibleExitMean,metricDisplay} from '../src/valuation-policy.js';
import {scenarioInputs,fieldBasis} from '../src/scenario-state.js';
import {DEFAULTS} from '../src/model.js';
import {assertSnapshotAdvance} from '../src/snapshot-client.js';
import {updateHealth,metricHealth,metricStatusText} from '../src/update-status.js';
const row={forwardPE:8.9,mean10YearForwardPE:12.25,dividendYield:null};
const accepted={...row,historicalCompatibility:{outcome:'compatible',allowComparison:true,allowExitDefault:true,reasons:['Synthetic same-definition fixture']}};
test('an authentic but unassessed or qualified mean remains visible and cannot default the exit',()=>{
 for(const candidate of [row,{...accepted,historicalCompatibility:{...accepted.historicalCompatibility,outcome:'qualified'}},{...accepted,historicalCompatibility:{...accepted.historicalCompatibility,outcome:'incompatible'}}]){
  assert.equal(canCompareHistory(candidate),false);assert.equal(eligibleExitMean(candidate),false);
  const input=scenarioInputs(candidate,{...DEFAULTS,entryPE:20},{entryPE:true});assert.equal(input.exitPE,20);
  assert.equal(candidate.mean10YearForwardPE,12.25);assert.equal(fieldBasis('exitPE',candidate),'fallback');
 }
 assert.equal(canCompareHistory(accepted),true);assert.equal(scenarioInputs(accepted).exitPE,12.25);
});
test('a manually edited exit and temporarily invalid edits survive any source refresh',()=>{
 const invalid={...DEFAULTS,entryPE:'',exitPE:'',growthMode:'annual',years:'',annualGrowth:['',-4],payout:''};
 const locks={entryPE:true,exitPE:true,growthMode:true,annualGrowth:true,years:true,payout:true};
 const next=scenarioInputs({...accepted,forwardPE:30,mean10YearForwardPE:18},invalid,locks);
 for(const key of ['entryPE','exitPE','years','payout'])assert.equal(next[key],'');assert.deepEqual(next.annualGrowth,['',-4]);
 assert.equal(scenarioInputs(row,{...DEFAULTS,entryPE:20,exitPE:13},{entryPE:true,exitPE:true}).exitPE,13);
});
test('source values remain visible at reported precision; N/M,zero and missing are distinct',()=>{
 assert.equal(metricDisplay({...row,metricDefinitions:{forwardPE:{precisionDecimals:1}}},'forwardPE'),'8.9×');
 assert.equal(metricDisplay({...row,forwardPE:0},'forwardPE'),'0×');
 assert.equal(metricDisplay({...row,forwardPE:null,metricDefinitions:{forwardPE:{state:'not-meaningful'}}},'forwardPE'),'N/M');
 assert.equal(metricDisplay({...row,forwardPE:null},'forwardPE'),'—');
 assert.equal(canCompareHistory({...accepted,forwardPE:-1}),false);
});
test('semantic versions and publication dates prevent fallback and out-of-order rollback',()=>{
 const current={snapshotVersion:3,snapshotId:'a',publishedAt:'2026-10-23T10:00:00Z'};
 for(const candidate of [{...current,snapshotVersion:2},{...current,snapshotId:'b'},{publishedAt:'2026-10-23T11:00:00Z'},{...current,publishedAt:'2026-10-23T09:00:00Z'}])assert.throws(()=>assertSnapshotAdvance(current,candidate));
 assert.equal(assertSnapshotAdvance(current,{...current,publishedAt:'2026-10-23T11:00:00Z'}).snapshotVersion,3);
 assert.equal(assertSnapshotAdvance(current,{...current,snapshotVersion:4,snapshotId:'b'}).snapshotVersion,4);
});
test('missed publisher checks become overdue without a new data snapshot',()=>{
 const f={sourceCheckAt:'2026-10-23T00:00:00Z',growthCheckAt:'2026-10-23T00:00:00Z'};
 assert.equal(updateHealth(f,new Date('2026-10-23T12:00:00Z')).missed,false);
 assert.equal(updateHealth(f,new Date('2026-10-24T13:00:00Z')).missed,true);
 assert.equal(updateHealth({...f,growthRefresh:{failures:[{adapter:'blocked'}]}},new Date('2026-10-23T12:00:00Z')).failures,1);
});

test('observation cadence, successful-check age and source failure are independent',()=>{
 const asOf='2026-09-01',checked='2026-10-22T12:00:00Z',now=new Date('2026-10-23T12:00:00Z');
 const quarter={asOf,source:{publisher:'Quarterly publisher',checkedAt:checked},metricDefinitions:{forwardPE:{freshnessPolicy:{observationMaxAgeDays:120,checkMaxAgeHours:48}}}};
 const weekly={...quarter,metricDefinitions:{forwardPE:{freshnessPolicy:{observationMaxAgeDays:21,checkMaxAgeHours:48}}}};
 assert.equal(metricHealth(quarter,'forwardPE',now).observationStale,false);assert.equal(metricHealth(weekly,'forwardPE',now).observationStale,true);
 assert.equal(metricHealth(weekly,'forwardPE',now).checkOverdue,false);
 const failed={...quarter,sync:{status:'retained',lastSuccess:'2026-10-20T00:00:00Z'}};
 assert.equal(metricHealth(failed,'forwardPE',now).sourceFailure,true);assert.equal(metricHealth(failed,'forwardPE',now).checkOverdue,true);
 assert.match(metricStatusText(failed,'forwardPE',now),/check failed/);
});
