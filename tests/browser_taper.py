#!/usr/bin/env python3
"""Verify complete raise offsets, zero-denominator handling and negative-resource gains."""
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
browser('open',base+'/research/pay-rise-tax-benefit-phaseout-incremental-income.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='taper' and info['n']==4 and info['t']==4,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('profile','#taper-resources-profile'),('bridge','#taper-raise-reconciliation'),('matrix','#taper-start-and-raise-grid')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'taper-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
assert original==['$1,760','$110','45.00%'],original
browser('scrollintoview','#planning-taperRaise');browser('fill','#planning-taperRaise','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='N/A · no gross increase'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[1].textContent")=='$0'
browser('fill','#planning-taperIncome','1600');browser('fill','#planning-taperRaise','100');browser('fill','#planning-taperTax','60');browser('fill','#planning-taperRate','100')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='-$60'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[2].textContent")=='160.00%'
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-taperTax','61');assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#taper-raise-reconciliation .plot-data summary');browser('click','#taper-raise-reconciliation .plot-data summary')
assert evaluate("document.querySelector('#taper-raise-reconciliation .plot-data').open")
text=evaluate("document.querySelector('#taper-raise-reconciliation table').textContent")
assert '$200' in text and '-$40' in text and '-$50' in text and '$110' in text,text
print('PASS taper: four figures/tables, desktop/mobile, full-raise offset, zero-raise N/A, negative resource gain at 160% offset, invalid retention, reset and change reconciliation table.')
