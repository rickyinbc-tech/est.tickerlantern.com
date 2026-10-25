#!/usr/bin/env python3
"""Verify progressive slices, minimum-first charges and whole-band thresholds."""
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
browser('open',base+'/research/progressive-fee-slices-whole-balance-bands-minimum-charge.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='feeSlices' and info['n']==4 and info['t']==4,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('bridge','#fee-slices-progressive-bridge'),('thresholds','#fee-slices-threshold-changes'),('matrix','#fee-slices-effective-rates')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'feeSlices-{name}-{width}.png'))
axisOverlap=evaluate("(()=>{const svg=document.querySelector('#fee-slices-threshold-changes svg'),ts=[...svg.querySelectorAll('text')],y=Math.max(...ts.map(t=>Number(t.getAttribute('y')))),bs=ts.filter(t=>Number(t.getAttribute('y'))===y).map(t=>t.getBBox()).sort((a,b)=>a.x-b.x);return bs.some((b,j)=>j&&b.x<bs[j-1].x+bs[j-1].width+2)})()")
assert not axisOverlap,'Signed-bar axis labels overlap'
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
assert original==['$1,670','$1,370','0.67%'],original
browser('scrollintoview','#planning-feeBase');browser('fill','#planning-feeBase','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='N/A · zero fee base'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[0].textContent")=='$420'
browser('fill','#planning-feeBase','100000')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='$920'")
browser('fill','#planning-feeBase','100100')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='$620.5'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[0].textContent")=='$920.5'
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-feeBase','-1');assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#fee-slices-progressive-bridge .plot-data summary');browser('click','#fee-slices-progressive-bridge .plot-data summary')
assert evaluate("document.querySelector('#fee-slices-progressive-bridge .plot-data').open")
text=evaluate("document.querySelector('#fee-slices-progressive-bridge table').textContent")
assert '$1,670' in text and '$800' in text and '$750' in text,text
print('PASS feeSlices: four figures/tables, desktop/mobile, actual threshold repricing, zero-base N/A with positive minimum, invalid retention, reset and itemized table.')
