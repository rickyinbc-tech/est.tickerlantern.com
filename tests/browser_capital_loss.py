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
run('open',origin+'/research/capital-loss-carryback-record-taxable-gains-refund-cash'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r;reports.append({'width':width,**r})
assert run(expression="document.querySelector('.planning-metrics').textContent.includes('$9,000')&&document.querySelector('.planning-metrics').textContent.includes('$7,000')&&document.querySelector('.planning-metrics').textContent.includes('$2,000')")
run('fill','#planning-lossCarryRequest','3000')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='$3,000'&&document.querySelectorAll('.planning-metrics strong')[2].textContent==='$6,000'")
run('fill','#planning-lossCarryRequest','0')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='$0'&&document.querySelectorAll('.planning-metrics strong')[2].textContent==='$9,000'")
run('fill','#planning-lossCurrentGain','15000')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$0'&&document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0'")
run('fill','#planning-lossAllowable','0')
run('fill','#planning-lossCurrentGain','0')
run('wait','--fn',"document.querySelector('#capital-loss-record-matrix table tbody tr').textContent==='$0$0'")
assert run(expression="!(document.documentElement.scrollWidth>innerWidth)")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-lossAllowable','-1')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$9,000'&&document.querySelectorAll('.planning-metrics strong')[2].textContent==='$2,000'")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['capital-loss-current-year','capital-loss-prior-capacity','capital-loss-carryforward-record','capital-loss-record-matrix']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#capital-loss-carryforward-record .plot-data summary').scrollIntoView({block:'center'})")
run('click','#capital-loss-carryforward-record .plot-data summary')
assert run(expression="document.querySelector('#capital-loss-carryforward-record .plot-data').open")
(root/'qa/capital-loss-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified capital-loss article at 1440, 390 and 320px: four charts/tables, partial/no carryback, no remaining loss, collapsed zero matrix, invalid input, reset and disclosure.')
