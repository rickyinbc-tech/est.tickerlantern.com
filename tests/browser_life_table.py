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
run('open',origin+'/research/period-life-table-remaining-years-retirement-funding-horizon'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r;reports.append({'width':width,**r})
assert run(expression="document.querySelector('#period-life-expectancy-intervals table').textContent.includes('20.83')&&document.querySelector('#period-life-expectancy-intervals table').textContent.includes('20.87')")
source=run(expression="document.querySelector('#period-life-conditional-survival table').textContent")
run('fill','#planning-lifeTableGap','0')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0'")
assert source==run(expression="document.querySelector('#period-life-conditional-survival table').textContent")
run('fill','#planning-lifeTableAge','75')
run('wait','--fn',"document.querySelector('#period-life-expectancy-intervals table').textContent.includes('exact age 75')")
assert run(expression="document.querySelector('#period-life-conditional-survival table tbody tr:first-child').textContent.startsWith('75')&&document.querySelector('#period-life-conditional-survival table tbody tr:first-child').textContent.includes('100.00%')")
assert run(expression="document.querySelector('.planning-metrics').textContent.includes('13.25 years')")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-lifeTableAge','75.5')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('20.85 years')&&document.querySelector('.planning-metrics').innerText.includes('$1,200,000')")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['period-life-expectancy-intervals','period-life-conditional-survival','period-life-target-ages','period-life-cash-horizons']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#period-life-expectancy-intervals .plot-data summary').scrollIntoView({block:'center'})")
run('click','#period-life-expectancy-intervals .plot-data summary')
assert run(expression="document.querySelector('#period-life-expectancy-intervals .plot-data').open")
(root/'qa/period-life-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified period-life article at 1440, 390 and 320px: four charts/tables, exact bounds, independent cash input, age conditioning, invalid age, reset and disclosure.')
