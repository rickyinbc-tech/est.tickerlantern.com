"""Verify the published planning labs through real browser inputs and responsive layouts."""
import json
import subprocess
import sys
from pathlib import Path

ORIGIN = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8876'
SESSION = 'tickerlantern-content'
ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'qa'
QA.mkdir(exist_ok=True)


def browser(*args):
    return subprocess.check_output(['agent-browser', '--session', SESSION, *map(str, args)], text=True).strip()


def value(script):
    return json.loads(browser('eval', script))


def check(label, condition):
    print(('PASS: ' if condition else 'FAIL: ') + label, flush=True)
    assert condition, label


def settle():
    browser('eval', '(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return true})()')


def metric():
    return value('document.querySelector(".planning-metrics").textContent')


pages = [('inflation-linked-bond-principal-coupon-maturity-cash', 'indexedInflation', '-4', 'indexedYears')]
for slug, key, replacement, whole in pages:
    browser('set', 'viewport', '1440', '1000')
    suffix = '.html' if ORIGIN.startswith('http://127.0.0.1') else ''
    browser('open', ORIGIN + '/research/' + slug + suffix)
    browser('wait', '.planning-results svg')
    settle()
    check(slug + ': four accessible graphics and four data tables', value('document.querySelectorAll(".planning-results svg[role=img]").length===4 && document.querySelectorAll(".plot-data table").length===4'))
    check(slug + ': English article, six full explanation sections and canonical URL', value('document.documentElement.lang==="en" && document.querySelectorAll(".guide-prose>section:not(.guide-sources):not(.guide-related)").length===6 && document.querySelector("link[rel=canonical]").href===' + json.dumps('https://tickerlantern.com/research/' + slug)))
    check(slug + ': all figure captions identify USD', value('Array.from(document.querySelectorAll(".planning-figure figcaption .plot-unit")).every(e=>e.textContent.includes("US dollars (USD)"))'))
    check(slug + ': accessible line and bar descriptions use USD', value('Array.from(document.querySelectorAll(".planning-results svg desc")).filter(e=>e.textContent.includes("CAD")).length===0'))
    check(slug + ': purchase outlay is separate from original face', value('document.querySelector("#indexed-bond-cash-reconciliation table").textContent.includes("-$10,500") && document.querySelector("#indexed-bond-floor-purchase-matrix table").textContent.includes("-$500")'))
    original = metric()
    browser('fill', '#planning-' + key, replacement)
    settle()
    changed = metric()
    check(slug + ': changing a real input updates the result', changed != original)
    check(slug + ': deflation keeps principal-only floor separate from coupon cash', value('document.querySelector(".planning-metrics").textContent.includes("$10,000") && document.querySelector(".planning-metrics").textContent.includes("-$500") && document.querySelector("#indexed-bond-principal-path table").textContent.includes("$8,153.73")'))
    if whole:
        browser('fill', '#planning-' + whole, '1.5')
        settle()
        check(slug + ': fractional month/year rejected without replacing valid results', value('!document.querySelector(".planning-error").hidden') and metric() == changed)
    else:
        browser('fill', '#planning-' + key, '-999')
        settle()
        check(slug + ': out-of-range input preserves the valid scenario', value('!document.querySelector(".planning-error").hidden') and metric() == changed)
    browser('click', '.planning-reset')
    settle()
    check(slug + ': reset restores the original scenario', metric() == original and value('document.querySelector(".planning-error").hidden'))
    browser('click', '.plot-data summary')
    check(slug + ': chart data can be opened', value('document.querySelector(".plot-data").open && document.querySelector(".plot-data tbody tr").getBoundingClientRect().height>0'))
    browser('eval', 'document.querySelector(".planning-figure").scrollIntoView({block:"start",behavior:"instant"});true')
    browser('screenshot', str(QA / (slug + '-desktop.png')))
    for width in [390, 320]:
        browser('set', 'viewport', str(width), '844')
        settle()
        check(slug + ': no page overflow at ' + str(width), value('document.documentElement.scrollWidth <= innerWidth+1'))
        check(slug + ': mobile charts stay within their containers', value('Array.from(document.querySelectorAll(".plot-drawing svg")).every(e=>e.getBoundingClientRect().right <= innerWidth+1 && e.getBoundingClientRect().left>=0)'))
        check(slug + ': SVG text stays inside each chart at ' + str(width), value('Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>{const b=svg.getBoundingClientRect();return Array.from(svg.querySelectorAll("text")).every(t=>{const r=t.getBoundingClientRect();return r.left>=b.left-1 && r.right<=b.right+1;});})'))
        if width == 390:
            browser('eval', 'document.querySelector(".planning-figure").scrollIntoView({block:"start",behavior:"instant"});true')
            browser('screenshot', str(QA / (slug + '-mobile.png')))
    browser('fill', '#planning-indexedFace', '1000000')
    browser('fill', '#planning-indexedInflation', '10')
    browser('fill', '#planning-indexedYears', '10')
    browser('fill', '#planning-indexedCostPct', '130')
    settle()
    check(slug + ': large permitted inputs still fit at 320px', value('document.documentElement.scrollWidth <= innerWidth+1 && Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>{const b=svg.getBoundingClientRect();return Array.from(svg.querySelectorAll("text")).every(t=>{const r=t.getBoundingClientRect();return r.left>=b.left-1 && r.right<=b.right+1;});})'))
    browser('click', '.planning-reset')
    settle()
    errors = browser('errors')
    check(slug + ': no uncaught browser errors', not errors or errors in ['[]', 'No page errors'])

browser('set', 'viewport', '1440', '1000')
browser('open', ORIGIN + '/research/')
check('library links the new topic', value('Array.from(document.querySelectorAll(".planning-topic h3 a")).filter(a=>' + json.dumps([row[0] for row in pages]) + '.some(s=>a.pathname.endsWith(s))).length===1'))
print('Browser verification complete.', flush=True)
