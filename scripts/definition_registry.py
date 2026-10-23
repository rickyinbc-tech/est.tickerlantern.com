"""Attach reviewed economic definitions without changing financial values or dates.

The checked-in registry is an explicit allowlist of source/definition families.
Unknown or changed definitions remain visible but cannot become comparison or
historical-default evidence. No source document is copied into publication.
"""
import copy
import datetime as dt
import json
from pathlib import Path
from metric_sync import metric_source, resolved_sync

ROOT = Path(__file__).resolve().parents[1]
METRICS = ('forwardPE', 'mean10YearForwardPE', 'dividendYield', 'growthForecast')


def load_registry():
    return json.loads((ROOT / 'data/source-definitions.json').read_text())


def _family(row, source, key):
    adapter = source.get('adapterId')
    if adapter == 'jpm-daily':
        if key == 'mean10YearForwardPE' or row['id'] in ('australia', 'china', 'india', 'asia-ex-japan'):
            return 'jpm-daily'
        return 'jpm-csi-global' if row['id'] == 'csi300' else 'jpm-msci-global'
    if adapter: return adapter
    if source.get('publisher') == 'FactSet': return 'factset'
    if source.get('publisher') == 'MSCI': return 'msci-fundamentals'
    return 'unknown'


def _source(row, key):
    if key=='growthForecast': date=(row.get(key) or {}).get('asOf')
    elif key=='mean10YearForwardPE': date=row.get('meanAsOf')
    elif key=='dividendYield': date=row.get('yieldAsOf') or row.get('asOf')
    else: date=row.get('asOf')
    return metric_source(row,key),resolved_sync(row,key),date


def _growth_family(forecast, registry):
    publisher = (forecast.get('source') or {}).get('publisher', '')
    configs = json.loads((ROOT / 'data/growth-sources.json').read_text())['jobs']
    for job in configs:
        if job['publisher'] == publisher:
            adapter = job['adapter']
            # Precision reflects the published table, never reconstructed EPS.
            decimals = 0 if adapter in ('ubs', 'firsteagle', 'hartford', 'amova', 'fsm') else 1
            return adapter, decimals, job
    return 'unknown', None, {}


