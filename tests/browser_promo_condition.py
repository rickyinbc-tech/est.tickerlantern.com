#!/usr/bin/env python3
"""Verify conditional memo assessment, nearly complete payoff and exact waiver."""
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
browser('open',base+'/research/zero-interest-deferred-interest-payoff-condition-deadline.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='promoCondition' and info['n']==4 and info['t']==4,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('memo','#promo-condition-memo-interest'),('assessment','#promo-condition-posted-balance'),('topups','#promo-condition-topup-comparison')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'promoCondition-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
assert original==['$240','$338.4','$578.4'],original
fixed=evaluate("[...document.querySelectorAll('.planning-figure')].slice(0,2).map(e=>e.innerHTML)")
browser('scrollintoview','#planning-promoTopup');browser('fill','#planning-promoTopup','99')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$340.8'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[0].textContent")=='$2.4'
assert fixed==evaluate("[...document.querySelectorAll('.planning-figure')].slice(0,2).map(e=>e.innerHTML)")
browser('fill','#planning-promoTopup','100')
browser('wait','--fn',"[...document.querySelectorAll('.planning-metrics strong')].every(e=>e.textContent==='$0')")
assert fixed==evaluate("[...document.querySelectorAll('.planning-figure')].slice(0,2).map(e=>e.innerHTML)")
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-promoMonths','1.5');assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#promo-condition-posted-balance .plot-data summary');browser('click','#promo-condition-posted-balance .plot-data summary')
assert evaluate("document.querySelector('#promo-condition-posted-balance .plot-data').open")
text=evaluate("document.querySelector('#promo-condition-posted-balance table').textContent")
assert '$240' in text and '$338.4' in text,text
print('PASS promoCondition: four figures/tables, desktop/mobile, fixed earlier history, 99% residual and full assessment, 100% waiver, fractional retention, reset and component table.')
