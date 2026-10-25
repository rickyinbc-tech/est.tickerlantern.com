#!/usr/bin/env python3
"""Check public deployed SEO responses using the OS curl certificate store."""
import argparse
import concurrent.futures
import datetime
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.metas={}; self.canonicals=[]; self.title=''; self.titled=False; self.schemas=[]; self.schema=None; self.h1=0
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag=='meta': self.metas[attrs.get('name',attrs.get('property',''))]=attrs.get('content','')
        if tag=='link' and attrs.get('rel')=='canonical': self.canonicals.append(attrs.get('href'))
        if tag=='title': self.titled=True
        if tag=='h1': self.h1+=1
        if tag=='script' and attrs.get('type')=='application/ld+json': self.schema=''
    def handle_data(self,data):
        if self.titled: self.title+=data
        if self.schema is not None: self.schema+=data
    def handle_endtag(self,tag):
        if tag=='title': self.titled=False
        if tag=='script' and self.schema is not None: self.schemas.append(json.loads(self.schema)); self.schema=None

def get(url):
    result=subprocess.run(['curl','--silent','--show-error','--max-time','30','--write-out','\n%{http_code}',url],capture_output=True,text=True,check=True)
    body,status=result.stdout.rsplit('\n',1)
    return int(status),body

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--base',default='https://tickerlantern.com'); parser.add_argument('--output'); args=parser.parse_args()
    base=args.base.rstrip('/'); status,body=get(base+'/sitemap.xml'); assert status==200,'Sitemap unavailable'
    urls=[node.text for node in ET.fromstring(body).findall('{*}url/{*}loc')]
    assert len(urls)==len(set(urls)),'Duplicate sitemap URLs'
    def check(url):
        path=urlsplit(url).path; status,body=get(base+path); page=Page(); page.feed(body); errors=[]
        if status!=200: errors.append('HTTP '+str(status))
        if page.canonicals!=[url]: errors.append('canonical mismatch')
        if not page.title or not page.metas.get('description'): errors.append('missing title or description')
        if not page.h1: errors.append('missing heading')
        if re.search(r'noindex|nofollow',page.metas.get('robots',''),re.I): errors.append('robots blocks indexing')
        if not any(node.get('url')==url for schema in page.schemas for node in schema.get('@graph',[])): errors.append('structured data canonical mismatch')
        if page.metas.get('og:image')!='https://tickerlantern.com/social.png': errors.append('missing social image')
        if page.metas.get('og:url')!=url: errors.append('social canonical mismatch')
        return {'url':url,'status':status,'title':page.title,'errors':errors}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: pages=list(pool.map(check,urls))
    titles=[page['title'] for page in pages]; errors=[page for page in pages if page['errors']]
    assert len(titles)==len(set(titles)),'Duplicate titles'
    robot_status,robots=get(base+'/robots.txt'); assert robot_status==200 and 'Sitemap: https://tickerlantern.com/sitemap.xml' in robots
    missing,_=get(base+'/seo-check-page-that-does-not-exist'); assert missing==404,'Missing page is not a 404'
    image_status,_=subprocess.run(['curl','--silent','--show-error','--max-time','30','--head','--write-out','\n%{http_code}',base+'/social.png'],capture_output=True,text=True,check=True).stdout.rsplit('\n',1)
    assert 'image/png' in image_status,'Social image not PNG'
    result={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'base':base,'pages':len(pages),'failures':len(errors),'checks':pages}
    if args.output: Path(args.output).write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'pages':len(pages),'failures':errors,'robots':'valid','missing_page_status':missing,'social_image':'PNG'}))
    if errors: raise SystemExit(1)

if __name__=='__main__': main()