def _location(row, key, family, source):
    if key == 'growthForecast':
        f = row.get(key) or {}
        locations = {
            'factset':'CY annual earnings-growth paragraphs; forecast years explicitly checked',
            'ubs':'exact Nasdaq-100 paragraph; this year/next year bound to publication year',
            'firsteagle':'Russell 2000 annual forecast paragraph and underlying data-date footnote',
            'nbi':'chart 15; exact Canada(S&P/TSX) or EAFE(MSCI) colour/series; full2026/dashed2027 lines',
            'nbf':'EPS Performance table; exact named MSCI row; annual2026/2027/2028 columns; excludes12-month-forward column',
            'jpm':'named MSCI earnings-growth labels and calendar-year consensus footnote',
            'hartford':'Earnings-Per-Share Growth Rate Forecasts(%); exact region definition footnote;2026e/2027e/2028e',
            'amova':'EPS Growth Scenarios; exact index; median column; Dec-2026 and Sep-2027 dated rows; growth measurement interval not explicitly defined',
            'fsm':'exact CSI300(000300.SH) HTML table; annual EPS Growth row; not rounded-level recomputation',
        }
        return locations.get(family, 'unknown extraction location')
    if family == 'factset': return 'bounded paragraph beginning The forward12-month P/E ratio; current and10-year values in the same paragraph'
    if family == 'msci-fundamentals': return f"FUNDAMENTALS table; exact {row['name']} row; " + ('Div Yld(%) column' if key == 'dividendYield' else 'P/E Fwd column; not trailingP/E or annualised10-year return')
    if family == 'nasdaq-dashboard': return f"Global Equities table; exact {row['name']} row; " + ('NTM P/E10yr Avg column' if key == 'mean10YearForwardPE' else 'Dividend Yield column' if key == 'dividendYield' else 'NTM P/E column')
    if family.startswith('jpm'):
        return ('APAC ex-Japan equities:Returns and valuations by market; exact MSCI column; ' + ('first10-year average row after Forward P/E ratio' if key == 'mean10YearForwardPE' else 'Dividend Yield row' if key == 'dividendYield' else 'Forward P/E ratio row')) if row['id'] in ('australia','china','india','asia-ex-japan') else 'Global equities:Valuations; exact named index bar with explicit printed numeric label and source-universe footnote'
    if family == 'msci-reference': return 'Global indexes forward earnings multiples; exact ACWI/WORLD/EM/EUROPE category;10Yr Average P/Fwd Ear legend and explicit label'
    if family == 'segal-reference': return f"Price to Earnings; exact {row['name']} column;10Yr Avg row; excludes Median and10-Year performance table"
    if family == 'raymond-james-tsx': return f"exact {row['name']} row; current P/E NTM column; historical2000-present column excluded"
    if family == 'cumberland-tsx': return 'Exhibit10; TSX row;10yr Avg column; blended-forward12-month footnote; current CY estimates excluded'
    if family == 'lseg-stoxx': return 'Exhibit17A;STOXX600:12-month Forward Price/Earnings Ratio; explicit current blue and10-Year Average black numeric labels; not chart geometry'
    if family == 'edelweiss-reference': return f"Global equity markets at a glance; exact {'UK/FTSE100' if row['id']=='ftse100' else 'HongKong/HangSeng'} row;12-month-forward header; " + ('P/E10yr Avg column' if key == 'mean10YearForwardPE' else 'P/E column')
    if family == 'ig-asia-reference': return 'Nikkei225 named section; forwardP/E sentence and ten-year mean; separate observation-date statement'
    if family == 'scbam-reference': return 'global forward12-month P/E chart; exact CSI300 category;10Y Avg explicit printed label; separate z-score chart excluded'
    return 'not disclosed / not connected'


def _evidence(row, key, source, sync, asof, family, previous, feed):
    f = row.get('growthForecast') or {}
    date_basis = 'explicit-observation-date'
    if family == 'factset': date_basis = 'publication-date-only; separate price/consensus vintage not disclosed'
    if family == 'lseg-stoxx': date_basis = 'report-date-only; exact last price/estimate date not separately disclosed in this exhibit'
    if family.startswith('jpm'): date_basis = 'report-data-cutoff; individual price and estimate vintages not separately disclosed'
    if key == 'growthForecast' and family in ('ubs','nbi'): date_basis = 'publication/report-date-only; distinct forecast observation date not disclosed'
    if key == 'growthForecast' and family == 'amova': date_basis = 'committee-meeting-date; separate market/estimate observation date not disclosed'
    if key == 'growthForecast' and family == 'fsm': date_basis = 'explicit-table-observation-date'
    publication = source.get('publicationDate') or source.get('publishedAt') or row.get('publicationDate')
    if family == 'factset': publication = publication or asof
    if key == 'growthForecast' and family in ('ubs','nbi'): publication = publication or asof
    # Known publication metadata from the selected original, not inferred from retrieval.
    known_publications = {
        'Small-Cap-Market-Overview-2026Q2':'2026-07-23',
        '2610-global-investment-strategy-committee-outlook-q4-2026':'2026-10-09',
        'rcms370440':'2026-05-21',
        'global-markets-dashboard-oct-16-2026':'2026-10-16',
    }
    publication = publication or next((date for token,date in known_publications.items() if token in source.get('url','')), None)
    prior = ((previous or {}).get('metricDefinitions') or {}).get(key) or {}
    comparison = {'value': row.get(key), 'asOf': asof, 'family': family}
    old_value = (previous or {}).get(key)
    old_source, _, old_date = _source(previous, key) if previous else ({}, {}, None)
    changed = bool(previous) and (old_value != row.get(key) or old_date != asof or _family(previous, old_source, key) != family) if key != 'growthForecast' else bool(previous) and any((old_value or {}).get(k) != f.get(k) for k in ('asOf','estimates','forecastType','periodBasis','method'))
    latest_change = feed.get('publishedAt') if changed else (prior.get('evidence') or {}).get('latestAcceptedChange')
    return dict(publisher=source.get('publisher'), publicationHost=source.get('url','').split('/')[2] if source.get('url','').startswith('https://') else None,
                url=source.get('url'),discoveryUrl=source.get('discoveryUrl'),page=source.get('page'),location=_location(row,key,family,source),
                observationDate=asof,dateBasis=date_basis,publicationDate=publication,priceDate=source.get('priceDate'),estimateVintage=source.get('estimateVintage'),
                checkStatus=sync.get('status'),failureSummary=sync.get('error'),lastAttempt=sync.get('lastAttempt'),lastSuccess=sync.get('lastSuccess'),checkedAt=source.get('checkedAt'),latestAcceptedChange=latest_change,
                parserVersion=source.get('parserVersion'),sha256=source.get('sha256'),transport=source.get('transport','publisher-http'),
                evidenceNote='Dates not separately disclosed remain null. checkedAt is retrieval/validation evidence, never an observation date.')


