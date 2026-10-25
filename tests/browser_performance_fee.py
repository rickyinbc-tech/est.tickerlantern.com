"""Exercise the performance-fee article using real DOM controls and rendered charts."""
import json
from pathlib import Path
import subprocess
import sys

origin = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8948'
slug = 'performance-fee-high-water-mark-loss-recovery-cash'
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
check('default fee paths and ending difference reconcile', '$111,974.4' in initial and '$116,640' in initial and '$4,665.6' in initial)
browser('fill', '#planning-performanceRate', '0')
browser('wait', '200')
changed = metric()
check('zero performance fee equalizes the two account paths', changed != initial and changed.count('$121,000')==2 and '$0' in changed)
browser('fill', '#planning-performanceRate', '-1')
browser('wait', '200')
check('negative fee percentage rejected without replacing valid results', value('!document.querySelector(".planning-error").hidden') and metric() == changed)
browser('eval', 'document.querySelector(".planning-reset").scrollIntoView({block:"center"});true')
browser('click', '.planning-reset')
browser('wait', '200')
check('reset restores the checked default', metric() == initial and value('document.querySelector(".planning-error").hidden'))
browser('eval', 'document.querySelector("#performance-fee-charges-by-year .plot-data summary").scrollIntoView({block:"center"});true')
browser('click', '#performance-fee-charges-by-year .plot-data summary')
check('annual-reset recovery fee and later mark fee accessible in table', value('document.querySelector("#performance-fee-charges-by-year details").open && document.querySelector("#performance-fee-charges-by-year table").textContent.includes("$4,000") && document.querySelector("#performance-fee-charges-by-year table").textContent.includes("$2,160")'))
browser('eval', 'document.querySelector("#performance-fee-charges-by-year").scrollIntoView();true')
browser('screenshot', str(qa / 'performance-fee-desktop.png'))
for width in [390, 320]:
    browser('set', 'viewport', width, '844')
    browser('wait', '200')
    check(f'no page or chart overflow at {width}', value('document.documentElement.scrollWidth<=innerWidth+1 && Array.from(document.querySelectorAll(".plot-drawing svg")).every(e=>e.getBoundingClientRect().left>=0 && e.getBoundingClientRect().right<=innerWidth+1)'))
    check(f'chart text remains inside every viewBox at {width}', value('Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>Array.from(svg.querySelectorAll("text")).every(t=>{const b=t.getBBox();return b.x>=-1 && b.x+b.width<=svg.viewBox.baseVal.width+1}))'))
    if width == 390:
        browser('eval', 'document.querySelector("#performance-fee-charges-by-year").scrollIntoView();true')
        browser('screenshot', str(qa / 'performance-fee-mobile.png'))
        browser('eval', 'document.querySelector("#performance-fee-cost-return-bridge").scrollIntoView();true')
        browser('screenshot', str(qa / 'performance-fee-bridge-mobile.png'))
errors = browser('errors')
check('no uncaught browser errors', not errors or errors in ['[]', 'No page errors'])
browser('open', origin + '/research/')
check('research library links article', value('Array.from(document.querySelectorAll("a")).some(a=>a.pathname==="/research/'+slug+'")'))
print('Browser verification complete.', flush=True)
