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
run('open',origin+'/research/joint-deposit-insurance-same-owner-set-member-pools'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r;reports.append({'width':width,**r})
assert run(expression="JSON.stringify(Array.from(document.querySelectorAll('.planning-metrics strong')).map(x=>x.textContent))===JSON.stringify(['$292,000','$251,000','$41,000'])")
assert run(expression="document.querySelector('#joint-owner-combined-balances table').textContent.includes('$118,000')&&document.querySelector('#joint-owner-combined-balances table').textContent.includes('Member X · A+B')")
matrix=run(expression="document.querySelector('#joint-owner-same-set-sensitivity table').textContent")
run('fill','#planning-jointYab','0')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$18,000'")
assert matrix==run(expression="document.querySelector('#joint-owner-same-set-sensitivity table').textContent")
run('fill','#planning-jointXabOne','54000')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0'")
assert matrix!=run(expression="document.querySelector('#joint-owner-same-set-sensitivity table').textContent")
for key in ['jointXabOne','jointXabTwo','jointXac']:run('fill','#planning-'+key,'0')
run('wait','--fn',"Array.from(document.querySelectorAll('.planning-metrics strong')).every(x=>x.textContent==='$0')")
assert not run(expression="document.documentElement.scrollWidth>innerWidth")
run('fill','#planning-jointXabOne','100000.01')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0.01'")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-jointYab','-1')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$41,000'")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['joint-owner-combined-balances','joint-owner-within-above','joint-owner-total-reconciliation','joint-owner-same-set-sensitivity']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#joint-owner-same-set-sensitivity .plot-data summary').scrollIntoView({block:'center'})")
run('click','#joint-owner-same-set-sensitivity .plot-data summary')
assert run(expression="document.querySelector('#joint-owner-same-set-sensitivity .plot-data').open")
(root/'qa/joint-owner-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified joint-owner article at 1440, 390 and 320px: four charts/tables, default amounts, isolated sensitivity, exact cap, zero inventory, cent boundary, invalid input retention, reset and disclosure.')
