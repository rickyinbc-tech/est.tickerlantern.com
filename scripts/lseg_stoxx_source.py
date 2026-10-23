"""Read the two explicitly printed STOXX 600 valuation labels in LSEG research.

The report embeds its chart lettering as images. OCR reads the numeric labels,
not the location of a chart line. A layout/color change fails closed.
"""
import datetime as dt
import hashlib
import html
import io
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image
from pypdf import PdfReader

FEED = 'https://lipperalpha.refinitiv.com/category/earnings/feed/'
HOST = 'lipperalpha.refinitiv.com'
PARSER_VERSION = 'lseg-stoxx-printed-labels-1'


def discover_reports(feed_bytes, today=None):
    today = today or dt.datetime.now(dt.timezone.utc).date()
    articles = []
    for item in ET.fromstring(feed_bytes).findall('./channel/item'):
        title = item.findtext('title', '')
        if not title.startswith('STOXX 600 Earnings Outlook'):
            continue
        date = parsedate_to_datetime(item.findtext('pubDate')).date()
        if date > today or date.year < 2020:
            continue
        content = item.findtext('{http://purl.org/rss/1.0/modules/content/}encoded', '')
        urls = set(re.findall(r'https://lipperalpha\.refinitiv\.com/wp-content/uploads/\d{4}/\d{2}/TRPR_83201_\d+\.pdf', html.unescape(content)))
        if len(urls) != 1:
            continue
        article_url = item.findtext('link', '')
        if urlparse(article_url).hostname != HOST:
            continue
        articles.append((date.isoformat(), urls.pop(), article_url))
    if not articles:
        raise ValueError('No dated STOXX 600 report with a unique official PDF in LSEG RSS')
    return sorted(articles, reverse=True)[:4]


def parse_printed_number(text):
    text = re.sub(r'\s+', '', text).lower()
    # Do not correct or guess digits. The printed multiple must be unambiguous.
    match = re.fullmatch(r'(\d{1,6}\.\d{1,2})[x×]', text)
    if not match:
        raise ValueError('Unambiguous printed P/E label was not recognized')
    value = float(match[1])
    if not 0 <= value <= 1_000_000:
        raise ValueError('Printed P/E label outside supported range')
    return value


def numeric_label_crops(image):
    """Isolate unique blue-current and black-average rectangles on report p8."""
    image = image.convert('RGB')
    width, height = image.size
    labels = {}
    # This template guard excludes axis numbers and legend captions. It requires
    # a solid label background at the actual right edge of the valuation chart.
    for role in ('blue', 'black'):
        rows = []
        for y in range(int(height * .58), int(height * .75)):
            count = 0
            for x in range(int(width * .86), int(width * .94)):
                red, green, blue = image.getpixel((x, y))
                if ((blue > 130 and red < 70 and green < 100) if role == 'blue' else max(red, green, blue) < 75):
                    count += 1
            if count > width * .015:
                rows.append(y)
        groups = []
        for y in rows:
            if not groups or y > groups[-1][-1] + 3:
                groups.append([y])
            else:
                groups[-1].append(y)
        groups = [group for group in groups if len(group) >= height * .005]
        if len(groups) != 1:
            raise ValueError('LSEG valuation label layout changed; review original report')
        group = groups[0]
        crop = image.crop((int(width * .85), min(group) - 3, int(width * .94), max(group) + 4))
        # Normalize to black lettering on white. This preserves printed digits
        # while avoiding OCR dependence on reversed white-on-color typography.
        crop = crop.convert('L').point(lambda value: 0 if value > 180 else 255)
        labels[role] = crop.resize((crop.width * 4, crop.height * 4))
    return labels


