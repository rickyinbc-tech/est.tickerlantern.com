#!/usr/bin/env python3
"""Verify exact accrual dates, fixed denominators and a year-partition donut."""
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
browser('open',base+'/research/actual-days-interest-360-fixed-365-leap-year-denominator.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='dayBasis' and info['n']==4 and info['t']==4,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('amounts','#day-basis-interest-comparison'),('calendar','#day-basis-calendar-split'),('matrix','#day-basis-calendar-difference-grid')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'dayBasis-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
assert original==['91','$124.66','$1.73'],original
browser('scrollintoview','#planning-dayBasisStart');browser('fill','#planning-dayBasisStart','31');browser('fill','#planning-dayBasisDays','1')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='1'")
text=evaluate("document.querySelector('#day-basis-calendar-split table').textContent")
assert '2027' in text and '2028' not in text,text
browser('fill','#planning-dayBasisDays','2')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='2'")
text=evaluate("document.querySelector('#day-basis-calendar-split table').textContent")
assert '2027' in text and '2028' in text,text
browser('fill','#planning-dayBasisPrincipal','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='$0'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[2].textContent")=='$0'
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-dayBasisDays','1.5');assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#day-basis-calendar-split .plot-data summary');browser('click','#day-basis-calendar-split .plot-data summary')
assert evaluate("document.querySelector('#day-basis-calendar-split .plot-data').open")
text=evaluate("document.querySelector('#day-basis-calendar-split table').textContent")
assert '17' in text and '74' in text and '366-day calendar' in text,text
assert '2028-03-15' in evaluate("document.querySelector('#day-basis-cumulative-accrual table').textContent")
print('PASS dayBasis: four figures/tables, desktop/mobile, exclusive close on 1 January, leap-year entry on next day, zero principal, fractional retention, reset, exact date table and exhaustive day donut.')
