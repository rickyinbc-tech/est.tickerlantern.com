#!/usr/bin/env python3
"""Check coverage grouping and channel invariance in the rendered snapshot."""
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
browser('open',base+'/research/client-name-brokered-gic-direct-deposit-member-category-map.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='depositMap' and info['n']==4 and info['t']==4,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('covered','#deposit-map-covered-excess'),('matrix','#deposit-map-headroom')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'depositMap-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
coverage=evaluate("[...document.querySelectorAll('.planning-figure')].slice(1).map(e=>e.innerHTML)")
browser('scrollintoview','#planning-depositAOneDirect');browser('fill','#planning-depositAOneDirect','40000')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$10,000'")
browser('fill','#planning-depositAOneBroker','70000')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$20,000'")
assert coverage==evaluate("[...document.querySelectorAll('.planning-figure')].slice(1).map(e=>e.innerHTML)")
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-depositAOneBroker','-1');assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#deposit-map-headroom .plot-data summary');browser('click','#deposit-map-headroom .plot-data summary')
assert evaluate("document.querySelector('#deposit-map-headroom .plot-data').open")
assert '-$10,000' in evaluate("document.querySelector('#deposit-map-headroom table').innerText")
print('PASS depositMap: four figures/tables, desktop/mobile, bounded labels, channel-only invariance, invalid retention, reset and signed headroom.')
