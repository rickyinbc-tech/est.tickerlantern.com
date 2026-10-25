"""Exercise the payment-date article using real DOM controls and rendered charts."""
import json
from pathlib import Path
import subprocess
import sys

origin = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8948'
slug = 'cash-now-future-payments-present-value-receipt-calendar'
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
check('default present value matches independent calculation', '$51,953.72' in initial)
browser('fill', '#planning-firstPaymentYear', '3')
browser('wait', '200')
changed = metric()
check('changing first receipt date updates value without changing nominal total', changed != initial and '$47,123.56' in changed and '$60,000' in changed)
browser('fill', '#planning-paymentCount', '3.5')
browser('wait', '200')
check('fractional payment count rejected without replacing valid results', value('!document.querySelector(".planning-error").hidden') and metric() == changed)
browser('eval', 'document.querySelector(".planning-reset").scrollIntoView({block:"center"});true')
browser('click', '.planning-reset')
browser('wait', '200')
check('reset restores the checked default', metric() == initial and value('document.querySelector(".planning-error").hidden'))
browser('eval', 'document.querySelector("#payment-value-discounted-bridge .plot-data summary").scrollIntoView({block:"center"});true')
browser('click', '#payment-value-discounted-bridge .plot-data summary')
check('discounted receipts and signed difference accessible in table', value('document.querySelector("#payment-value-discounted-bridge details").open && document.querySelector("#payment-value-discounted-bridge table").textContent.includes("$11,428.57") && document.querySelector("#payment-value-discounted-bridge table").textContent.includes("$1,953.72")'))
browser('eval', 'document.querySelector("#payment-value-discounted-bridge").scrollIntoView();true')
browser('screenshot', str(qa / 'payment-value-desktop.png'))
for width in [390, 320]:
    browser('set', 'viewport', width, '844')
    browser('wait', '200')
    check(f'no page or chart overflow at {width}', value('document.documentElement.scrollWidth<=innerWidth+1 && Array.from(document.querySelectorAll(".plot-drawing svg")).every(e=>e.getBoundingClientRect().left>=0 && e.getBoundingClientRect().right<=innerWidth+1)'))
    check(f'chart text remains inside every viewBox at {width}', value('Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>Array.from(svg.querySelectorAll("text")).every(t=>{const b=t.getBBox();return b.x>=-1 && b.x+b.width<=svg.viewBox.baseVal.width+1}))'))
    if width == 390:
        browser('eval', 'document.querySelector("#payment-value-discounted-bridge").scrollIntoView();true')
        browser('screenshot', str(qa / 'payment-value-mobile.png'))
        browser('eval', 'document.querySelector("#payment-value-cash-dates").scrollIntoView();true')
        browser('screenshot', str(qa / 'payment-value-timeline-mobile.png'))
errors = browser('errors')
check('no uncaught browser errors', not errors or errors in ['[]', 'No page errors'])
browser('open', origin + '/research/')
check('research library links article', value('Array.from(document.querySelectorAll("a")).some(a=>a.pathname==="/research/'+slug+'")'))
print('Browser verification complete.', flush=True)
