"""Verify the published planning labs through real browser inputs and responsive layouts."""
import json
import subprocess
import sys
from pathlib import Path

ORIGIN = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8876'
SESSION = 'tickerlantern-funding-boundaries'
ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'qa'
QA.mkdir(exist_ok=True)


def browser(*args):
    return subprocess.check_output(['agent-browser', '--session', SESSION, *map(str, args)], text=True, timeout=45).strip()


def value(script):
    return json.loads(browser('eval', script))


def check(label, condition):
    print(('PASS: ' if condition else 'FAIL: ') + label, flush=True)
    assert condition, label


def settle():
    browser('wait', '200')


def metric():
    return value('document.querySelector(".planning-metrics").textContent')


pages = [
    ('rising-goal-price-monthly-saving-shortfall', 'monthly', '1000', 'years'),
    ('one-cash-balance-multiple-earmarks-double-counting', 'monthly', '1000', 'taxDue'),
    ('leveraged-loss-asset-drop-own-capital', 'loan', '50000', 'years'),
]
for slug, key, replacement, whole in pages:
    browser('set', 'viewport', '1440', '1000')
    suffix = '.html' if ORIGIN.startswith('http://127.0.0.1') else ''
    browser('open', ORIGIN + '/research/' + slug + suffix)
    browser('wait', '.planning-results svg')
    settle()
    check(slug + ': four accessible graphics and four data tables', value('document.querySelectorAll(".planning-results svg[role=img]").length===4 && document.querySelectorAll(".plot-data table").length===4'))
    check(slug + ': English article, six full explanation sections and canonical URL', value('document.documentElement.lang==="en" && document.querySelectorAll(".guide-prose>section:not(.guide-sources):not(.guide-related)").length===6 && document.querySelector("link[rel=canonical]").href===' + json.dumps('https://tickerlantern.com/research/' + slug)))
    original = metric()
    browser('fill', '#planning-' + key, replacement)
    settle()
    changed = metric()
    check(slug + ': changing a real input updates the result', changed != original)
    if slug.startswith('job-loss'):
        browser('fill', '#planning-settlementMonth', '6')
        settle()
        check('late settlement identifies month-one gap and CAD 4,600 extra cash', '$4,600' in metric() and 'Month 1' in metric())
        changed = metric()
    if whole:
        browser('fill', '#planning-' + whole, '2.5')
        settle()
        check(slug + ': fractional month/year rejected without replacing valid results', value('!document.querySelector(".planning-error").hidden') and metric() == changed)
    else:
        browser('fill', '#planning-monthly', '-1')
        settle()
        check(slug + ': out-of-range input preserves the valid scenario', value('!document.querySelector(".planning-error").hidden') and metric() == changed)
    browser('click', '.planning-reset')
    settle()
    check(slug + ': reset restores the original scenario', metric() == original and value('document.querySelector(".planning-error").hidden'))
    browser('click', '.plot-data summary')
    check(slug + ': chart data can be opened', value('document.querySelector(".plot-data").open && document.querySelector(".plot-data tbody tr").getBoundingClientRect().height>0'))
    browser('eval', 'document.querySelector(".planning-figure").scrollIntoView();true')
    browser('screenshot', str(QA / (slug + '-desktop.png')))
    for width in [390, 320]:
        browser('set', 'viewport', str(width), '844')
        settle()
        check(slug + ': no page overflow at ' + str(width), value('document.documentElement.scrollWidth <= innerWidth+1'))
        check(slug + ': mobile charts stay within their containers', value('Array.from(document.querySelectorAll(".plot-drawing svg")).every(e=>e.getBoundingClientRect().right <= innerWidth+1 && e.getBoundingClientRect().left>=0)'))
        if width == 390:
            browser('eval', 'document.querySelector(".planning-figure").scrollIntoView();true')
            browser('screenshot', str(QA / (slug + '-mobile.png')))
    errors = browser('errors')
    check(slug + ': no uncaught browser errors', not errors or errors in ['[]', 'No page errors'])

browser('set', 'viewport', '1440', '1000')
browser('open', ORIGIN + '/research/')
check('library links all three new topics', value('Array.from(document.querySelectorAll(".planning-topic h3 a")).filter(a=>' + json.dumps([row[0] for row in pages]) + '.some(s=>a.pathname.endsWith(s))).length===3'))
print('Browser verification complete.', flush=True)
