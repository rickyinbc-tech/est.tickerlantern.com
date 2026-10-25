#!/usr/bin/env python3
"""Bounded browser QA for the three new public planning pages."""
import json
import subprocess
import sys
from pathlib import Path
from urllib.request import urlopen

origin = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8895'
session = 'tl-wealth-flex-1025-qa'
root = Path(__file__).resolve().parents[1]
qa = root / 'qa'
qa.mkdir(exist_ok=True)

def run(*args, expression=None):
    cmd = ['agent-browser', '--session', session, *args]
    if expression is not None:
        cmd += ['eval', '--json', '--stdin']
    result = subprocess.run(cmd, input=expression, text=True, capture_output=True, check=True, timeout=90)
    if expression is not None:
        result = json.loads(result.stdout)
        assert result['success'], result
        return result['data']['result']
    return result.stdout

slugs = ['canadian-wealth-statistics-liquidity-context', 'retirement-spending-guardrails-consumption-tradeoff', 'family-gift-retirement-capacity']
checks = []
for slug in slugs:
    path = f'{origin}/research/{slug}.html'
    with urlopen(path) as response:
        assert response.status == 200
    run('open', path)
    for width in [1440, 390]:
        run('set', 'viewport', str(width), '1000' if width == 1440 else '844')
        stats = run(expression='''({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.querySelectorAll('.planning-figure')].some(e=>/NaN|Infinity|undefined/.test(e.textContent))})''')
        assert stats == {'lang':'en','charts':4,'tables':4,'overflow':False,'broken':False}, (slug,width,stats)
        checks.append({'slug':slug,'width':width,**stats})
    if slug == slugs[0]:
        before = run(expression="document.querySelector('#wealth-young').innerHTML")
        run('fill', '#planning-cash', '32000')
        assert run(expression="document.querySelector('.planning-metrics').textContent.includes('$0')")
        assert before == run(expression="document.querySelector('#wealth-young').innerHTML")
        run('eval', "document.querySelector('#wealth-older').scrollIntoView()")
        run('screenshot', str(qa / 'wealth-statistics-mobile.png'))
    elif slug == slugs[1]:
        run('fill', '#planning-cut', '0')
        metrics = run(expression="document.querySelector('.planning-metrics').innerText")
        assert '$0' in metrics and '-$0' not in metrics, metrics
        run('fill', '#planning-cut', '-1')
        assert run(expression="!document.querySelector('.planning-error').hidden")
        assert run(expression="document.querySelector('.planning-metrics').innerText") == metrics
        run('click', '.planning-reset')
        assert not run(expression="!document.querySelector('.planning-error').hidden")
    else:
        run('fill', '#planning-gift', '0')
        values = run(expression="[...document.querySelector('#gift-capital table tbody').rows].map(r=>r.cells[2].textContent)")
        assert values[:26] == values[26:52] == values[52:78]
        run('click', '.planning-reset')
        run('eval', "document.querySelector('#gift-reconcile').scrollIntoView()")
        run('screenshot', str(qa / 'family-gift-waterfall-mobile.png'))
    # Data disclosure must be keyboard-focusable and openable.
    run('click', '.plot-data summary')
    assert run(expression="document.querySelector('.plot-data').open")

with urlopen(origin + '/research/planning-wealth-flex-models.js') as response:
    assert response.status == 200
(qa / 'wealth-flex-browser.json').write_text(json.dumps(checks,indent=2))
print('Verified 3 pages at desktop and mobile widths, 12 charts and data tables, source isolation, reset, invalid inputs and zero-gift/cut interactions.')
