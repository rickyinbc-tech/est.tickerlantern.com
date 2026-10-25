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


pages = [('employee-stock-options-vesting-exercise-cash-spread', 'optionServiceMonths', '12', 'optionGrant')]
for slug, key, replacement, whole in pages:
    browser('set', 'viewport', '1440', '1000')
    suffix = '.html' if ORIGIN.startswith('http://127.0.0.1') else ''
    browser('open', ORIGIN + '/research/' + slug + suffix)
    browser('wait', '.planning-results svg')
    settle()
    check(slug + ': four accessible graphics and four data tables', value('document.querySelectorAll(".planning-results svg[role=img]").length===4 && document.querySelectorAll(".plot-data table").length===4'))
    check(slug + ': English article, six full explanation sections and canonical URL', value('document.documentElement.lang==="en" && document.querySelectorAll(".guide-prose>section:not(.guide-sources):not(.guide-related)").length===6 && document.querySelector("link[rel=canonical]").href===' + json.dumps('https://tickerlantern.com/research/' + slug)))
    check(slug + ': count and CAD chart units are explicit', value('document.querySelector("#employee-option-vesting-milestones .plot-unit").textContent.includes("Option units") && document.querySelector("#employee-option-intrinsic-price .plot-unit").textContent.includes("CAD")'))
    check(slug + ': source-independent convention is visible', value('document.querySelector(".planning-explorer-heading").textContent.includes("48-month") && document.querySelector(".planning-assumptions").textContent.includes("Original CAD illustration")'))
    check(slug + ': sale proceeds, strike funding and gap stay distinct', value('document.querySelector("#employee-option-sale-reconciliation table").textContent.includes("$27,000") && document.querySelector("#employee-option-hold-funding table").textContent.includes("$22,500") && document.querySelector("#employee-option-hold-funding table").textContent.includes("$17,500")'))
    original = metric()
    browser('fill', '#planning-' + key, replacement)
    settle()
    changed = metric()
    check(slug + ': changing a real input updates the result', changed != original)
    check(slug + ': month twelve cliff has 300 vested units', value('document.querySelector(".planning-metrics strong").textContent==="300"'))
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
    browser('fill', '#planning-optionServiceMonths', '11')
    settle()
    check(slug + ': before the cliff no sale is modeled', value('document.querySelector(".planning-metrics strong").textContent==="0" && Array.from(document.querySelectorAll("#employee-option-sale-reconciliation table td")).filter(e=>e.textContent!=="—").every(e=>e.textContent==="$0")'))
    browser('click', '.planning-reset')
    browser('fill', '#planning-optionSharePrice', '40')
    settle()
    check(slug + ': underwater options do not create a negative exercise-and-sale transaction', value('document.querySelectorAll(".planning-metrics strong")[1].textContent==="$0" && document.querySelectorAll(".planning-metrics strong")[2].textContent==="$17,500" && Array.from(document.querySelectorAll("#employee-option-sale-reconciliation table td")).filter(e=>e.textContent!=="—").every(e=>e.textContent==="$0")'))
    browser('click', '.planning-reset')
    browser('fill', '#planning-optionExerciseCash', '22500')
    settle()
    check(slug + ': entered strike funding removes only the hold cash gap', value('document.querySelectorAll(".planning-metrics strong")[1].textContent==="$4,500" && document.querySelectorAll(".planning-metrics strong")[2].textContent==="$0"'))
    browser('fill', '#planning-optionGrant', '50000')
    browser('fill', '#planning-optionServiceMonths', '48')
    browser('fill', '#planning-optionStrike', '500')
    browser('fill', '#planning-optionSharePrice', '1000')
    settle()
    check(slug + ': large permitted inputs still fit at 320px', value('document.documentElement.scrollWidth <= innerWidth+1 && Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>{const b=svg.getBoundingClientRect();return Array.from(svg.querySelectorAll("text")).every(t=>{const r=t.getBoundingClientRect();return r.left>=b.left-1 && r.right<=b.right+1;});})'))
    browser('click', '.planning-reset')
    browser('fill', '#planning-optionGrant', '0')
    settle()
    check(slug + ': zero grant renders finite graphics', value('Array.from(document.querySelectorAll(".planning-results svg")).length===4 && !/NaN|Infinity|undefined/.test(document.querySelector(".planning-results").innerHTML)'))
    browser('click', '.planning-reset')
    settle()
    errors = browser('errors')
    check(slug + ': no uncaught browser errors', not errors or errors in ['[]', 'No page errors'])

browser('set', 'viewport', '1440', '1000')
browser('open', ORIGIN + '/research/')
check('library links the new topic', value('Array.from(document.querySelectorAll(".planning-topic h3 a")).filter(a=>' + json.dumps([row[0] for row in pages]) + '.some(s=>a.pathname.endsWith(s))).length===1'))
print('Browser verification complete.', flush=True)
