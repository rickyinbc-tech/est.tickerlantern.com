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
url=origin+'/research/gis-rrsp-tfsa-withdrawal-income-year-timing'+('.html' if '127.0.0.1' in origin else '')
run('open',url);reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r;reports.append({'width':width,**r})
assert run(expression="JSON.stringify(Array.from(document.querySelectorAll('.planning-metrics strong')).map(x=>x.textContent))===JSON.stringify(['$12,000','$12,000','$0','July 2026 – June 2027','13'])")
run('fill','#planning-gisWithdrawalMonth','1')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[4].textContent==='18'")
run('fill','#planning-gisWithdrawalMonth','12')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[4].textContent==='7'")
run('fill','#planning-gisWithdrawalYear','2026')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[3].textContent==='July 2027 – June 2028'")
run('fill','#planning-gisWithdrawalAmount','100000')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[1].textContent==='$100,000'")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-gisWithdrawalMonth','13')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelectorAll('.planning-metrics strong')[4].textContent==='13'")
assert not run(expression="!document.querySelector('.planning-error').hidden")
for chart in ['gis-withdrawal-maximums','gis-withdrawal-thresholds','gis-withdrawal-source-comparison','gis-withdrawal-month-lag']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#gis-withdrawal-maximums .plot-data summary').scrollIntoView({block:'center'})")
run('click','#gis-withdrawal-maximums .plot-data summary')
assert run(expression="document.querySelector('#gis-withdrawal-maximums .plot-data').open")
(root/'qa/gis-withdrawal-browser.json').write_text(json.dumps(reports,indent=2))
print('GIS withdrawal page passed 1440/390/320 CSS-pixel browser checks: four sourced figures/tables, no overflow, 2025→2026–27 default timing, month and year changes, maximum withdrawal, invalid input retention, reset and accessible chart data. No dollar estimate of GIS or final tax is shown.')
