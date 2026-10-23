"""Five-year defaults, migration, calculations and actual CSV downloads in Chromium."""
import atexit
import csv
import io
import json
import os
import shutil
from pathlib import Path
import subprocess
import sys
import time

URL = sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8865/'
SESSION = f'est-five-year-{os.getpid()}'
ROOT = Path(__file__).resolve().parents[1]
QA = ROOT/'qa'; QA.mkdir(exist_ok=True)
def browser(*args): return subprocess.check_output(['agent-browser','--session',SESSION,'--download-path',str(QA),*map(str,args)],text=True).strip()
def value(script): return json.loads(browser('eval',script))
def check(label, ok):
    print(('PASS: ' if ok else 'FAIL: ')+label,flush=True)
    if not ok: raise AssertionError(label)
def state():
    return value('({years:Number(document.querySelector("#years").value),fixed:document.querySelector("#years").readOnly,mode:document.querySelector("#growthMode").value,rates:Array.from(document.querySelectorAll("[data-growth-year]"),e=>Number(e.value)),valid:!document.querySelector("#valid-output").hidden,irr:document.querySelector("#cash-irr").textContent})')
def index(id):
    selector='#index-list button[data-index="'+id+'"]'
    browser('eval','document.querySelector('+json.dumps(selector)+').scrollIntoView({block:"center",behavior:"instant"})')
    browser('click',selector)
    browser('wait',selector+'[aria-pressed="true"]')
def download(selector,path):
    # Native Chrome saves under the suggested filename; verify actual bytes,
    # rather than trusting wait --download's echoed destination argument.
    roots=[QA,Path.home()/'Downloads']
    before={p:(p.stat().st_mtime_ns,p.stat().st_size) for root in roots for p in root.glob('tickerlantern*.csv')}
    browser('eval','(async()=>{document.querySelector('+json.dumps(selector)+').scrollIntoView({block:"center",behavior:"instant"});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()')
    browser('focus',selector);browser('press','Enter')
    deadline=time.monotonic()+5;created=set()
    while time.monotonic()<deadline and not created:
        created={p for root in roots for p in root.glob('tickerlantern*.csv') if before.get(p)!=(p.stat().st_mtime_ns,p.stat().st_size)}
        if not created: time.sleep(.1)
    assert len(created)==1, f'Expected one completed download, got {created}'
    downloaded=created.pop()
    previous=None;stable=0;deadline=time.monotonic()+5
    while time.monotonic()<deadline and stable<3:
        size=downloaded.stat().st_size
        stable=stable+1 if size>0 and size==previous else 0
        previous=size;time.sleep(.1)
    assert stable==3, 'Downloaded bytes did not settle'
    shutil.move(str(downloaded),path)
def load():
    browser('open',URL); browser('wait','#check-data:enabled')
    browser('eval','document.documentElement.style.scrollBehavior="auto"')
