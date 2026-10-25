"""Exercise the gift-credit article using real DOM controls and rendered charts."""
import json
from pathlib import Path
import subprocess
import sys

origin = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8948'
slug = 'gift-card-bonus-redemption-cash-price-comparison'
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
check('partial use preserves credit and distinguishes cash already committed', '$88' in initial and '$22' in initial and '$16.4' in initial)
browser('fill', '#planning-giftUse', '100')
browser('wait', '200')
changed = metric()
check('full use removes residual credit and changes the cash comparison', changed != initial and '$110' in changed and '-$4.5' in changed and '$0' in changed)
browser('fill', '#planning-giftMonths', '1.5')
browser('wait', '200')
check('fractional redemption horizon rejected without replacing valid results', value('!document.querySelector(".planning-error").hidden') and metric() == changed)
browser('eval', 'document.querySelector(".planning-reset").scrollIntoView({block:"center"});true')
browser('click', '.planning-reset')
browser('wait', '200')
check('reset restores the checked default', metric() == initial and value('document.querySelector(".planning-error").hidden'))
browser('eval', 'document.querySelector("#gift-credit-balance-ledger .plot-data summary").scrollIntoView({block:"center"});true')
browser('click', '#gift-credit-balance-ledger .plot-data summary')
check('paid credit bonus redemption and remaining balance accessible in table', value('document.querySelector("#gift-credit-balance-ledger details").open && document.querySelector("#gift-credit-balance-ledger table").textContent.includes("$110") && document.querySelector("#gift-credit-balance-ledger table").textContent.includes("-$88")'))
browser('eval', 'document.querySelector("#gift-credit-balance-ledger").scrollIntoView();true')
browser('screenshot', str(qa / 'gift-credit-desktop.png'))
for width in [390, 320]:
    browser('set', 'viewport', width, '844')
    browser('wait', '200')
    check(f'no page or chart overflow at {width}', value('document.documentElement.scrollWidth<=innerWidth+1 && Array.from(document.querySelectorAll(".plot-drawing svg")).every(e=>e.getBoundingClientRect().left>=0 && e.getBoundingClientRect().right<=innerWidth+1)'))
    check(f'chart text remains inside every viewBox at {width}', value('Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>Array.from(svg.querySelectorAll("text")).every(t=>{const b=t.getBBox();return b.x>=-1 && b.x+b.width<=svg.viewBox.baseVal.width+1}))'))
    check(f'small negative and zero-axis labels remain separate at {width}', value('(()=>{const svg=document.querySelector("#gift-credit-use-cash-comparison svg"),h=svg.viewBox.baseVal.height;const b=Array.from(svg.querySelectorAll("text")).filter(t=>+t.getAttribute("y")>h-25).map(t=>t.getBBox()).sort((a,b)=>a.x-b.x);return b.every((x,i)=>!i||b[i-1].x+b[i-1].width+2<=x.x)})()'))
    if width == 390:
        browser('eval', 'document.querySelector("#gift-credit-balance-ledger").scrollIntoView();true')
        browser('screenshot', str(qa / 'gift-credit-mobile.png'))
        browser('eval', 'document.querySelector("#gift-credit-cash-calendar").scrollIntoView();true')
        browser('screenshot', str(qa / 'gift-credit-cash-mobile.png'))
errors = browser('errors')
check('no uncaught browser errors', not errors or errors in ['[]', 'No page errors'])
browser('open', origin + '/research/')
check('research library links article', value('Array.from(document.querySelectorAll("a")).some(a=>a.pathname==="/research/'+slug+'")'))
print('Browser verification complete.', flush=True)
