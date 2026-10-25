#!/usr/bin/env python3
"""Verify repeated independent events, strict funding boundaries and complete display buckets."""
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
browser('open',base+'/research/repeated-independent-events-average-cost-reserve-shortfall-probability.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='repeatRisk' and info['n']==4 and info['t']==4,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('distribution','#repeat-risk-count-distribution'),('averages','#repeat-risk-cost-and-reserve'),('matrix','#repeat-risk-shortfall-grid')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'repeatRisk-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
assert original==['65.13%','26.39%','$5,000'],original
fixed=evaluate("document.querySelector('#repeat-risk-count-distribution').innerHTML")
browser('scrollintoview','#planning-repeatReserve');browser('fill','#planning-repeatReserve','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='65.13%'")
assert fixed==evaluate("document.querySelector('#repeat-risk-count-distribution').innerHTML")
browser('fill','#planning-repeatReserve','50000')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='0.00%'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[0].textContent")=='65.13%'
browser('fill','#planning-repeatCost','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[0].textContent")=='65.13%'
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-repeatYears','1.5');assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#repeat-risk-count-distribution .plot-data summary');browser('click','#repeat-risk-count-distribution .plot-data summary')
assert evaluate("document.querySelector('#repeat-risk-count-distribution .plot-data').open")
text=evaluate("document.querySelector('#repeat-risk-count-distribution table').textContent")
assert 'Five or more events' in text and 'Exactly 0 events' in text,text
print('PASS repeatRisk: four figures/tables, desktop/mobile, distinct event/shortfall probabilities, no-reserve identity, sufficient reserve, zero severity, unchanged frequency distribution, fractional retention, reset and full tail bucket.')
