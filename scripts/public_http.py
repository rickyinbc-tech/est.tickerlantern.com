"""Bounded anonymous HTTPS transport. Validate every redirect before requesting it."""
import re
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import urljoin, urlparse

MAX_BYTES = 24_000_000
CHALLENGES = ("access denied", "request blocked", "verify you are human", "verify that you are human", "checking your browser", "complete the captcha", "enable javascript and cookies to continue", "performing security verification")


def checked_url(url, hosts):
    parsed = urlparse(url)
    try:
        invalid = parsed.scheme != 'https' or parsed.hostname not in hosts or parsed.username is not None or parsed.password is not None or parsed.port not in (None, 443) or any(ord(c) < 32 for c in url)
    except (ValueError, TypeError):
        invalid = True
    if invalid: raise ValueError('Unapproved public source URL or redirect')
    return url


def complete_pdf(body):
    tail = body[-2048:]
    if b'%%EOF' in tail: return True
    # Some publishers (MSCI country factsheets) serve a complete file whose final
    # marker is written as %%EO. Accept it only when the trailing startxref
    # points at a real cross-reference section inside the downloaded bytes.
    match = re.search(rb'startxref\s+(\d+)\s+%%EOF?\s*$', tail)
    if not match: return False
    offset = int(match[1])
    return offset < len(body) and re.match(rb'xref\s|\d+\s+\d+\s+obj\b', body[offset:offset + 32]) is not None


def validate_body(body, content_type, url, allow_empty=False):
    if not body and allow_empty: return body
    if not body or len(body) > MAX_BYTES: raise ValueError('Empty or oversized public source')
    mime = (content_type or '').split(';', 1)[0].strip().lower()
    is_pdf = body.startswith(b'%PDF')
    expects_pdf = urlparse(url).path.lower().endswith('.pdf') or mime in ('application/pdf', 'application/x-pdf')
    if expects_pdf or is_pdf:
        if not is_pdf or not complete_pdf(body): raise ValueError('Truncated PDF or non-PDF response')
        if mime and mime not in ('application/pdf', 'application/x-pdf', 'application/octet-stream', 'binary/octet-stream'): raise ValueError('Unexpected PDF content type')
        return body
    if mime and not (mime.startswith('text/') or mime in ('application/json', 'application/xml', 'application/rss+xml', 'application/atom+xml', 'application/xhtml+xml', 'application/octet-stream')): raise ValueError('Unexpected public source content type')
    text = body[:2_000_000].decode('utf-8', 'replace')
    visible = re.sub(r'<(?:script|style)\b[^>]*>.*?</(?:script|style)>', '', text, flags=re.I | re.S)
    visible = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', visible)).lower()
    if any(marker in visible for marker in CHALLENGES) or re.search(r'<title[^>]*>\s*(?:just a moment|captcha)', text, re.I): raise ValueError('Publisher returned an access challenge or denial')
    return body


def request(url, hosts, post=False, allow_status=False):
    """No -L: every Location is allowlisted before the next anonymous request."""
    current = checked_url(url, hosts)
    for _ in range(6):
        with tempfile.TemporaryDirectory(prefix='tickerlantern-http-') as folder:
            headers_path = Path(folder) / 'headers'
            args = ['curl', '--proto', '=https', '-sS', '--max-time', '45', '--retry', '1', '--max-filesize', str(MAX_BYTES), '-A', 'TickerLanternResearch/1.0 (+https://tickerlantern.com)', '--dump-header', str(headers_path), '-w', '\n%{http_code}\n%{content_type}']
            if post: args += ['--data', '']
            result = subprocess.run(args + [current], capture_output=True)
            if result.returncode: raise ValueError('Public source request unavailable')
            parts = result.stdout.rsplit(b'\n', 2)
            if len(parts) != 3: raise ValueError('Malformed public response metadata')
            body, code, content_type = parts
            try: status = int(code)
            except ValueError: raise ValueError('Invalid public response status') from None
            headers = headers_path.read_text(errors='replace')
        if status in (301, 302, 303, 307, 308):
            locations = re.findall(r'^Location:\s*(.+?)\r?$', headers, re.I | re.M)
            if len(locations) != 1: raise ValueError('Ambiguous public source redirect')
            current = checked_url(urljoin(current, locations[0].strip()), hosts)
            if status == 303: post = False
            continue
        if status != 200:
            if allow_status: return body, status
            raise ValueError('Public source HTTP ' + str(status))
        return validate_body(body, content_type.decode(), current), status
    raise ValueError('Too many public source redirects')
