#!/usr/bin/env python3
"""Extract six narrow public FCAC survey observations from saved source HTML."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
class Text(HTMLParser):
    def __init__(self):super().__init__();self.parts=[];self.meta={}
    def handle_data(self,t):self.parts.append(t)
    def handle_starttag(self,tag,attrs):
        if tag=='meta':
            a=dict(attrs)
            if a.get('name') in ('dcterms.issued','dcterms.modified'):
                assert a['name'] not in self.meta;self.meta[a['name']]=a.get('content')
def extract(path):
    raw=path.read_bytes();p=Text();p.feed(raw.decode('utf-8'));text=' '.join(' '.join(p.parts).split())
    assert '2024 Canadian Financial Capability Survey' in text
    assert 'In February and March 2024' in text
    assert p.meta=={'dcterms.issued':'2025-11-17','dcterms.modified':'2025-11-21'},p.meta
    age=re.findall(r'professional advisors[—–-]\s*(\d+)% compared to (\d+)% of those aged 35 to 54, and (\d+)% of those aged 55 or older',text)
    social=re.findall(r'younger Canadians were twice as likely to turn to social media \((\d+)%\)',text)
    family=re.findall(r'even more likely to turn to family or friends for advice \((\d+)%\)',text)
    assert len(age)==len(social)==len(family)==1,'Missing or duplicate target statements'
    young,middle,older=map(int,age[0]);social=int(social[0]);family=int(family[0]);assert all(0<=n<=100 for n in [young,middle,older,social,family])
    return {'publisher':'Financial Consumer Agency of Canada','survey':'2024 Canadian Financial Capability Survey','collection':'February and March 2024','published':p.meta['dcterms.issued'],'modified':p.meta['dcterms.modified'],'retrieved':'2026-10-25','url':'https://www.canada.ca/en/financial-consumer-agency/programs/research/financial-advice.html','sha256':hashlib.sha256(raw).hexdigest(),'unit':'Percent of the stated age group, as reported in the FCAC spotlight','professionalByAge':[{'label':'18–34','percent':young},{'label':'35–54','percent':middle},{'label':'55 or older','percent':older}],'youngSources':[{'label':'Family or friends','percent':family},{'label':'Professional advisors','percent':young},{'label':'Social media','percent':social}]}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('html',type=Path);p.add_argument('--check',action='store_true');args=p.parse_args()
    body='// Small attributed public FCAC extract; reproduce with scripts/extract-planning-advice-source.py.\nexport const adviceSource = '+json.dumps(extract(args.html),ensure_ascii=False,indent=2)+';\n';target=Path('src/planning-advice-data.js')
    if args.check:assert target.read_text()==body,'Snapshot differs from validated source';print('Verified six observations, source statements, dates and original HTML SHA-256.')
    else:target.write_text(body);print('Wrote '+str(target))