def _ocr(image, numeric_only):
    with tempfile.TemporaryDirectory(prefix='lseg-label-') as folder:
        path = Path(folder) / 'label.png'
        image.save(path)
        if shutil.which('tesseract'):
            command = ['tesseract', str(path), 'stdout', '--psm', '7' if numeric_only else '11']
            if numeric_only:
                command += ['-c', 'tessedit_char_whitelist=0123456789.xX']
        elif sys.platform == 'darwin' and shutil.which('swift'):
            # Local QA on macOS; production uses Tesseract on the Linux runner.
            script = ('import Vision; import Foundation; '
                      'let h=VNImageRequestHandler(url:URL(fileURLWithPath:CommandLine.arguments[1])); '
                      'let r=VNRecognizeTextRequest(); r.recognitionLevel = .accurate; '
                      'r.usesLanguageCorrection = false; try h.perform([r]); '
                      'for o in r.results ?? [] { print(o.topCandidates(1).first!.string) }')
            command = ['swift', '-e', script, str(path)]
        else:
            raise ValueError('Printed-label OCR unavailable; install Tesseract')
        result = subprocess.run(command, capture_output=True, timeout=50)
        if result.returncode:
            raise ValueError('Printed-label OCR failed')
        return result.stdout.decode('utf-8', 'replace').strip()


def ocr_label(image):
    return _ocr(image, numeric_only=True)


def ocr_text(image):
    return _ocr(image, numeric_only=False)


def validate_legend(text):
    text = re.sub(r'\s+', ' ', text)
    if not re.search(r'10\s*[-–]?\s*Year\s+Average', text, re.I):
        raise ValueError('Explicit 10-year-average legend is absent; review source')
    if not re.search(r'12\s+Month\s+Forward\s+P/E', text, re.I):
        raise ValueError('Explicit 12-month-forward-P/E legend is absent; review source')


def parse_report(body, published, ocr=ocr_label, read_text=ocr_text):
    if not body.startswith(b'%PDF'):
        raise ValueError('LSEG source did not return a PDF')
    reader = PdfReader(io.BytesIO(body))
    if not 8 <= len(reader.pages) <= 40:
        raise ValueError('Unexpected LSEG report page count')
    page = reader.pages[7].extract_text()
    normalized = re.sub(r'\s+', ' ', page)
    expected_date = dt.date.fromisoformat(published)
    report_date = re.search(r'PROPRIETARY RESEARCH FROM LSEG\s+([A-Z]+ \d{1,2}, \d{4})', normalized)
    if not report_date or dt.datetime.strptime(report_date[1], '%B %d, %Y').date() != expected_date:
        raise ValueError('Report date does not match dated RSS observation')
    if not re.search(r'Exhibit 17A\.\s+STOXX 600:\s+12.month Forward Price/Earnings Ratio', normalized):
        raise ValueError('Expected STOXX 600 forward-P/E exhibit identity changed')
    with tempfile.TemporaryDirectory(prefix='lseg-page-') as folder:
        base = Path(folder) / 'page'
        result = subprocess.run(['pdftoppm', '-f', '8', '-singlefile', '-scale-to', '2000', '-png', '-', str(base)], input=body, capture_output=True, timeout=30)
        if result.returncode:
            raise ValueError('LSEG original page could not be rendered')
        image = Image.open(str(base) + '.png')
        width, height = image.size
        legend = image.crop((int(width * .15), int(height * .74), int(width * .85), int(height * .80)))
        validate_legend(read_text(legend))
        labels = numeric_label_crops(image)
        current, mean = (parse_printed_number(ocr(labels[role])) for role in ('blue', 'black'))
    return dict(forwardPE=current, mean10YearForwardPE=mean, asOf=published, meanAsOf=published,
                meanMethod='LSEG Datastream reported 10-year average; exact printed chart label, underlying sampling frequency not specified',
                forwardMethod='LSEG Datastream 12-month forward P/E; exact printed chart label')


def refresh_lseg_stoxx(fetch, today=None):
    reports = discover_reports(fetch(FEED), today)
    if not reports: raise ValueError('No dated LSEG STOXX 600 report discovered')
    date, url, article = reports[0]
    body = fetch(url)
    values = parse_report(body, date)
    source = dict(publisher='LSEG Datastream', url=url, discoveryUrl=FEED,
                  articleUrl=article, page=8, sha256=hashlib.sha256(body).hexdigest(),
                  parserVersion=PARSER_VERSION, frequency='Weekly research; checked daily')
    return values, source
