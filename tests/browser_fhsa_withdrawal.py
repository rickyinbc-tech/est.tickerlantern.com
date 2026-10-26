#!/usr/bin/env python3
"""Bounded browser QA for the FHSA qualifying-withdrawal guide."""
import json
import subprocess
import sys
from pathlib import Path
from urllib.request import urlopen

origin = sys.argv[1] if len(sys.argv) > 1 else 'https://tickerlantern.com'
session = 'tl-fhsa-withdrawal-qa'
root = Path(__file__).resolve().parents[1]
qa = root / 'qa'
qa.mkdir(exist_ok=True)
slug = 'fhsa-first-time-homebuyer-qualifying-withdrawal-deadline-closeout'

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

checks = []
for prefix, lang in [('', 'en'), ('/zh', 'zh-Hans')]:
    path = f'{origin}{prefix}/research/{slug}.html'
    with urlopen(path) as response:
        assert response.status == 200
    run('open', path)
    for width in [1440, 390, 320]:
        run('set', 'viewport', str(width), '1000' if width == 1440 else '844')
        stats = run(expression='''({lang:document.documentElement.lang,charts:document.querySelectorAll('.planning-figure svg').length,tables:document.querySelectorAll('.plot-data table').length,overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.querySelectorAll('.planning-figure')].some(e=>/NaN|Infinity|undefined/.test(e.textContent))})''')
        assert stats == {'lang':lang,'charts':4,'tables':4,'overflow':False,'broken':False}, (prefix,width,stats)
        checks.append({'path':path,'width':width,**stats})
    if not prefix:
        run('fill', '#planning-fhsaAcqLag', '-31')
        assert 'Fails' in run(expression="document.querySelector('.planning-metrics').innerText")
        run('click', '.planning-reset')
        run('eval', "document.querySelector('#fhsa-checkpoint-margins').scrollIntoView()")
        run('screenshot', str(qa / 'fhsa-withdrawal-margins-mobile.png'))
(qa / 'fhsa-withdrawal-browser.json').write_text(json.dumps(checks, indent=1))
print(json.dumps(checks))
