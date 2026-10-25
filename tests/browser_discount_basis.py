#!/usr/bin/env python3
"""Verify nominal/real matching, negative real rates and undefined zero-cost ratios."""
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
browser('open',base+'/research/real-nominal-cash-flow-discount-rate-price-basis.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='discountBasis' and info['n']==4 and info['t']==4,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('comparison','#discount-basis-pv-methods'),('matrix','#discount-basis-error-grid')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'discountBasis-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
browser('scrollintoview','#planning-basisNominal');browser('fill','#planning-basisNominal','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='-2.91%'")
browser('fill','#planning-basisInflation','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[1].textContent")=='$240,000'
browser('fill','#planning-basisCost','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='$0'")
assert evaluate("[...document.querySelectorAll('#discount-basis-error-grid tbody td')].every(e=>e.textContent==='N/A')")
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-basisYears','1.5');assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#discount-basis-pv-methods .plot-data summary');browser('click','#discount-basis-pv-methods .plot-data summary')
assert evaluate("document.querySelector('#discount-basis-pv-methods .plot-data').open")
rows=evaluate("[...document.querySelectorAll('#discount-basis-pv-methods tbody tr')].map(r=>r.cells[1].textContent)")
assert rows[0]==rows[1] and rows[0]=='$179,980.54',rows
print('PASS discountBasis: four figures/tables, desktop/mobile, matched present values, negative real rate, zero-cost N/A, fractional retention and reset.')
