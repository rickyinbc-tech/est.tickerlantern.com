"""Exercise the project-draw article using real DOM controls and rendered charts."""
import json
from pathlib import Path
import subprocess
import sys

origin = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8948'
slug = 'project-loan-staged-draws-idle-borrowed-cash-interest'
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
check('four accessible charts and complete data tables', value('document.querySelectorAll("svg[role=img]").length===4 && document.querySelectorAll(".plot-data table").length===4'))
check('default net carrying costs reconcile', '$4,350' in initial and '$2,950' in initial and '-$1,400' in initial)
browser('fill', '#planning-drawSpacing', '4')
browser('wait', '200')
changed = metric()
check('later project bills update the carrying costs', changed != initial and '$2,150' in changed and '-$2,000' in changed)
browser('fill', '#planning-drawSpacing', '2.5')
browser('wait', '200')
check('fractional bill spacing rejected without replacing valid results', value('!document.querySelector(".planning-error").hidden') and metric() == changed)
browser('eval', 'document.querySelector(".planning-reset").scrollIntoView({block:"center"});true')
browser('click', '.planning-reset')
browser('wait', '200')
check('reset restores the checked default', metric() == initial and value('document.querySelector(".planning-error").hidden'))
browser('eval', 'document.querySelector("#staged-draw-cost-reconciliation .plot-data summary").scrollIntoView({block:"center"});true')
browser('click', '#staged-draw-cost-reconciliation .plot-data summary')
check('interest components and signed cost difference accessible in table', value('document.querySelector("#staged-draw-cost-reconciliation details").open && document.querySelector("#staged-draw-cost-reconciliation table").textContent.includes("$2,800") && document.querySelector("#staged-draw-cost-reconciliation table").textContent.includes("-$1,400")'))
browser('eval', 'document.querySelector("#staged-draw-cost-reconciliation").scrollIntoView();true')
browser('screenshot', str(qa / 'staged-draw-desktop.png'))
for width in [390, 320]:
    browser('set', 'viewport', width, '844')
    browser('wait', '200')
    check(f'no page or chart overflow at {width}', value('document.documentElement.scrollWidth<=innerWidth+1 && Array.from(document.querySelectorAll(".plot-drawing svg")).every(e=>e.getBoundingClientRect().left>=0 && e.getBoundingClientRect().right<=innerWidth+1)'))
    check(f'chart text remains inside every viewBox at {width}', value('Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>Array.from(svg.querySelectorAll("text")).every(t=>{const b=t.getBBox();return b.x>=-1 && b.x+b.width<=svg.viewBox.baseVal.width+1}))'))
    if width == 390:
        browser('eval', 'document.querySelector("#staged-draw-cost-reconciliation").scrollIntoView();true')
        browser('screenshot', str(qa / 'staged-draw-mobile.png'))
        browser('eval', 'document.querySelector("#staged-draw-cash-limit").scrollIntoView();true')
        browser('screenshot', str(qa / 'staged-draw-cash-mobile.png'))
errors = browser('errors')
check('no uncaught browser errors', not errors or errors in ['[]', 'No page errors'])
browser('open', origin + '/research/')
check('research library links article', value('Array.from(document.querySelectorAll("a")).some(a=>a.pathname==="/research/'+slug+'")'))
print('Browser verification complete.', flush=True)
