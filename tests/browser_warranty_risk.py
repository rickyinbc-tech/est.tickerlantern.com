#!/usr/bin/env python3
"""Exercise expected-cost assumptions separately from state-specific reserve positions."""
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
browser('open',base+'/research/extended-warranty-expected-cost-repair-cash-reserve.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='warrantyRisk' and info['n']==4 and info['t']==4,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('expectation','#warranty-expected-cost'),('reserve','#warranty-reserve-positions')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'warrantyRisk-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
reserve=evaluate("document.querySelector('#warranty-reserve-positions').innerHTML")
browser('scrollintoview','#planning-warrantyProbability');browser('fill','#planning-warrantyProbability','100')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='-$520'")
assert reserve==evaluate("document.querySelector('#warranty-reserve-positions').innerHTML")
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-warrantyProbability','101')
assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('fill','#planning-warrantyDeductible','1000')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='No equality within 0–100%'")
browser('scrollintoview','#warranty-reserve-positions .plot-data summary');browser('click','#warranty-reserve-positions .plot-data summary')
assert evaluate("document.querySelector('#warranty-reserve-positions .plot-data').open")
assert '-$480' in evaluate("document.querySelector('#warranty-reserve-positions table').innerText")
print('PASS warrantyRisk: four figures/tables, desktop/mobile, bounded labels, expectation/reserve independence, invalid retention, reset and capped deductible.')
