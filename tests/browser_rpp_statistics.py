#!/usr/bin/env python3
import subprocess,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def run(*args,expression=None):
 command=['agent-browser','--session','tl-abc-qa-1025',*args]
 if expression is not None:command+=['eval','--json','--stdin']
 result=subprocess.run(command,input=expression,text=True,capture_output=True,check=True,timeout=30)
 if expression is None:return result.stdout
 data=json.loads(result.stdout);assert data['success'],data
 return data['data']['result']
run('open','http://127.0.0.1:8896/research/registered-pension-plan-counts-members-reference-dates.html')
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'overflow':False},r
 reports.append({'width':width,**r})
run('fill','#planning-rppEndYear','2022')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('6,711,260')")
assert run(expression="document.querySelectorAll('#rpp-member-counts table tbody tr').length")==2
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-rppEndYear','2026')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('click','.planning-reset')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('7,352,686')")
assert not run(expression="!document.querySelector('.planning-error').hidden")
run('eval',"document.querySelector('#rpp-count-indices').scrollIntoView()")
run('screenshot',str(root/'qa/rpp-statistics-indices-mobile.png'))
run('eval',"document.querySelector('#rpp-funding-members').scrollIntoView()")
run('screenshot',str(root/'qa/rpp-statistics-funding-mobile.png'))
run('click','#rpp-funding-members .plot-data summary')
assert run(expression="document.querySelector('#rpp-funding-members .plot-data').open")
(root/'qa/rpp-statistics-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified pension statistics: desktop, 390px and 320px; four charts/tables; period filter, invalid year, reset and disclosure.')
