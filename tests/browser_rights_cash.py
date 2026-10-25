#!/usr/bin/env python3
"""Verify theoretical rights value and a separately enforced subscription-cash condition."""
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
browser('open',base+'/research/rights-issue-theoretical-value-subscription-cash-funding.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='rightsCash' and info['n']==4 and info['t']==4,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('prices','#rights-cash-price-bases'),('bridge','#rights-cash-entitlement-bridge'),('matrix','#rights-cash-discount-ratio-grid')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'rightsCash-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
assert original==['$150','$80','$0'],original
fixed=evaluate("document.querySelector('#rights-cash-discount-ratio-grid').innerHTML")
browser('scrollintoview','#planning-rightsCash');browser('fill','#planning-rightsCash','100')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$50'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[1].textContent")=='$80'
assert not evaluate("document.querySelector('#rights-cash-resource-alternatives table').textContent.includes('Exercise ·')")
assert fixed==evaluate("document.querySelector('#rights-cash-discount-ratio-grid').innerHTML")
browser('fill','#planning-rightsUnits','3')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$4.5'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[1].textContent")=='$2.4'
assert evaluate("document.querySelector('#rights-cash-resource-alternatives table').textContent.includes('Exercise ·')")
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-rightsRatio','1.5');assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#rights-cash-resource-alternatives .plot-data summary');browser('click','#rights-cash-resource-alternatives .plot-data summary')
assert evaluate("document.querySelector('#rights-cash-resource-alternatives .plot-data').open")
text=evaluate("document.querySelector('#rights-cash-resource-alternatives table').textContent")
assert '$1,150' in text and '$1,070' in text and 'Exercise ·' in text,text
print('PASS rightsCash: four figures/tables, desktop/mobile, unchanged entitlement with insufficient cash, exercise omission/reappearance, fractional mathematical new entitlement, invalid ratio retention, reset and whole-resource table.')