def _metric(row, key, registry, previous, feed):
    source, sync, asof = _source(row,key)
    declared_state=(row.get('metricStates') or {}).get(key) or (sync.get('status') if row.get(key) is None else None)
    if row.get(key) is None and declared_state not in ('not-meaningful','withdrawn'):
        source,sync,asof={},{},None
    family = _family(row,source,key)
    value = row.get(key)
    available = value is not None
    growth = key == 'growthForecast'
    job = {}
    if growth:
        family, precision, job = _growth_family(value or {},registry)
        base = copy.deepcopy(registry['families']['unknown'])
        base['underlyingProvider'] = job.get('publisher','unknown')
        base['economic']['horizon'] = (value or {}).get('periodBasis','unknown')
        base['economic']['earningsBasis'] = (value or {}).get('method','not disclosed')
        base['freshnessPolicy'] = {'publicationCadence':{'factset':'weekly','ubs':'irregular article; bounded daily-article search','firsteagle':'quarterly written overview','nbi':'monthly','nbf':'monthly','jpm':'daily','hartford':'quarterly','amova':'quarterly','fsm':'fixed dated article; revisions only'}.get(family,'unknown'),'observationMaxAgeDays':{'factset':21,'ubs':60,'firsteagle':120,'nbi':65,'nbf':65,'jpm':7,'hartford':120,'amova':120,'fsm':120}.get(family,65),'checkMaxAgeHours':48,'referenceOnly':family=='fsm'}
        if family=='fsm': base['economic']['currency']='EPS levels labelled RMB; growth is dimensionless; no investor FX return modeled'
        base['precisionDecimals'] = 0 if family=='jpm' and row['id']=='japan' else precision
        label = 'EPS growth scenario at printed forecast date; measurement interval not disclosed' if family=='amova' else 'annual EPS growth forecast' if family not in ('ubs','firsteagle','nbi') else 'annual earnings growth forecast; per-share aggregation not fully disclosed'
    else:
        base = copy.deepcopy(registry['families'].get(family,registry['families']['unknown']))
        label = '10-year average of '+base['label'] if key == 'mean10YearForwardPE' else 'Div Yld (%)' if key == 'dividendYield' and family == 'msci-fundamentals' else 'Dividend Yield' if key == 'dividendYield' else base['label']
    state = declared_state if declared_state in ('not-meaningful','withdrawn') else 'unavailable' if not available else 'not-meaningful' if isinstance(value,str) and value.upper() in ('N/M','NM') else 'published-forecast' if growth else 'numeric'
    permitted = ['display','approximate-scenario-growth'] if growth and available else ['display','synthetic-scenario'] if available and key == 'forwardPE' else ['display','historical-reference'] if available and key == 'mean10YearForwardPE' else ['display','first-payment-anchor'] if available else []
    if not growth and family!='unknown' and source.get('publisher') not in base.get('allowedPublishers',[]):
        family='unknown';base=copy.deepcopy(registry['families']['unknown'])
    if not growth and key == 'forwardPE' and base['economic']['horizon'] == 'rolling-12m': permitted.append('rolling-NTM-scenario')
    if state in ('not-meaningful','withdrawn'): permitted=['display']
    evidence = _evidence(row,key,source,sync,asof,family,previous,feed)
    evidence['underlyingProvider'] = base['underlyingProvider']
    economic = base['economic']
    economic['identity'] = row['id']
    economic['returnVariant'] = 'dimensionless valuation or yield; no total-return series is being ingested'
    # Document return context is separate from fundamental-statistic construction.
    url=source.get('url','')
    if family=='msci-fundamentals':
        evidence['documentReturnContext']='CAD net-return chart' if 'canada-index-cad-net' in url else 'AUD net-return chart' if 'australia-index-aud-net' in url else 'USD gross-return chart' if url.endswith('msci-acwi.pdf') else 'factsheet return variant not independently recorded; fundamentals kept separate'
    if key=='dividendYield' and family!='msci-fundamentals':
        economic['horizon']='dividend-yield construction not disclosed'
        economic['earningsBasis']='not applicable to yield'
    raw_value = (row.get('metricRawValues') or {}).get(key)
    # An explicit non-meaningful state cannot reuse a prior numeric raw value.
    # Preserve a recognized publisher label; otherwise use the canonical N/M.
    raw_value = raw_value if isinstance(raw_value,str) and raw_value.strip().upper() in ('N/M','NM') else 'N/M'
    record=dict(definitionId=family+':'+key,definitionVersion=registry['registryVersion'],state=state,observationDate=asof,dateBasis=evidence['dateBasis'],rawReportedLabel=label,
                rawReportedValue=[dict(year=e.get('year'),value=e.get('growth'),periodLabel=e.get('periodLabel')) for e in (value or {}).get('estimates',[])] if growth else raw_value if state=='not-meaningful' else value,
                units='percent' if key in ('dividendYield','growthForecast') else 'times',precisionDecimals=base['precisionDecimals'],
                classification='unavailable' if not available else 'published-house-forecast' if growth and value.get('forecastType')=='house' else 'estimate-based-published-statistic' if growth or key=='forwardPE' else 'reported-historical-reference' if key=='mean10YearForwardPE' else 'published-dividend-statistic',
                evidence=evidence,economic=economic,evidenceStatus='publisher-withdrawal' if state=='withdrawn' else 'publisher-not-meaningful' if state=='not-meaningful' else 'unavailable' if not available else 'definition-review-required' if family=='unknown' else 'published-transcription',
                freshnessPolicy=base['freshnessPolicy'],permittedUse=permitted)
    if key=='mean10YearForwardPE':
        record['history']=dict(statistic='publisher-reported mean',windowYears=10,windowStart=None,windowEnd=None,referenceDate=asof,windowEndpointBasis='reference date known; precise sampled endpoints not separately disclosed',samplingFrequency='daily' if family=='nasdaq-dashboard' else 'not disclosed',observationTreatment='not disclosed',methodologyBreaks='not disclosed',method=row.get('meanMethod'),reconstructedSeries=False)
    if growth:
        record['periodMapping']=dict(sourceBasis=(value or {}).get('periodBasis'),modelUse='approximate scenario growth of synthetic anchor; not independently matched rolling-NTM growth',currentYear='context only; never replayed as a full future holding year',uncoveredYears='blank; no repetition or interpolation',forecastType=(value or {}).get('forecastType'))
    if family=='unknown' and available:
        record['permittedUse']=['display']
    # Newly surfaced explicit definitions override the reviewed family only by
    # requiring review, never by silently certifying a new basis.
    declared = source.get('definitionVersion')
    if declared and declared != registry['registryVersion']:
        record['evidenceStatus']='definition-review-required';record['permittedUse']=['display']
    for field in ('horizon','earningsBasis','aggregation','negativeEarners','weighting','methodologyVersion'):
        disclosed=(source.get('economicDefinition') or {}).get(field)
        if disclosed is not None and disclosed != economic.get(field):
            record['economic'][field]=disclosed;record['evidenceStatus']='definition-review-required';record['permittedUse']=['display','synthetic-scenario'] if key=='forwardPE' else ['display']
    basis=(row.get('earningsBasis') or '').lower()
    if key=='forwardPE' and any(token in basis for token in ('fy1','fy2','current fiscal','next fiscal','trailing')):
        record['economic']['horizon']='changed-or-fiscal-basis';record['evidenceStatus']='definition-review-required';record['permittedUse']=['display','synthetic-scenario']
    return record


