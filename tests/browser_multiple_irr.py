#!/usr/bin/env python3
"""Exercise the multiple-root example, a tangent and the no-admissible-root case."""
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
browser('open',base+'/research/multiple-internal-rates-return-later-payment-npv-profile.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='multipleIrr' and info['n']==3 and info['t']==3,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('profile','#multiple-irr-npv-profile'),('flows','#multiple-irr-cash-dates')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'multipleIrr-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
assert original[1]=='10.00% and 20.00%',original
browser('scrollintoview','#planning-irrFinal');browser('fill','#planning-irrFinal','13225')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='15.00%'")
browser('fill','#planning-irrFinal','15000')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='None at or above 0%'")
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-irrInitial','0');assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#multiple-irr-present-value .plot-data summary');browser('click','#multiple-irr-present-value .plot-data summary')
assert evaluate("document.querySelector('#multiple-irr-present-value .plot-data').open")
assert '$18.9' in evaluate("document.querySelector('#multiple-irr-present-value table').innerText")
print('PASS multipleIrr: three figures/tables, desktop/mobile, two roots, tangent, no nonnegative roots, invalid retention, reset and NPV reconciliation.')
