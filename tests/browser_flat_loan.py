#!/usr/bin/env python3
"""Verify flat quote cash-flow equivalence and zero-advance boundaries."""
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
browser('open',base+'/research/flat-interest-original-principal-reducing-balance-effective-cost.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='flatLoan' and info['n']==4 and info['t']==4,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('interest','#flat-loan-monthly-interest'),('totals','#flat-loan-total-payments'),('matrix','#flat-loan-effective-grid')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'flatLoan-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
assert original==['$466.67','$443.21','11.71%'],original
fixed=evaluate("document.querySelector('#flat-loan-effective-grid').innerHTML")
browser('scrollintoview','#planning-flatPrincipal');browser('fill','#planning-flatPrincipal','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='N/A · no advance or repayments'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[0].textContent")=='$0'
assert fixed==evaluate("document.querySelector('#flat-loan-effective-grid').innerHTML")
browser('fill','#planning-flatPrincipal','10000');browser('fill','#planning-flatQuote','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='0.00%'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[0].textContent")=='$416.67'
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-flatMonths','1.5');assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#flat-loan-total-payments .plot-data summary');browser('click','#flat-loan-total-payments .plot-data summary')
assert evaluate("document.querySelector('#flat-loan-total-payments .plot-data').open")
text=evaluate("document.querySelector('#flat-loan-total-payments table').textContent")
assert '$10,000' in text and '$1,200' in text and '$636.95' in text,text
print('PASS flatLoan: four figures/tables, desktop/mobile, quoted rates vs annual equivalence, zero advance N/A, independent positive-unit grid, zero rate, fractional retention, reset and cost table.')
