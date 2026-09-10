#!/usr/bin/env python3
"""Collect public enri.sbu.ac.ir pages and assets into an auditable ZIP.

Python 3.10+; standard library only. Run where the university host is reachable.
This is a source collector, not a promise of a complete site export. JavaScript
is not executed, forms are not submitted, and authenticated pages are skipped.
"""
from collections import deque
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit, urlunsplit, parse_qsl, quote
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.robotparser import RobotFileParser
import argparse, gzip, hashlib, json, mimetypes, re, time, zipfile
import xml.etree.ElementTree as ET

ORIGIN='https://enri.sbu.ac.ir'
HOST='enri.sbu.ac.ir'
AGENT='ENRI-Public-Archive/1.0'
SITE=Path(__file__).resolve().parent.parent
CSS_URL=re.compile(r'''url\(\s*["']?([^\s\)"']+)''',re.I)
CSS_IMPORT=re.compile(r'''@import\s+["']([^"']+)''',re.I)
ACTION=re.compile(r'/(?:login|logout|signin|signout|delete|remove|edit|admin|control_panel)(?:/|$)',re.I)

def normalize(value,base=ORIGIN+'/'):
    try:
        u=urlsplit(urljoin(base,unescape(value.strip())))
        if u.scheme not in ('http','https') or u.hostname!=HOST or u.port not in (None,80,443) or u.username or u.password:return None
        if ACTION.search(u.path):return None
        for key,val in parse_qsl(u.query):
            if key in ('p_auth','p_p_auth') or (key=='p_p_lifecycle' and val!='0'):return None
            if key.lower() in ('action','cmd','do') and val.lower() not in ('','view','search','list'):return None
        return urlunsplit(('https',HOST,quote(u.path or '/',safe='/%:@-._~!$&()*+,;='),quote(u.query,safe="%/:@-._~!$&'()*+,;=?"),''))
    except (ValueError,TypeError):return None

class PublicRedirects(HTTPRedirectHandler):
    allowed=None
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        target=normalize(newurl,req.full_url)
        if not target:raise HTTPError(req.full_url,code,'Redirect outside public collection scope',headers,fp)
        if self.allowed and not self.allowed(target):raise HTTPError(req.full_url,code,'Redirect disallowed by robots.txt',headers,fp)
        return super().redirect_request(req,fp,code,msg,headers,target)

