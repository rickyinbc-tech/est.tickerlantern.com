#!/usr/bin/env python3
import subprocess,json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
origin=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8896'
def run(*args,expression=None):
 cmd=['agent-browser','--session','tl-abc-qa-1025',*args]
 if expression is not None:cmd+=['eval','--json','--stdin']
 p=subprocess.run(cmd,input=expression,text=True,capture_output=True,check=True,timeout=30)
 if expression is None:return p.stdout
 data=json.loads(p.stdout);assert data['success'],data
 return data['data']['result']
run('open',origin+'/research/contractor-hourly-quote-billable-capacity-unpaid-time'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r
 reports.append({'width':width,**r})
run('fill','#planning-capacityAdmin','100')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('No billable hours')")
assert run(expression="document.querySelector('.planning-metrics').textContent.includes('-$24,000')")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('$94,680')")
run('fill','#planning-capacityRate','125')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('$124,350')")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-capacityDowntime','2.5')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('$94,680')")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['capacity-hours','capacity-cash-bridge','capacity-rate-target','capacity-unpaid-matrix']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#capacity-unpaid-matrix .plot-data summary').scrollIntoView({block:'center'})")
run('click','#capacity-unpaid-matrix .plot-data summary')
assert run(expression="document.querySelector('#capacity-unpaid-matrix .plot-data').open")
(root/'qa/billable-capacity-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified billable capacity at 1440, 390 and 320px; four charts/tables; zero billing, rate edit, invalid week, reset and disclosure.')
