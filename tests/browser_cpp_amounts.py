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
run('open',origin+'/research/cpp-average-maximum-new-beneficiary-start-month-cash-budget'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r;reports.append({'width':width,**r})
assert run(expression="document.querySelector('.planning-metrics').textContent.includes('$858.34')&&document.querySelector('.planning-metrics').textContent.includes('$700')&&document.querySelector('.planning-metrics').textContent.includes('$2,400')")
assert run(expression="document.querySelector('#cpp-new-start-maximum-months svg').textContent.includes('$1,500')&&document.querySelector('#cpp-new-start-maximum-months svg').textContent.includes('$1,530')")
source=run(expression="Array.from(document.querySelectorAll('.planning-figure')).slice(0,2).map(x=>x.querySelector('table').textContent)")
run('fill','#planning-cppCashPension','1700')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='$0'&&document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0'")
assert source==run(expression="Array.from(document.querySelectorAll('.planning-figure')).slice(0,2).map(x=>x.querySelector('table').textContent)")
run('fill','#planning-cppCashSpend','20000')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='$16,500'")
assert run(expression="document.querySelector('#cpp-household-cash-path table').textContent.includes('-$192,000')&&! (document.documentElement.scrollWidth>innerWidth)")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-cppCashMonths','1.5')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='$700'&&document.querySelectorAll('.planning-metrics strong')[2].textContent==='$2,400'")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['cpp-amount-reference-labels','cpp-new-start-maximum-months','cpp-household-cash-budget','cpp-household-cash-path']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#cpp-new-start-maximum-months .plot-data summary').scrollIntoView({block:'center'})")
run('click','#cpp-new-start-maximum-months .plot-data summary')
assert run(expression="document.querySelector('#cpp-new-start-maximum-months .plot-data').open")
(root/'qa/cpp-amounts-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified CPP amount article at 1440, 390 and 320px: four charts/tables, fixed source figures, exact monthly gap, extreme shortage, invalid months, reset and disclosure.')
