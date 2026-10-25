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
run('open',origin+'/research/monthly-year-over-year-cpi-seasonal-adjustment-annualization'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r;reports.append({'width':width,**r})
assert run(expression="document.querySelectorAll('.planning-metrics strong')[0].textContent==='3.1%'&&document.querySelectorAll('.planning-metrics strong')[1].textContent==='4.91%'&&document.querySelectorAll('.planning-metrics strong')[2].textContent==='$36,949.87'")
assert run(expression="document.querySelector('#cpi-window-index-history table').textContent.includes('2026-08 (R)')&&document.querySelector('#cpi-window-index-history table').textContent.includes('169.4')")
source=run(expression="Array.from(document.querySelectorAll('.planning-figure')).slice(0,2).map(x=>x.querySelector('table').textContent)")
run('fill','#planning-windowMonthlyRate','0')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='0.00%'&&document.querySelectorAll('.planning-metrics strong')[2].textContent==='$36,000'")
assert source==run(expression="Array.from(document.querySelectorAll('.planning-figure')).slice(0,2).map(x=>x.querySelector('table').textContent)")
run('fill','#planning-windowMonthlyRate','-1')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='-11.36%'")
assert run(expression="document.querySelector('#cpi-window-first-year-bills table').textContent.includes('-$')")
run('fill','#planning-windowBudget','0')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0'")
assert run(expression="document.querySelectorAll('.planning-metrics strong')[0].textContent==='3.1%'&&!(document.documentElement.scrollWidth>innerWidth)")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-windowMonthlyRate','-2')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='4.91%'&&document.querySelectorAll('.planning-metrics strong')[2].textContent==='$36,949.87'")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['cpi-window-index-history','cpi-window-published-changes','cpi-window-hypothetical-cost','cpi-window-first-year-bills']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#cpi-window-index-history .plot-data summary').scrollIntoView({block:'center'})")
run('click','#cpi-window-index-history .plot-data summary')
assert run(expression="document.querySelector('#cpi-window-index-history .plot-data').open")
(root/'qa/cpi-window-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified CPI-window article at 1440, 390 and 320px: four charts/tables, revision/date labels, independent cash edits, zero/negative prices, zero budget, invalid range, reset and disclosure.')
