#!/usr/bin/env python3
import subprocess,json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
origin=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8896'
def run(*args,expression=None):
 command=['agent-browser','--session','tl-abc-qa-1025',*args]
 if expression is not None:command+=['eval','--json','--stdin']
 p=subprocess.run(command,input=expression,text=True,capture_output=True,check=True,timeout=30)
 if expression is None:return p.stdout
 data=json.loads(p.stdout);assert data['success'],data
 return data['data']['result']
run('open',origin+'/research/critical-illness-lump-sum-disability-monthly-cash-calendar'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r
 reports.append({'width':width,**r})
run('fill','#planning-illnessLumpMonth','12')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('$29,000')")
run('fill','#planning-illnessFirstMonth','20')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('$50,000 / $0')")
assert run(expression="document.querySelector('#illness-cash-paths table tbody tr:last-child').textContent.includes('-$50,000')")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-illnessPaymentMonths','1.5')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('$50,000 / $54,000')")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['illness-cash-paths','illness-lump-delay-matrix']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#illness-lump-delay-matrix .plot-data summary').scrollIntoView({block:'center'})")
run('click','#illness-lump-delay-matrix .plot-data summary')
assert run(expression="document.querySelector('#illness-lump-delay-matrix .plot-data').open")
(root/'qa/illness-cash-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified independent illness cash scenarios: 1440, 390, 320px; four figures/tables; cash dates, out-of-window receipts, invalid month, reset and disclosure.')
