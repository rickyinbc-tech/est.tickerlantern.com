#!/usr/bin/env python3
"""Bounded UI verification for RDSP access, pension changes and rebuilding cash."""
import json
import subprocess
from pathlib import Path

root=Path(__file__).resolve().parents[1]
qa=root/'qa'
session='tl-abc-qa-1025'

def run(*args,expression=None):
    command=['agent-browser','--session',session,*args]
    if expression is not None:command+=['eval','--json','--stdin']
    p=subprocess.run(command,input=expression,text=True,capture_output=True,check=True,timeout=30)
    if expression is None:return p.stdout
    data=json.loads(p.stdout)
    assert data['success'],data
    return data['data']['result']

slugs=['rdsp-withdrawal-assistance-holdback-two-outflows','temporary-pension-bridge-end-later-income-gap','home-rebuilding-cost-insurance-limit-cash-gap']
reports=[]
for slug in slugs:
    run('open','http://127.0.0.1:8896/research/'+slug+'.html')
    for width in [1440,390,320]:
        run('set','viewport',str(width),'1000' if width==1440 else '844')
        result=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth,bad:/NaN|Infinity|undefined/.test(document.querySelector('.planning-results').textContent)})")
        assert result=={'lang':'en','charts':4,'tables':4,'overflow':False,'bad':False},(slug,width,result)
        reports.append({'slug':slug,'width':width,**result})
    if slug==slugs[0]:
        run('fill','#planning-rdspCap','1000')
        run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('$1,000') && document.querySelector('.planning-metrics').innerText.includes('$3,000')")
        metrics=run(expression="document.querySelector('.planning-metrics').innerText")
        assert '$1,000' in metrics and '$3,000' in metrics,metrics
        run('click','.planning-reset')
        run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('$5,000')")
        run('eval',"document.querySelector('#rdsp-account').scrollIntoView()")
    elif slug==slugs[1]:
        before=run(expression="document.querySelector('.planning-metrics').innerText")
        run('fill','#planning-bridgeStopAge','67')
        run('wait','--fn',"document.querySelector('.planning-metrics').innerText !== "+json.dumps(before))
        assert before!=run(expression="document.querySelector('.planning-metrics').innerText")
        run('click','.planning-reset')
        run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('$55,013.36')")
        run('eval',"document.querySelector('#bridge-end-budget').scrollIntoView()")
    else:
        before=run(expression="document.querySelector('.planning-metrics').innerText")
        run('fill','#planning-homeMarket','0')
        run('wait','--fn',"document.querySelector('#rebuild-values table tbody tr td').textContent === '$0'")
        assert before==run(expression="document.querySelector('.planning-metrics').innerText")
        run('fill','#planning-lossYear','1.5')
        assert run(expression="!document.querySelector('.planning-error').hidden")
        assert before==run(expression="document.querySelector('.planning-metrics').innerText")
        run('click','.planning-reset')
        assert not run(expression="!document.querySelector('.planning-error').hidden")
        run('eval',"document.querySelector('#rebuild-funding').scrollIntoView()")
    run('screenshot',str(qa/(slug+'-mobile.png')))
    run('click','.plot-data summary')
    assert run(expression="document.querySelector('.plot-data').open")
    print('Verified',slug,flush=True)
(qa/'access-bridge-cover-browser.json').write_text(json.dumps(reports,indent=2))
print('3 pages; 12 charts and tables; desktop, 390px and 320px; dynamic inputs, reset and validation passed.')
