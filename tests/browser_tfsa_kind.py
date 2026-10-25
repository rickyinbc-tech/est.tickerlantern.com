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
run('open',origin+'/research/tfsa-in-kind-contribution-market-value-cost-gain-room'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r;reports.append({'width':width,**r})
assert run(expression="document.querySelector('.planning-metrics').textContent.includes('$12,000')&&document.querySelector('.planning-metrics').textContent.includes('$4,000')&&document.querySelector('.planning-metrics').textContent.includes('$3,000')")
run('fill','#planning-kindPrice','15')
run('wait','--fn',"document.querySelector('.planning-metrics').textContent.includes('Capital loss that cannot be claimed')")
assert run(expression="document.querySelectorAll('.planning-metrics strong')[1].textContent==='$2,000'&&document.querySelectorAll('.planning-metrics strong')[0].textContent==='$6,000'")
run('fill','#planning-kindPrice','40')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='-$1,000'")
assert run(expression="document.querySelector('#tfsa-kind-room-bridge table').textContent.includes('-$1,000')")
run('fill','#planning-kindUnits','0')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$0'")
assert run(expression="document.querySelectorAll('.planning-metrics strong')[2].textContent==='$15,000'")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-kindUnits','1.5')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$12,000'&&document.querySelectorAll('.planning-metrics strong')[2].textContent==='$3,000'")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['tfsa-kind-account-values','tfsa-kind-room-bridge','tfsa-kind-gain-loss-cases','tfsa-kind-price-room']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#tfsa-kind-room-bridge .plot-data summary').scrollIntoView({block:'center'})")
run('click','#tfsa-kind-room-bridge .plot-data summary')
assert run(expression="document.querySelector('#tfsa-kind-room-bridge .plot-data').open")
(root/'qa/tfsa-kind-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified TFSA in-kind article at 1440, 390 and 320px: four charts/tables, loss case, room shortfall, zero units, invalid fractional units, reset and disclosure.')