class Links(HTMLParser):
    def __init__(self):super().__init__(convert_charrefs=True);self.urls=[];self.in_style=False;self.base=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='base' and a.get('href') and self.base is None:self.base=a['href']
        if tag=='style':self.in_style=True
        if tag in ('a','area','link') and a.get('href'):self.urls.append(a['href'])
        if tag in ('img','script','iframe','source','video','audio','embed','input'):
            for attr in ('src','data-src','data-original','poster'):
                if a.get(attr):self.urls.append(a[attr])
        if tag=='object' and a.get('data'):self.urls.append(a['data'])
        if a.get('srcset'):
            self.urls.extend(x.strip().split()[0] for x in a['srcset'].split(',') if x.strip())
        if a.get('style'):self.urls.extend(CSS_URL.findall(a['style']))
    def handle_endtag(self,tag):
        if tag=='style':self.in_style=False
    def handle_data(self,value):
        if self.in_style:self.urls.extend(CSS_URL.findall(value));self.urls.extend(CSS_IMPORT.findall(value))

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',default='enri-source-capture',help='New output directory; must not already exist')
    parser.add_argument('--max-urls',type=int,default=5000)
    parser.add_argument('--max-file-mb',type=int,default=32)
    parser.add_argument('--timeout',type=float,default=25)
    parser.add_argument('--delay',type=float,default=0.6)
    args=parser.parse_args()
    if min(args.max_urls,args.max_file_mb,args.timeout)<=0 or args.delay<0:parser.error('Limits must be positive; delay must be nonnegative')
    output=Path(args.output).resolve();archive=output.with_name(output.name+'.zip')
    if output.exists() or archive.exists():parser.error('Output directory or ZIP already exists; choose another --output')
    output.mkdir(parents=True);(output/'files').mkdir()
    manifest={'origin':ORIGIN,'started_utc':datetime.now(timezone.utc).isoformat(),'complete_domain_capture':False,
      'method':'Public same-host GET crawl; no JavaScript execution or authenticated content',
      'scope_limits':['Only discovered URLs and supplied seeds','External hosts excluded','Login/action URLs excluded','No forms or browser-only pagination'],
      'files':[],'failures':[],'skipped':[],'pending':[]}
    redirect_handler=PublicRedirects();opener=build_opener(redirect_handler);limit=args.max_file_mb*1024*1024
    robots=RobotFileParser();queue=deque();seen=set();delay=args.delay;last=0.0
    def fetch(url):
        nonlocal last
        time.sleep(max(0,delay-(time.monotonic()-last)));last=time.monotonic()
        request=Request(url,headers={'User-Agent':AGENT,'Accept':'*/*','Accept-Encoding':'identity'})
        with opener.open(request,timeout=args.timeout) as response:
            if int(response.headers.get('Content-Length','0'))>limit:raise ValueError('File exceeds --max-file-mb')
            body=response.read(limit+1)
            if len(body)>limit:raise ValueError('File exceeds --max-file-mb')
            return body,response.headers.get_content_type(),response.headers.get_content_charset() or 'utf-8',response.geturl()
    def checkpoint():
        manifest['pending']=list(queue);manifest['finished_utc']=datetime.now(timezone.utc).isoformat()
        manifest['downloaded_count']=len(manifest['files']);manifest['failure_count']=len(manifest['failures'])
        (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    def enqueue(value,base=ORIGIN+'/'):
        url=normalize(value,base)
        if url and url not in seen:seen.add(url);queue.append(url)
    try:
        robots_url=ORIGIN+'/robots.txt'
        try:
            body,_,encoding,_=fetch(robots_url);text=body.decode(encoding,errors='replace')
            (output/'robots.txt').write_bytes(body);robots.parse(text.splitlines())
            for line in text.splitlines():
                if line.lower().startswith('sitemap:'):enqueue(line.split(':',1)[1].strip())
            delay=max(delay,float(robots.crawl_delay(AGENT) or 0))
            rate=robots.request_rate(AGENT)
            if rate:delay=max(delay,rate.seconds/rate.requests)
        except HTTPError as exc:
            if exc.code not in (404,410):raise
            robots.parse([]);manifest['robots_status']='Not present (HTTP '+str(exc.code)+')'
        redirect_handler.allowed=lambda url:robots.can_fetch(AGENT,url)
        enqueue(ORIGIN+'/');enqueue(ORIGIN+'/sitemap.xml')
        for path in json.loads((SITE/'source-url-map.json').read_text(encoding='utf-8')):enqueue(path)
        for item in json.loads((SITE/'source-image-inventory.json').read_text(encoding='utf-8')):enqueue(item['url'])
        attempts=0
        while queue and attempts<args.max_urls:
            url=queue.popleft()
            if not robots.can_fetch(AGENT,url):manifest['skipped'].append({'url':url,'reason':'robots.txt'});continue
            attempts+=1
            try:
                body,kind,encoding,final_url=fetch(url)
                ext={'text/html':'.html','application/xhtml+xml':'.html','text/css':'.css','application/javascript':'.js','text/javascript':'.js','application/xml':'.xml','text/xml':'.xml'}.get(kind,mimetypes.guess_extension(kind) or '.bin')
                relative='files/'+hashlib.sha256(url.encode()).hexdigest()+ext
                (output/relative).write_bytes(body)
                manifest['files'].append({'url':url,'final_url':final_url,'file':relative,'content_type':kind,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()})
                base=final_url
                if kind in ('text/html','application/xhtml+xml'):
                    page=Links();page.feed(body.decode(encoding,errors='replace'))
                    base=normalize(page.base,base) or base if page.base else base
                    for link in page.urls:enqueue(link,base)
                elif kind=='text/css':
                    text=body.decode(encoding,errors='replace')
                    for link in CSS_URL.findall(text)+CSS_IMPORT.findall(text):enqueue(link,base)
                elif kind in ('application/xml','text/xml') or 'sitemap' in urlsplit(url).path.lower():
                    try:
                        xml=gzip.decompress(body) if body.startswith(b'\x1f\x8b') else body
                        if len(xml)>limit:raise ValueError('Decompressed sitemap exceeds size limit')
                        for el in ET.fromstring(xml).iter():
                            if el.tag.rsplit('}',1)[-1]=='loc' and el.text:enqueue(el.text,base)
                    except (ET.ParseError,OSError,ValueError) as exc:manifest['failures'].append({'url':url,'error':'Sitemap parse: '+str(exc)})
            except (HTTPError,URLError,OSError,ValueError) as exc:
                manifest['failures'].append({'url':url,'error':str(exc)})
            if attempts%20==0:checkpoint();print(f'{attempts} attempted; {len(manifest["files"])} saved; {len(queue)} pending',flush=True)
        if queue:manifest['stop_reason']='Reached --max-urls; increase the limit for a future run'
        else:manifest['stop_reason']='Discovered public URL queue exhausted; undiscovered and dynamic pages may remain'
    except KeyboardInterrupt:manifest['stop_reason']='Interrupted; saved files retained'
    except (HTTPError,URLError,OSError,ValueError) as exc:
        manifest['stop_reason']='Stopped before collection could complete';manifest['failures'].append({'url':ORIGIN+'/robots.txt','error':str(exc)})
    finally:
        checkpoint()
        with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
            for file in sorted(output.rglob('*')):
                if file.is_file():z.write(file,output.name+'/'+str(file.relative_to(output)))
        print(f'Saved {archive}; {len(manifest["files"])} files; {len(manifest["failures"])} failures. See manifest.json. This is not a verified complete domain export.')

if __name__=='__main__':main()
