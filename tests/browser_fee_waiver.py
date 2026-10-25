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
run('open',origin+'/research/bank-fee-waiver-extra-balance-foregone-interest'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r;reports.append({'width':width,**r})
assert run(expression="document.querySelector('.planning-metrics').textContent.includes('$236.93')&&document.querySelector('.planning-metrics').textContent.includes('$6,487.53')")
run('fill','#planning-waiverYield','0')
run('wait','--fn',"document.querySelector('.planning-metrics').textContent.includes('No finite balance at 0%')")
assert run(expression="document.querySelectorAll('.planning-metrics strong')[0].textContent==='$960'")
run('fill','#planning-waiverMonths','0')
run('wait','--fn',"document.querySelector('.planning-metrics').textContent.includes('All balances tie at 0%')")
assert run(expression="document.querySelectorAll('.planning-metrics strong')[0].textContent==='$0'")
run('fill','#planning-waiverYield','3')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent.includes('796.37')")
assert run(expression="document.querySelectorAll('.planning-metrics strong')[0].textContent.includes('-')||document.querySelectorAll('.planning-metrics strong')[0].textContent.includes('−')")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-waiverMonths','1.5')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelector('.planning-metrics').textContent.includes('$236.93')&&document.querySelector('.planning-metrics').textContent.includes('$6,487.53')")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['waiver-equal-resource-paths','waiver-resource-difference','waiver-qualifying-months','waiver-balance-yield-matrix']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#waiver-resource-difference .plot-data summary').scrollIntoView({block:'center'})")
run('click','#waiver-resource-difference .plot-data summary')
assert run(expression="document.querySelector('#waiver-resource-difference .plot-data').open")
(root/'qa/fee-waiver-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified fee-waiver article at 1440, 390 and 320px: four charts/tables, zero yield, zero qualifying months, negative difference, invalid fractional months, reset and disclosure.')