atexit.register(lambda:subprocess.run(['agent-browser','--session',SESSION,'close'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL))
load();browser('eval','localStorage.removeItem("tickerlantern.est.scenarios.v1")');load()
ids=value('Array.from(document.querySelectorAll("#index-list button"),e=>e.dataset.index)')
check('21 default comparisons render',len(ids)==21 and value('document.querySelectorAll("#five-year-comparison-body tr").length')==21)
for id in ids:
    index(id);s=state()
    check(id+' uses five valid annual inputs',s['years']==5 and s['fixed'] and s['mode']=='source' and len(s['rates'])==5 and s['valid'])
    check(id+' charts and sensitivity use five years',value('document.querySelector("#wealth-subtitle").textContent.startsWith("5-year") && document.querySelector("#sensitivity-badge").textContent.startsWith("5-year") && document.querySelectorAll("#annual-data-body tr").length===6'))
index('sp500');check('S&P path normalizes its sourced 16% rate',state()['rates']==[16,13.5,11,8.5,6])
check('source and estimated years have separate labels',value('document.querySelector("label[for=growth-year-1]").textContent.includes("published") && document.querySelector("label[for=growth-year-2]").textContent.includes("model estimate")'))
browser('fill','#growth-year-3','4')
browser('click','#check-data');browser('wait','#check-data:enabled')
check('refresh protects a custom model year',state()['rates']==[16,13.5,4,8.5,6])
index('nasdaq100');index('sp500');check('benchmark switch protects the five-year override',state()['rates']==[16,13.5,4,8.5,6])
load();check('reload protects the five-year override',state()['rates']==[16,13.5,4,8.5,6])
browser('click','#restore-growth-years');check('restore returns a complete five-year forecast',state()['rates']==[16,13.5,11,8.5,6])

# Actual browser downloads, with the real anchor click and unmodified Blob APIs.
download('#download-csv',QA/'five-year-active.csv')
records=list(csv.DictReader(io.StringIO((QA/'five-year-active.csv').read_text())))
check('active download contains entry plus five years',len(records)==6 and all(r['Holding years']=='5' for r in records))
check('active download distinguishes published and model evidence',records[1]['Growth basis']=='consensus' and all(r['Growth basis']=='model extension' and r['Observation date']=='' and r['Source URL']=='' for r in records[2:]))
# Independently compound prices and value annual cash flows from downloaded inputs.
last=records[-1];entry=float(last['Entry PE assumption']);exit=float(last['Exit PE assumption'])
eps=100/entry;dividends=[]
for r in records[1:]:
    dividends.append(eps*.30);eps*=1+float(r['EPS growth percent'])/100
terminal=eps*exit
check('CSV terminal value reconciles to independent compounding',abs(float(last['Normalized price index'])-terminal)<1e-9)
lo,hi=-.99,2
for _ in range(150):
    rate=(lo+hi)/2
    npv=-100+sum(d/(1+rate)**(i+1) for i,d in enumerate(dividends))+terminal/(1+rate)**5
    if npv>0:lo=rate
    else:hi=rate
check('displayed five-year IRR reconciles to independent cash flows',state()['irr']==f'{rate*100:.2f}%')
download('#download-five-year',QA/'five-year-universe.csv')
universe=list(csv.DictReader(io.StringIO((QA/'five-year-universe.csv').read_text())))
check('all-index download has 126 records for 21 complete five-year paths',len(universe)==126 and len({r['Benchmark ID'] for r in universe})==21 and all(r['Holding years']=='5' for r in universe))

browser('select','#growthMode','annual')
for i,g in enumerate([10,-5,20,3,4],1):browser('fill',f'#growth-year-{i}',g)
browser('fill','#entryPE','20');browser('fill','#exitPE','20')
check('custom mode preserves five separate rates',state()['rates']==[10,-5,20,3,4] and state()['years']==5)
check('custom annual output uses all five rates',value('document.querySelector("#annual-data-body tr:last-child td:nth-child(5)").textContent')=='134.33')
browser('fill','#growth-year-2','')
check('blank edited year blocks stale results and active download',value('document.querySelector("#valid-output").hidden && document.querySelector("#download-csv").disabled'))
browser('fill','#growth-year-2','-5');browser('click','#restore-source')
check('restoring valuations preserves custom yearly growth',state()['rates']==[10,-5,20,3,4] and state()['years']==5)
browser('click','[data-preset=compression]');check('presets preserve five-year growth',state()['rates']==[10,-5,20,3,4])
browser('click','#sensitivity-body button');check('sensitivity chooses a five-year constant case',state()['mode']=='constant' and state()['years']==5)
browser('select','#growthMode','annual');check('switching back retains all custom years',state()['rates']==[10,-5,20,3,4])
browser('click','#reset-model');check('reset uses five years, including extrapolation',state()['mode']=='source' and state()['rates']==[16,13.5,11,8.5,6])

# Seed a real v1 browser record, including the previously allowed locked horizon.
legacy={'version':1,'selectedIndexId':'sp500','following':False,'scenarios':[['sp500',{'years':2,'growthMode':'annual','annualGrowth':[7,8],'growth':4,'entryPE':17,'exitPE':18}]],'overrides':[['sp500',{'years':True,'growthMode':True,'annualGrowth':True,'entryPE':True,'exitPE':True}]]}
browser('eval','localStorage.setItem("tickerlantern.est.scenarios.v1",'+json.dumps(json.dumps(legacy))+')');load()
check('paused old two-year settings migrate to five without losing edits',state()['rates']==[7,8,4,4,4] and state()['years']==5 and value('document.querySelector("#entryPE").value')=='17')
browser('click','#reset-model')
for width,height in [(360,800),(390,844),(768,1024),(1440,1000)]:
    browser('set','viewport',width,height)
    check(f'{width}px page has no document overflow',value('document.documentElement.scrollWidth<=innerWidth'))
    if width==390:
        browser('eval','document.querySelector("#model").scrollIntoView({behavior:"instant"})')
        browser('screenshot',QA/'five-year-mobile-model.png')
    if width==1440:
        browser('eval','document.querySelector("#five-year-comparison").scrollIntoView({behavior:"instant"})')
        browser('screenshot',QA/'five-year-desktop-comparison.png')
check('browser reports no uncaught JavaScript errors',not browser('errors'))
print('Five-year browser verification complete.',flush=True)