def _compatibility(row):
    current=row['metricDefinitions']['forwardPE'];mean=row['metricDefinitions']['mean10YearForwardPE']
    reasons=[]
    if current['state']!='numeric' or mean['state']!='numeric':
        return dict(outcome='insufficient',allowComparison=False,allowExitDefault=False,reasons=['Current and historical numerical observations are both required.'],version='valuation-compatibility-1')
    a,b=current['evidence'],mean['evidence']
    if current['evidenceStatus']=='definition-review-required' or mean['evidenceStatus']=='definition-review-required': reasons.append('A source definition requires review.')
    if a['url']!=b['url'] or a['publisher']!=b['publisher']: reasons.append('Current and historical observations come from different documents or publishers; aggregation and loss-company treatment are not established as equivalent.')
    if current['observationDate']!=mean['observationDate']: reasons.append('Historical reference has its own older reported date; a current rolling ten-year mean is not established.')
    if current['economic']['horizon']!='rolling-12m' or mean['economic']['horizon']!='rolling-12m': reasons.append('An explicit matching rolling12-month earnings horizon has not been established for both metrics.')
    if current['definitionId'].split(':')[0]!=mean['definitionId'].split(':')[0]: reasons.append('Definition families differ; historical splicing is unsupported.')
    same_series=not reasons
    if same_series:
        reasons=['Exact benchmark and matching forward12-month series are paired by the same publisher in the same dated observation.','Constituent aggregation/negative-earner details are not fully disclosed in this report; this permission covers only its internally paired series.','Historical sampling details remain as recorded; mean reversion is an illustrative scenario, never certain fair value.']
    return dict(outcome='compatible' if same_series else 'qualified',allowComparison=same_series,allowExitDefault=same_series,reasons=reasons,version='valuation-compatibility-1')


