"""End-to-end published growth checks through the actual browser UI."""
import atexit
import datetime as dt
import json
import os
import subprocess
import sys

URL = sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8864/'
SESSION = f'est-published-growth-{os.getpid()}'
def browser(*args): return subprocess.check_output(['agent-browser','--session',SESSION,*args],text=True).strip()
def value(script): return json.loads(browser('eval',script))
def index(id):
    selector='#index-list button[data-index="'+id+'"]'
    browser('eval', '(async()=>{const el=document.querySelector('+json.dumps(selector)+');el.scrollIntoView({block:"center",behavior:"instant"});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()')
    browser('click',selector)
    if not value('document.querySelector('+json.dumps(selector)+').getAttribute("aria-pressed")=="true"'):
        browser('click',selector)
    browser('wait',selector+'[aria-pressed="true"]')
atexit.register(lambda: subprocess.run(['agent-browser','--session',SESSION,'close'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL))
def check(name, passed):
    print(('PASS: ' if passed else 'FAIL: ')+name,flush=True)
    if not passed: raise SystemExit(1)

browser('open',URL)
browser('wait','#check-data:enabled')
browser('eval','localStorage.removeItem("tickerlantern.est.scenarios.v1")')
browser('open',URL)
browser('wait','#check-data:enabled')
browser('eval','document.documentElement.style.scrollBehavior="auto"')
feed=value('fetch("/data/indices.json").then(r=>r.json())')
year=value('Number(new Intl.DateTimeFormat("en",{year:"numeric",timeZone:"America/Vancouver"}).format(new Date()))+1')
for row in feed['indices']:
    index(row['id'])
    actual=value('({mode:document.querySelector("#growthMode").value,years:Number(document.querySelector("#years").value),rates:Array.from(document.querySelectorAll("[data-growth-year]"),e=>Number(e.value)),readonly:Array.from(document.querySelectorAll("[data-growth-year]")).every(e=>e.readOnly),status:document.querySelector("#growth-forecast-status").textContent,valid:!document.querySelector("#valid-output").hidden})')
    points={p['year']:p['growth'] for p in row['growthForecast']['estimates']}
    expected=[]
    while year+len(expected) in points: expected.append(points[year+len(expected)])
    if actual['rates']!=expected or not actual['valid']: print({'actual':actual,'expected':expected},flush=True)
    check(row['name']+' uses its own published future path',actual['mode']=='source' and actual['rates']==expected and actual['years']==len(expected) and actual['readonly'] and actual['valid'])
    if row['growthForecast']['forecastType']=='house': check(row['name']+' labels house forecasts', 'house forecast' in actual['status'])
    if row['id']=='russell2000': check('blocked Russell source remains dated and retained','dated or retained' in actual['status'])
index('sp500')
browser('fill','#years','3')
check('unpublished years block calculation instead of repeating a rate',value('document.querySelector("#valid-output").hidden && document.querySelector("#growth-year-2").value==="" && document.querySelector("#download-csv").disabled'))
browser('click','#use-source-growth')
check('source button restores the published horizon',value('Number(document.querySelector("#years").value)===1 && !document.querySelector("#valid-output").hidden'))
browser('eval','window.qaCreateURL=URL.createObjectURL; URL.createObjectURL=blob=>{window.qaCSV=blob;return window.qaCreateURL(blob)}; HTMLAnchorElement.prototype.click=function(){}')
browser('eval','document.querySelector("#download-csv").click()')
csv=value('window.qaCSV.text()')
check('published CSV identifies rate, period and source', 'Published period' in csv and '2027 annual earnings estimate' in csv and 'advantage.factset.com' in csv and csv.splitlines()[-1].endswith(',16'))
browser('select','#growthMode','annual')
browser('fill','#years','2')
browser('fill','#growth-year-1','7')
browser('fill','#growth-year-2','8')
browser('click','#check-data')
browser('wait','#check-data:enabled')
check('refresh protects custom yearly rates',value('document.querySelector("#growthMode").value==="annual" && Array.from(document.querySelectorAll("[data-growth-year]"),e=>Number(e.value)).join(",")==="7,8"'))
browser('click','#use-source-growth')
browser('set','viewport','390','844')
check('mobile page stays within the viewport',value('document.documentElement.scrollWidth<=window.innerWidth'))
print('Published growth browser checks passed.',flush=True)
