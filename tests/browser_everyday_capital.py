#!/usr/bin/env python3
"""Real-browser checks for the three everyday-capital planning articles."""
import json
from pathlib import Path
import subprocess
import sys
base=sys.argv[1].rstrip('/') if len(sys.argv)>1 else 'http://127.0.0.1:8771'
session='tickerlantern-articles-1025'
qa=Path('qa').resolve();qa.mkdir(exist_ok=True)
def browser(*args):
    p=subprocess.run(['agent-browser','--session',session,*args,'--json'],capture_output=True,text=True,timeout=45)
    assert p.returncode==0,p.stderr or p.stdout
    data=json.loads(p.stdout);assert data['success'],data;return data.get('data',{})
def evaluate(js):return browser('eval',js)['result']
pages=[('condo-special-assessment-personal-reserve-deadlines','condoAssessment','assessmentFirstMonth'),('fixed-loan-inflation-real-debt-household-affordability','fixedDebtInflation','realDebtYears'),('weekly-investing-batched-purchases-fees-waiting-cash','contributionBatch','batchGap')]
for slug,kind,calendar in pages:
    browser('open',base+'/research/'+slug+'.html')
    for width,height in [(1440,1000),(390,844)]:
        browser('set','viewport',str(width),str(height))
        info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,figures:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,width:innerWidth,scroll:document.documentElement.scrollWidth,nonfinite:/NaN|Infinity/.test(document.querySelector('.planning-results').innerText),badSvg:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2)})")
        assert info['lang']=='en' and info['kind']==kind,info
        assert info['figures']==4 and info['tables']==4 and not info['nonfinite'] and not info['badSvg'],info
        assert info['scroll']<=info['width']+1 and not info['overflow'],info
        evaluate("document.querySelector('.planning-figure').scrollIntoView({block:'start'})")
        browser('screenshot',str(qa/(kind+'-'+str(width)+'.png')))
        if width==390:
            evaluate("document.querySelector('.planning-figure:last-child').scrollIntoView({block:'start'})")
            browser('screenshot',str(qa/(kind+'-matrix-mobile.png')))
    original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
    if kind=='condoAssessment':
        browser('fill','#planning-assessmentFirstMonth','1')
        browser('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('Opening cash is insufficient')")
        assert 'Opening cash is insufficient' in evaluate("document.querySelector('.planning-metrics').innerText")
    elif kind=='fixedDebtInflation':
        browser('fill','#planning-realDebtInflation','0')
        browser('wait','--fn',"(()=>{const m=[...document.querySelectorAll('.planning-metrics strong')];return m[0].textContent===m[1].textContent})()")
        values=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
        assert values[0]==values[1],values
    else:
        browser('fill','#planning-batchGap','1')
        browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0'")
        values=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
        assert values[2]=='$0',values
    before=evaluate("document.querySelector('.planning-results').innerHTML")
    browser('fill','#planning-'+calendar,'1.5')
    assert evaluate("!document.querySelector('.planning-error').hidden")
    assert evaluate("document.querySelector('.planning-results').innerHTML")==before
    browser('click','.planning-reset')
    browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
    assert not evaluate("!document.querySelector('.planning-error').hidden")
    evaluate("document.querySelector('.plot-data').open=true")
    assert evaluate("document.querySelector('.plot-data').open")
    print('PASS',kind,'desktop/mobile, four charts/tables, editing, invalid retention and reset',flush=True)
print('PASS all twelve new charts and all three interactions',flush=True)
