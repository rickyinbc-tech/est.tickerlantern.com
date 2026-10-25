#!/usr/bin/env python3
import subprocess,json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];origin=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8896'
def run(*args,expression=None):
 cmd=['agent-browser','--session','tl-abc-qa-1025',*args]
 if expression is not None:cmd+=['eval','--json','--stdin']
 p=subprocess.run(cmd,input=expression,text=True,capture_output=True,check=True,timeout=30)
 if expression is None:return p.stdout
 data=json.loads(p.stdout);assert data['success'],data
 return data['data']['result']
run('open',origin+'/research/rrif-in-kind-minimum-payment-securities-bank-cash'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r;reports.append({'width':width,**r})
run('fill','#planning-rrifKindShare','100')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('$12,000')")
assert run(expression="document.querySelector('.planning-metrics').textContent.includes('Cash portion reaching the bank$0')")
run('fill','#planning-rrifKindBank','50000')
run('wait','--fn',"document.querySelector('#rrif-kind-cash-budget table').textContent.includes('$26,000')")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-rrifKindShare','101')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('$2,000')")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['rrif-kind-payment-parts','rrif-kind-cash-budget','rrif-kind-share-cash','rrif-kind-bank-matrix']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#rrif-kind-bank-matrix .plot-data summary').scrollIntoView({block:'center'})")
run('click','#rrif-kind-bank-matrix .plot-data summary')
assert run(expression="document.querySelector('#rrif-kind-bank-matrix .plot-data').open")
(root/'qa/rrif-kind-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified RRIF payment form at 1440, 390 and 320px: four figures/tables, securities-only receipt, cash change, invalid share, reset and disclosure.')
