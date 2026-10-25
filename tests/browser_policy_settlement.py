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


pages = [('life-insurance-surrender-death-quote-policy-loan', 'policyLoanBalance', '30000', None)]
for slug, key, replacement, whole in pages:
    browser('set', 'viewport', '1440', '1000')
    suffix = '.html' if ORIGIN.startswith('http://127.0.0.1') else ''
    browser('open', ORIGIN + '/research/' + slug + suffix)
    browser('wait', '.planning-results svg')
    settle()
    check(slug + ': four accessible graphics and four data tables', value('document.querySelectorAll(".planning-results svg[role=img]").length===4 && document.querySelectorAll(".plot-data table").length===4'))
    check(slug + ': English article, six full explanation sections and canonical URL', value('document.documentElement.lang==="en" && document.querySelectorAll(".guide-prose>section:not(.guide-sources):not(.guide-related)").length===6 && document.querySelector("link[rel=canonical]").href===' + json.dumps('https://tickerlantern.com/research/' + slug)))
    check(slug + ': all four charts label hypothetical before-tax amounts', value('Array.from(document.querySelectorAll(".planning-evidence")).every(e=>e.textContent==="Hypothetical scenario") && Array.from(document.querySelectorAll(".plot-data caption")).every(e=>e.textContent.includes("CAD, before tax"))'))
    check(slug + ': surrender and conditional death amounts stay separate', value('Array.from(document.querySelectorAll(".planning-metrics strong")).map(e=>e.textContent).join("|")==="$30,000|$380,000|$20,000"'))
    check(slug + ': surrender waterfall debits the loan only once', value('document.querySelector("#policy-settlement-surrender-bridge table").textContent.includes("$50,000") && document.querySelector("#policy-settlement-surrender-bridge table").textContent.includes("-$20,000") && document.querySelector("#policy-settlement-surrender-bridge table").textContent.includes("$30,000")'))
    original = metric()
    browser('fill', '#planning-' + key, replacement)
    settle()
    changed = metric()
    check(slug + ': changing a real input updates the result', changed != original)
    check(slug + ': a larger existing debit reduces both alternative amounts', value('Array.from(document.querySelectorAll(".planning-metrics strong")).map(e=>e.textContent).join("|")==="$20,000|$370,000|$30,000"'))
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
    browser('fill', '#planning-policyLoanBalance', '60000')
    settle()
    check(slug + ': unsupported loan/quote combination gives a clear accessible error', value('!document.querySelector(".planning-error").hidden && document.querySelector(".planning-error").textContent.includes("outstanding loan must not exceed") && document.querySelector("#planning-policyLoanBalance").getAttribute("aria-invalid")==="true" && document.querySelector("#planning-policySurrenderQuote").getAttribute("aria-invalid")==="true"') and metric() == original)
    browser('fill', '#planning-policyLoanBalance', '10000')
    settle()
    check(slug + ': correcting the combination clears the error and updates amounts', value('document.querySelector(".planning-error").hidden && Array.from(document.querySelectorAll(".planning-controls input")).every(e=>e.getAttribute("aria-invalid")==="false") && document.querySelector(".planning-metrics strong").textContent==="$40,000"'))
    accepted = metric()
    browser('fill', '#planning-policySurrenderQuote', '500000')
    settle()
    check(slug + ': surrender above total death quote is rejected without clamping', value('!document.querySelector(".planning-error").hidden && document.querySelector(".planning-error").textContent.includes("surrender quote must not exceed") && document.querySelector("#planning-policySurrenderQuote").getAttribute("aria-invalid")==="true" && document.querySelector("#planning-policyDeathQuote").getAttribute("aria-invalid")==="true"') and metric() == accepted)
    browser('fill', '#planning-policyDeathQuote', '600000')
    settle()
    check(slug + ': repairing the death quote accepts the entered combination', value('document.querySelector(".planning-error").hidden && document.querySelector(".planning-metrics strong").textContent==="$490,000"'))
    browser('click', '.planning-reset')
    browser('fill', '#planning-policyLoanBalance', '5000')
    browser('fill', '#planning-policySurrenderQuote', '10000')
    browser('fill', '#planning-policyDeathQuote', '40000')
    settle()
    check(slug + ': unsupported matrix alternatives show N/A', value('document.querySelector("#policy-settlement-quote-matrix table").textContent.includes("N/A")'))
    browser('fill', '#planning-policyDeathQuote', '2000000')
    browser('fill', '#planning-policySurrenderQuote', '1000000')
    browser('fill', '#planning-policyLoanBalance', '1000000')
    settle()
    check(slug + ': largest supported snapshot fits at 320px', value('document.documentElement.scrollWidth<=innerWidth+1 && Array.from(document.querySelectorAll(".plot-drawing svg")).every(svg=>{const b=svg.getBoundingClientRect();return Array.from(svg.querySelectorAll("text")).every(t=>{const r=t.getBoundingClientRect();return r.left>=b.left-1 && r.right<=b.right+1;});})'))
    browser('fill', '#planning-policyLoanBalance', '0')
    browser('fill', '#planning-policySurrenderQuote', '0')
    browser('fill', '#planning-policyDeathQuote', '0')
    settle()
    check(slug + ': zero quotes and unavailable matrix cells remain finite', value('document.querySelectorAll(".planning-results svg").length===4 && !/NaN|Infinity|undefined/.test(document.querySelector(".planning-results").innerHTML)'))
    browser('click', '.planning-reset')
    settle()
    errors = browser('errors')
    check(slug + ': no uncaught browser errors', not errors or errors in ['[]', 'No page errors'])

browser('open', ORIGIN + '/research/disability-benefit-offset-retroactive-award-repayment-cash' + ('.html' if ORIGIN.startswith('http://127.0.0.1') else ''))
browser('wait', '.planning-results svg')
settle()
browser('fill', '#planning-coordOffsetPercent', '50')
settle()
check('existing disability lab still updates without a custom validator', value('document.querySelector(".planning-metrics strong").textContent==="$4,600"'))
accepted = metric()
browser('fill', '#planning-coordRetroMonths', '1.5')
settle()
check('existing whole-number error still preserves results', value('!document.querySelector(".planning-error").hidden && document.querySelector(".planning-error").textContent.startsWith("Enter values within the displayed ranges")') and metric() == accepted)
browser('click', '.planning-reset')
settle()
check('existing lab reset clears generic validation', value('document.querySelector(".planning-error").hidden && document.querySelector(".planning-metrics strong").textContent==="$4,000"'))

browser('set', 'viewport', '1440', '1000')
browser('open', ORIGIN + '/research/')
check('library links the new topic', value('Array.from(document.querySelectorAll(".planning-topic h3 a")).filter(a=>' + json.dumps([row[0] for row in pages]) + '.some(s=>a.pathname.endsWith(s))).length===1'))
print('Browser verification complete.', flush=True)
