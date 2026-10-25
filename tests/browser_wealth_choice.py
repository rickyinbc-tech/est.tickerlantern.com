#!/usr/bin/env python3
"""Check the three wealth-choice articles in a real browser using agent-browser."""
import json
from pathlib import Path
import subprocess
import sys

base=sys.argv[1].rstrip('/') if len(sys.argv)>1 else 'http://127.0.0.1:8771'
session='tickerlantern-articles-1025'
qa=Path('qa').resolve();qa.mkdir(exist_ok=True)

def browser(*args):
    p=subprocess.run(['agent-browser','--session',session,*args,'--json'],capture_output=True,text=True,timeout=60)
    if p.returncode: raise AssertionError(p.stderr or p.stdout)
    data=json.loads(p.stdout)
    assert data['success'],data
    return data.get('data',{})

def evaluate(js): return browser('eval',js)['result']

pages=[('employer-stock-income-interruption-household-risk','employerRisk'),('lump-sum-staged-investing-cash-return-path','stagedEntry'),('cash-discount-financing-purchase-reserve-tradeoff','purchaseFinance')]
for slug,kind in pages:
    browser('open',base+'/research/'+slug+'.html')
    for width,height in [(1440,1000),(390,844)]:
        browser('set','viewport',str(width),str(height))
        info=evaluate('''({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,figures:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,width:innerWidth,scroll:document.documentElement.scrollWidth,nonfinite:/NaN|Infinity/.test(document.querySelector('.planning-results').innerText),missingLabels:[...document.querySelectorAll('svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),overflowFigures:[...document.querySelectorAll('.plot-drawing')].filter(e=>e.scrollWidth>e.clientWidth+2).length})''')
        assert info['lang']=='en' and info['kind']==kind,info
        assert info['figures']==4 and info['tables']==4 and not info['nonfinite'] and not info['missingLabels'],info
        assert info['scroll']<=info['width']+1 and info['overflowFigures']==0,info
        evaluate("document.querySelector('.planning-figure').scrollIntoView({block:'start'})")
        browser('screenshot',str(qa/(kind+'-'+str(width)+'.png')))
    if kind=='employerRisk':
        browser('fill','#planning-shareFall','100')
        values=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
        assert values[0]=='$60,000' and values[1]==values[2],values
    elif kind=='stagedEntry':
        browser('fill','#planning-stageMonths','1')
        values=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
        assert values[0]==values[1] and values[2]=='$0',values
    else:
        browser('fill','#planning-cash','0')
        assert 'Funding needed' in evaluate("document.querySelector('.planning-metrics').innerText")
    before=evaluate("document.querySelector('.planning-results').innerHTML")
    invalid='#planning-stageMonths' if kind=='stagedEntry' else '#planning-cash'
    browser('fill',invalid,'-1')
    assert evaluate("!document.querySelector('.planning-error').hidden")
    assert evaluate("document.querySelector('.planning-results').innerHTML")==before
    browser('click','.planning-reset')
    assert not evaluate("!document.querySelector('.planning-error').hidden")
    assert evaluate("document.querySelectorAll('.planning-figure').length")==4
    evaluate("document.querySelector('.plot-data').open=true")
    assert evaluate("document.querySelector('.plot-data').open")
    print('PASS',kind,'desktop/mobile charts, tables, edits, invalid-input retention and reset',flush=True)
print('PASS all twelve new charts and three article interactions',flush=True)