def apply_registry(feed, previous=None):
    """Enrich a candidate snapshot in place; leave observations/sync untouched."""
    registry=load_registry();definitions={b['id']:b for b in registry['benchmarks']}
    prior={r['id']:r for r in (previous or {}).get('indices',[])}
    for row in feed.get('indices',[]):
        if row['id'] not in definitions: raise ValueError('Unknown benchmark in definition registry')
        if row.get('name')!=definitions[row['id']]['exactName']: raise ValueError('Exact benchmark name differs from definition registry')
        row['benchmarkDefinition']=copy.deepcopy(definitions[row['id']])
        row['metricDefinitions']={key:_metric(row,key,registry,prior.get(row['id']),feed) for key in METRICS}
        row['historicalCompatibility']=_compatibility(row)
    feed['definitionRegistryVersion']=registry['registryVersion']
    feed['modelConventionVersion']=json.loads((ROOT/'data/model-conventions.json').read_text())['modelConventionVersion']
    return feed


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot',default=str(ROOT/'data/indices.json'))
    parser.add_argument('--output',help='explicit destination; omitted prints coverage without mutating input')
    args=parser.parse_args(); feed=apply_registry(json.loads(Path(args.snapshot).read_text()))
    if args.output: Path(args.output).write_text(json.dumps(feed,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'registry':feed['definitionRegistryVersion'],'benchmarks':len(feed['indices']),'compatible':sum(r['historicalCompatibility']['allowComparison'] for r in feed['indices']),'qualified':sum(r['historicalCompatibility']['outcome']=='qualified' for r in feed['indices'])}))
