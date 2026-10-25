"""Exercise the loan-rate-order article using real DOM controls and rendered charts."""
import json
from pathlib import Path
import subprocess
import sys

origin = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8948'
slug = 'loan-rate-order-declining-principal-average-interest-cost'
qa = Path(__file__).resolve().parents[1] / 'qa'


def browser(*args):
    return subprocess.check_output(['agent-browser', '--session', 'tickerlantern-funding-boundaries', *map(str, args)], text=True, timeout=45).strip()


def value(script):
    return json.loads(browser('eval', script))


def check(label, condition):
    print(('PASS: ' if condition else 'FAIL: ') + label, flush=True)
    assert condition, label


browser('open', origin + '/research/' + slug + ('.html' if origin.startswith('http://127.') else ''))
browser('set', 'viewport', '1440', '1000')
browser('wait', '.planning-results svg')
metric = lambda: value('document.querySelector(".planning-metrics").textContent')
initial = metric()
check('five accessible charts and complete data tables', value('document.querySelectorAll("svg[role=img]").length===5 && document.querySelectorAll(".plot-data table").length===5'))
check('default interest totals and rate-order difference reconcile', '$5,280' in initial and '$4,320' in initial and '$960' in initial)
browser('fill', '#planning-rateBlockA', '6')
browser('wait', '200')
changed = metric()
check('equal rate blocks remove the ordering difference', changed != initial and changed.count('$3,600')==2 and '$0' in changed)
browser('fill', '#planning-rateBlockA', '-1')
browser('wait', '200')
check('negative interest rate rejected without replacing valid results', value('!document.querySelector(".planning-error").hidden') and metric() == changed)
browser('eval', 'document.querySelector(".planning-reset").scrollIntoView({block:"center"});true')
browser('click', '.planning-reset')
browser('wait', '200')
check('reset restores the checked default', metric() == initial and value('document.querySelector(".planning-error").hidden'))
browser('eval', 'document.querySelector("#loan-rate-order-interest-bridge .plot-data summary").scrollIntoView({block:"center"});true')
browser('click', '#loan-rate-order-interest-bridge .plot-data summary')
check('yearly positive and negative interest differences accessible in table', value('document.querySelector("#loan-rate-order-interest-bridge details").open && document.querySelector("#loan-rate-order-interest-bridge table").textContent.includes("$960") && document.querySelector("#loan-rate-order-interest-bridge table").textContent.includes("-$480")'))
browser('eval', 'document.querySelector("#loan-rate-order-interest-bridge").scrollIntoView();true')
browser('screenshot', str(qa / 'loan-rate-order-desktop.png'))
for width in [390, 320]:
    browser('set', 'viewport', width, '844')
    browser('wait', '200')
    check(f'no page or chart overflow at {width}', value('document.documentElement.scrollWidth<=innerWidth+1 && Array.from(document.querySelectorAll(".plot-drawing svg")).every(e=>e.getBoundingClientRect().left>=0 && e.getBoundingClientRect().right<=innerWidth+1)'))
    check(f'chart text remains inside every viewBox at {width}', value('Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>Array.from(svg.querySelectorAll("text")).every(t=>{const b=t.getBBox();return b.x>=-1 && b.x+b.width<=svg.viewBox.baseVal.width+1}))'))
    if width == 390:
        browser('eval', 'document.querySelector("#loan-rate-order-interest-bridge").scrollIntoView();true')
        browser('screenshot', str(qa / 'loan-rate-order-mobile.png'))
        browser('eval', 'document.querySelector("#loan-rate-order-principal-path").scrollIntoView();true')
        browser('screenshot', str(qa / 'loan-rate-order-principal-mobile.png'))
errors = browser('errors')
check('no uncaught browser errors', not errors or errors in ['[]', 'No page errors'])
browser('open', origin + '/research/')
check('research library links article', value('Array.from(document.querySelectorAll("a")).some(a=>a.pathname==="/research/'+slug+'")'))
print('Browser verification complete.', flush=True)
