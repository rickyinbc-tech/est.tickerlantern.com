#!/usr/bin/env python3
"""Check the purchase/repayment ledger through real controls and rendered charts."""
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
browser('open',base+'/research/credit-card-purchases-repayments-savings-budget-double-counting.html')
for width,height in [(1440,1000),(390,844)]:
 browser('set','viewport',str(width),str(height))
 info=evaluate("({lang:document.documentElement.lang,kind:document.querySelector('[data-planning-app]').dataset.planningApp,n:document.querySelectorAll('.planning-figure svg').length,t:document.querySelectorAll('.plot-data table').length,w:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.plot-drawing')].some(e=>e.scrollWidth>e.clientWidth+2),missing:[...document.querySelectorAll('.planning-figure svg')].some(s=>!s.querySelector('title')||!s.querySelector('desc')),badText:[...document.querySelectorAll('.planning-figure svg text')].filter(t=>{const b=t.getBBox(),v=t.ownerSVGElement.viewBox.baseVal;return b.x<-.5||b.x+b.width>v.width+.5}).map(t=>t.textContent)})")
 assert info['lang']=='en' and info['kind']=='cardLedger' and info['n']==5 and info['t']==5,info
 assert info['scroll']<=info['w']+1 and not info['overflow'] and not info['missing'] and not info['badText'],info
 for name,selector in [('periods','.planning-figure:first-child'),('bridge','#card-ledger-wealth-bridge')]:
  evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'start'}})")
  browser('screenshot',str(qa/f'cardLedger-{name}-{width}.png'))
original=evaluate("[...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent)")
browser('scrollintoview','#planning-ledgerCardShare');browser('fill','#planning-ledgerCardShare','0')
browser('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='$0'")
assert evaluate("document.querySelectorAll('.planning-metrics strong')[0].textContent")=="$36,000"
before=evaluate("document.querySelector('.planning-results').innerHTML")
browser('fill','#planning-ledgerCardShare','101')
assert evaluate("!document.querySelector('.planning-error').hidden")
assert before==evaluate("document.querySelector('.planning-results').innerHTML")
browser('scrollintoview','.planning-reset');browser('find','role','button','click','--name','Restore example')
browser('wait','--fn',"JSON.stringify([...document.querySelectorAll('.planning-metrics strong')].map(e=>e.textContent))==="+json.dumps(json.dumps(original,separators=(',',':'))))
browser('scrollintoview','#card-ledger-balances .plot-data summary');browser('click','#card-ledger-balances .plot-data summary')
assert evaluate("document.querySelector('#card-ledger-balances .plot-data').open")
assert '17,200' in evaluate("document.querySelector('#card-ledger-balances table').innerText")
print('PASS cardLedger: five figures/tables, desktop/mobile, bounded SVG labels, real edits, invalid retention, reset and final balances.')
