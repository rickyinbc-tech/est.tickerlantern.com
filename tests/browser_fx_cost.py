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
run('open',origin+'/research/foreign-investment-cad-cost-acquisition-sale-exchange-rates'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r;reports.append({'width':width,**r})
assert run(expression="document.querySelector('.planning-metrics').textContent.includes('$3,650')&&document.querySelector('.planning-metrics').textContent.includes('$12,500')&&document.querySelector('.planning-metrics').textContent.includes('$16,200')")
run('fill','#planning-fxSaleUsd','10000')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$950'")
assert run(expression="document.querySelectorAll('.planning-metrics strong')[1].textContent==='$12,500'")
run('fill','#planning-fxSaleCad','1.25')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='-$50'")
run('fill','#planning-fxSellingCad','0')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$0'")
run('fill','#planning-fxSaleUsd','0')
run('fill','#planning-fxOriginalUsd','0')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$0'&&document.querySelectorAll('.planning-metrics strong')[1].textContent==='$0'&&document.querySelectorAll('.planning-metrics strong')[2].textContent==='$0'")
assert run(expression="document.querySelector('#fx-cost-sale-sensitivity table thead tr').children.length===2&&!(document.documentElement.scrollWidth>innerWidth)")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-fxBuyCad','0')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[0].textContent==='$3,650'&&document.querySelectorAll('.planning-metrics strong')[1].textContent==='$12,500'")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['fx-cost-dated-cad-record','fx-cost-price-currency-bridge','fx-cost-equal-usd-cases','fx-cost-sale-sensitivity']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#fx-cost-price-currency-bridge .plot-data summary').scrollIntoView({block:'center'})")
run('click','#fx-cost-price-currency-bridge .plot-data summary')
assert run(expression="document.querySelector('#fx-cost-price-currency-bridge .plot-data').open")
(root/'qa/fx-cost-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified dated-FX-cost article at 1440, 390 and 320px: four charts/tables, equal USD proceeds, fixed historical cost, equal rates, CAD expense, zero matrix column, invalid rate, reset and disclosure.')
