#!/usr/bin/env python3
"""Check fixed survey panels beside editable fee budgets in a real browser."""
import json
from pathlib import Path
import subprocess
import sys
base=sys.argv[1].rstrip('/') if len(sys.argv)>1 else 'http://127.0.0.1:8771'
qa=Path('qa').resolve();qa.mkdir(exist_ok=True)
def browser(*args):
    p=subprocess.run(['agent-browser','--session','tickerlantern-articles-1025',*args,'--json'],capture_output=True,text=True,timeout=45)
    assert p.returncode==0,p.stderr or p.stdout
    result=json.loads(p.stdout);assert result['success'],result;return result.get('data',{})
def evaluate(js):return browser('eval',js)['result']
slug='financial-advice-survey-age-sources-project-retainer-cost'
browser('open',base+'/research/'+slug+'.html')
for width,height in [(1440,1000),(390,844)]:
    browser('set','viewport',str(width),str(height))
    info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,figures:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),badSvg:[...document.querySelectorAll('.planning-figure svg')].some(e=>!e.querySelector('title')||!e.querySelector('desc'))})")
    assert info['lang']=='en' and info['kind']=='adviceCost' and info['figures']==4 and info['tables']==4,info
    assert info['scroll']<=info['width']+1 and not info['overflow'] and not info['badSvg'],info
    evaluate("document.querySelector('.planning-figure').scrollIntoView({block:'start'})")
    browser('screenshot',str(qa/('adviceCost-survey-'+str(width)+'.png')))
    if width==390:
        evaluate("document.querySelectorAll('.planning-figure')[2].scrollIntoView({block:'start'})")
        browser('screenshot',str(qa/'adviceCost-fee-calendar-mobile.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
fixed=evaluate("[...document.querySelectorAll('.planning-figure')].slice(0,2).map(e=>e.innerHTML)")
browser('fill','#planning-adviceProject','3000')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$4,691.23'")
assert fixed==evaluate("[...document.querySelectorAll('.planning-figure')].slice(0,2).map(e=>e.innerHTML)")
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-adviceYears','1.5')
assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset')
browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
assert not evaluate("!document.querySelector('.planning-error').hidden")
browser('scrollintoview','.planning-figure:first-child .plot-data summary')
browser('click','.planning-figure:first-child .plot-data summary')
assert evaluate("document.querySelector('.plot-data').open")
print('PASS adviceCost: desktop/mobile, four charts/tables, fixed survey data, fee edits, invalid retention, reset and expandable data.')
