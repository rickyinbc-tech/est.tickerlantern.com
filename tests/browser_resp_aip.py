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
run('open',origin+'/research/resp-closeout-contribution-grants-aip-rrsp-tax-cash'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r;reports.append({'width':width,**r})
assert run(expression="JSON.stringify(Array.from(document.querySelectorAll('.planning-metrics strong')).map(x=>x.textContent))===JSON.stringify(['$10,000','$40,000','$8,000'])")
assert run(expression="document.querySelector('#resp-aip-closeout-pieces table').textContent.includes('$32,000')&&document.querySelector('#resp-aip-allocation-comparison table').textContent.includes('$45,000')")
grid=run(expression="document.querySelector('#resp-aip-deduction-capacity-grid table').textContent")
run('fill','#planning-respAipPriorRelief','50000')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$0'&&document.querySelectorAll('.planning-metrics strong')[1].textContent==='$45,000'")
assert grid==run(expression="document.querySelector('#resp-aip-deduction-capacity-grid table').textContent")
run('fill','#planning-respAipRoom','0')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$0'")
for k in ['respCloseContributions','respCloseBenefits','respCloseAip']:run('fill','#planning-'+k,'0')
run('wait','--fn',"Array.from(document.querySelectorAll('.planning-metrics strong')).every(x=>x.textContent==='$0')")
assert not run(expression="document.documentElement.scrollWidth>innerWidth")
run('fill','#planning-respAipTaxRate','0')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0'")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-respAipTaxRate','61')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$10,000'")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['resp-aip-closeout-pieces','resp-aip-allocation-comparison','resp-aip-tax-by-deduction','resp-aip-deduction-capacity-grid']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#resp-aip-allocation-comparison .plot-data summary').scrollIntoView({block:'center'})")
run('click','#resp-aip-allocation-comparison .plot-data summary')
assert run(expression="document.querySelector('#resp-aip-allocation-comparison .plot-data').open")
(root/'qa/resp-aip-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified RESP AIP page at 1440, 390 and 320px: four figures/tables, default source and tax checkpoints, independent deduction-capacity matrix, zero balances, zero regular rate, invalid input retention, reset and disclosure.')
