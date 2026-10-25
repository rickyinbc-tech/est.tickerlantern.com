"""Exercise real inputs, survey/scenario independence, exact tables and mobile figures."""
import json
from pathlib import Path
import subprocess
import sys

ORIGIN=sys.argv[1].rstrip('/') if len(sys.argv)>1 else 'http://127.0.0.1:8876'
ROOT=Path(__file__).resolve().parents[1];QA=ROOT/'qa';SESSION='tickerlantern-content'
SLUG='perceived-missed-payment-probability-survey-full-minimum-cash'
def browser(*args):return subprocess.check_output(['agent-browser','--session',SESSION,*map(str,args)],text=True).strip()
def value(js):return json.loads(browser('eval',js))
def settle():value('(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return true})()')
def check(label,ok):print(('PASS: ' if ok else 'FAIL: ')+label,flush=True);assert ok,label
def fill(key,n):browser('fill','#planning-'+key,str(n));settle()
def metrics():return value('Array.from(document.querySelectorAll(".planning-metrics strong")).map(e=>e.textContent)')
def reset():browser('click','.planning-reset');settle()
def bounded():return value('Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>{const b=svg.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth+1&&Array.from(svg.querySelectorAll("text")).every(t=>{const r=t.getBoundingClientRect();return r.left>=b.left-1&&r.right<=b.right+1;});})')
browser('set','viewport','1440','1000')
browser('open',ORIGIN+'/research/'+SLUG+('.html' if ORIGIN.startswith('http://127.0.0.1') else ''))
browser('wait','.planning-results svg');settle()
check('five accessible figures and five inspectable data tables',value('document.querySelectorAll(".planning-results svg[role=img]").length===5&&document.querySelectorAll(".plot-data table").length===5'))
check('English page, six explanation sections and canonical route',value('document.documentElement.lang==="en"&&document.querySelectorAll(".guide-prose>section:not(.guide-sources):not(.guide-related)").length===6&&document.querySelector("link[rel=canonical]").href==='+json.dumps('https://tickerlantern.com/research/'+SLUG)))
check('survey and independent funding metrics have explicit separate values',metrics()==['5.29%','$600','$900'])
official=value('Array.from(document.querySelectorAll(".plot-data table")).slice(0,2).map(e=>e.textContent)')
check('official table retains five exact two-decimal percent observations',all(s in official[0] for s in ['2025 Q3','5.78%','9.49%','9.24%','7.37%','5.29%']))
check('quarter changes retain the percentage-point unit',all(s in official[1] for s in ['3.71 pp','-0.25 pp','-1.87 pp','-2.08 pp']))
check('official versus hypothetical evidence labels are explicit',value('Array.from(document.querySelectorAll(".planning-evidence")).map(e=>e.textContent).join("|")==="Official survey results|Derived from published survey results|Hypothetical scenario|Hypothetical scenario|Hypothetical scenario"'))
fill('perceptionCash',1600)
check('extra actual cash covers the full minimum without changing the probability',metrics()==['5.29%','$1,600','$0'])
check('scenario changes preserve both official data panels',value('Array.from(document.querySelectorAll(".plot-data table")).slice(0,2).map(e=>e.textContent)')==official)
check('waterfall caps applied cash at the minimum',value('document.querySelector("#payment-perception-full-minimum table").textContent.includes("-$1,500")'))
accepted=metrics();fill('perceptionDueDay',1.5)
check('fractional calendar day rejected and accepted figures retained',value('!document.querySelector(".planning-error").hidden&&document.querySelector("#planning-perceptionDueDay").getAttribute("aria-invalid")==="true"') and metrics()==accepted)
reset();fill('perceptionReceiptDay',10)
check('shared-day cleared receipt funds the payment under the stated convention',metrics()==['5.29%','$1,600','$0'])
check('shared-day funding calendar has no invented negative balance',value('!document.querySelector("#payment-perception-dated-funding table").textContent.includes("-$")'))
accepted=metrics();fill('perceptionCash',-1)
check('negative cash rejected without replacing the valid results',value('!document.querySelector(".planning-error").hidden') and metrics()==accepted)
reset();check('restore returns source and independent example defaults',metrics()==['5.29%','$600','$900'] and value('document.querySelector(".planning-error").hidden'))
browser('click','#payment-perception-survey-history .plot-data summary')
check('source data table opens visibly',value('document.querySelector("#payment-perception-survey-history .plot-data").open&&document.querySelector("#payment-perception-survey-history tbody tr").getBoundingClientRect().height>0'))
for width in [1440,390,320]:
 browser('set','viewport',width,1000);settle()
 check('page and SVG text remain within bounds at '+str(width),value('document.documentElement.scrollWidth<=innerWidth+1') and bounded())
 check('adjacent SVG labels remain separated at '+str(width),value('Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>{const a=Array.from(svg.querySelectorAll("text"));return a.every((t,i)=>a.slice(i+1).every(u=>{const x=t.getBoundingClientRect(),y=u.getBoundingClientRect();return Math.abs(x.top-y.top)>=1||Math.min(x.right,y.right)-Math.max(x.left,y.left)<-2;}));})'))
 if width==390:
  for chart in ['payment-perception-survey-history','payment-perception-quarter-change','payment-perception-full-minimum','payment-perception-dated-funding','payment-perception-timing-grid']:
   browser('eval','document.querySelector('+json.dumps('#'+chart)+').scrollIntoView({block:"start",behavior:"instant"});true')
   browser('screenshot',QA/(chart+'-mobile.png'))
reset();fill('perceptionDueDay',1);fill('perceptionReceiptDay',60)
check('early full minimum remains short despite a late receipt',metrics()==['5.29%','$600','$900'] and value('document.querySelector("#payment-perception-dated-funding table").textContent.includes("-$900")'))
fill('perceptionBill',10000);fill('perceptionCash',20000);fill('perceptionReceipt',20000)
check('largest supported amounts remain finite and fit at 320px',bounded() and value('document.documentElement.scrollWidth<=innerWidth+1&&!/NaN|Infinity|undefined/.test(document.querySelector(".planning-results").innerHTML)'))
for key in ['perceptionBill','perceptionCash','perceptionReceipt']:fill(key,0)
check('zero payment and resources preserve five finite figures',metrics()==['5.29%','$0','$0'] and value('document.querySelectorAll(".planning-results svg").length===5&&!/NaN|Infinity|undefined/.test(document.querySelector(".planning-results").innerHTML)'))
reset();check('all input errors clear after restoring defaults',value('document.querySelector(".planning-error").hidden&&Array.from(document.querySelectorAll(".planning-controls input")).every(e=>e.getAttribute("aria-invalid")==="false")'))
errors=browser('errors');check('no uncaught browser errors',not errors or errors in ['[]','No page errors'])
browser('open',ORIGIN+'/research/');browser('wait','a[href="/research/'+SLUG+'"]')
check('research library links the new article',value('Boolean(document.querySelector("a[href=\\"/research/'+SLUG+'\\"]"))'))
print('Browser verification complete.',flush=True)
