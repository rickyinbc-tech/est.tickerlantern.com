#!/usr/bin/env python3
"""Verify fixed categorical survey panels and independent paid-work receipts."""
import json
from pathlib import Path
import subprocess
import sys
base=sys.argv[1].rstrip('/') if len(sys.argv)>1 else 'http://127.0.0.1:8771'
qa=Path('qa').resolve();qa.mkdir(exist_ok=True)
def browser(*args):
 p=subprocess.run(['agent-browser','--session','tickerlantern-articles-1025',*args,'--json'],capture_output=True,text=True,timeout=45)
 assert p.returncode==0,p.stderr or p.stdout
 r=json.loads(p.stdout);assert r['success'],r;return r.get('data',{})
def evaluate(js):return browser('eval',js)['result']
browser('open',base+'/research/ai-work-time-survey-paid-hours-personal-income-scenario.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='aiTime' and info['n']==5 and info['t']==5,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('hours','#ai-time-survey-hours'),('uses','#ai-time-survey-uses'),('arrangements','#ai-time-pay-arrangements'),('matrix','#ai-time-paid-conversion-grid')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'aiTime-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
assert original==['4.7','$3,450','$3,210'],original
fixed=evaluate("[...document.querySelectorAll('.planning-figure')].slice(0,2).map(e=>e.innerHTML)")
browser('scrollintoview','#planning-aiPaidShare');browser('fill','#planning-aiPaidShare','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='-$240'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[1].textContent")=='$0'
assert fixed==evaluate("[...document.querySelectorAll('.planning-figure')].slice(0,2).map(e=>e.innerHTML)")
browser('fill','#planning-aiToolCost','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0'")
assert fixed==evaluate("[...document.querySelectorAll('.planning-figure')].slice(0,2).map(e=>e.innerHTML)")
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-aiWeeks','1.5');assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#ai-time-survey-uses .plot-data summary');browser('click','#ai-time-survey-uses .plot-data summary')
assert evaluate("document.querySelector('#ai-time-survey-uses .plot-data').open")
text=evaluate("document.querySelector('#ai-time-survey-uses table').textContent")
assert '54.64%' in text and '53.00%' in text and 'training others' in text,text
assert 'hours per week' in evaluate("document.querySelector('#ai-time-survey-hours caption').textContent")
print('PASS aiTime: five figures/tables, desktop/mobile, fixed official panels, zero paid conversion with costs retained, zero personal tool cost, fractional retention, reset and full multiple-answer table.')
