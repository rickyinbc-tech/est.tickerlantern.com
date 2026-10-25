"""Exercise the collateral-ratio article using real DOM controls and rendered charts."""
import json
from pathlib import Path
import subprocess
import sys

origin = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8948'
slug = 'collateral-equity-ratio-cash-loan-repayment-asset-sale'
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
check('three default adjustment amounts reconcile', '$4,800' in initial and '$8,000' in initial and '$12,000' in initial)
browser('fill', '#planning-priceMove', '-60')
browser('wait', '200')
changed = metric()
check('negative equity removes the sale-only repair', changed != initial and 'No sale-only repair' in changed and '$15,600' in changed)
browser('fill', '#planning-initialAssets', '0')
browser('wait', '200')
check('out-of-range initial asset value rejected without replacing valid results', value('!document.querySelector(".planning-error").hidden') and metric() == changed)
browser('eval', 'document.querySelector(".planning-reset").scrollIntoView({block:"center"});true')
browser('click', '.planning-reset')
browser('wait', '200')
check('reset restores the checked default', metric() == initial and value('document.querySelector(".planning-error").hidden'))
browser('eval', 'document.querySelector("#collateral-repair-resource-amounts .plot-data summary").scrollIntoView({block:"center"});true')
browser('click', '#collateral-repair-resource-amounts .plot-data summary')
check('cash and asset-sale requirements accessible in table', value('document.querySelector("#collateral-repair-resource-amounts details").open && document.querySelector("#collateral-repair-resource-amounts table").textContent.includes("$4,800") && document.querySelector("#collateral-repair-resource-amounts table").textContent.includes("$12,000")'))
browser('eval', 'document.querySelector("#collateral-repair-resource-amounts").scrollIntoView();true')
browser('screenshot', str(qa / 'collateral-repair-desktop.png'))
for width in [390, 320]:
    browser('set', 'viewport', width, '844')
    browser('wait', '200')
    check(f'no page or chart overflow at {width}', value('document.documentElement.scrollWidth<=innerWidth+1 && Array.from(document.querySelectorAll(".plot-drawing svg")).every(e=>e.getBoundingClientRect().left>=0 && e.getBoundingClientRect().right<=innerWidth+1)'))
    check(f'chart text remains inside every viewBox at {width}', value('Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>Array.from(svg.querySelectorAll("text")).every(t=>{const b=t.getBBox();return b.x>=-1 && b.x+b.width<=svg.viewBox.baseVal.width+1}))'))
    if width == 390:
        browser('eval', 'document.querySelector("#collateral-repair-resource-amounts").scrollIntoView();true')
        browser('screenshot', str(qa / 'collateral-repair-mobile.png'))
        browser('eval', 'document.querySelector("#collateral-repair-new-money-equity").scrollIntoView();true')
        browser('screenshot', str(qa / 'collateral-repair-equity-mobile.png'))
errors = browser('errors')
check('no uncaught browser errors', not errors or errors in ['[]', 'No page errors'])
browser('open', origin + '/research/')
check('research library links article', value('Array.from(document.querySelectorAll("a")).some(a=>a.pathname==="/research/'+slug+'")'))
print('Browser verification complete.', flush=True)
