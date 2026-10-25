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
run('open',origin+'/research/employment-income-age-groups-cross-section-career-forecast'+('.html' if '127.0.0.1' in origin else ''))
reports=[]
for width in [1440,390,320]:
 run('set','viewport',str(width),'1000' if width==1440 else '844')
 r=run(expression="({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,points:document.querySelectorAll('#age-income-share-median circle').length,overflow:document.documentElement.scrollWidth>innerWidth})")
 assert r=={'lang':'en','charts':4,'tables':4,'points':6,'overflow':False},r
 reports.append({'width':width,**r})
run('fill','#planning-incomeAgeYear','2023')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('33,372,500')")
assert run(expression="document.querySelector('#age-income-mean-median table').textContent.includes('65+ · B/C')")
assert run(expression="document.querySelector('#age-income-share-median table').textContent.includes('65+ · C')")
before=run(expression="document.querySelector('.planning-metrics').innerText")
run('fill','#planning-incomeAgeYear','2023.5')
assert run(expression="!document.querySelector('.planning-error').hidden")
assert before==run(expression="document.querySelector('.planning-metrics').innerText")
run('eval',"document.querySelector('.planning-reset').scrollIntoView({block:'center'})")
run('click','.planning-reset')
run('wait','--fn',"document.querySelector('.planning-metrics').innerText.includes('34,439,100')")
assert not run(expression="!document.querySelector('.planning-error').hidden")
assert run(expression="document.querySelector('.planning-reset').textContent==='Restore source year'")
for chart in ['age-income-mean-median','age-income-counts','age-income-recipient-share','age-income-share-median']:
 run('eval',f"document.querySelector('#{chart}').scrollIntoView()")
 run('screenshot',str(root/f'qa/{chart}-mobile.png'))
run('eval',"document.querySelector('#age-income-share-median .plot-data summary').scrollIntoView({block:'center'})")
run('click','#age-income-share-median .plot-data summary')
assert run(expression="document.querySelector('#age-income-share-median .plot-data').open")
assert not run(expression="document.querySelector('#age-income-share-median').textContent.includes('selected allocation')")
(root/'qa/age-income-browser.json').write_text(json.dumps(reports,indent=2))
print('Verified age-income source explorer at 1440, 390 and 320px: four figures/tables, six points, source-year changes, quality labels, invalid year, reset and disclosure.')
