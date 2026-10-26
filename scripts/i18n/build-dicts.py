#!/usr/bin/env python3
"""Builds the runtime dictionaries used by zh-runtime.js.

Static pages carry translated markup. Interactive charts, the valuation
workbench and search results rebuild their labels in JavaScript, so the browser
needs a small English-to-Chinese dictionary for each page. Pairs come from the
same committed translation memory; no network access is used here.
"""
import json
import re
from collections import Counter
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist"
CACHE = ROOT / "src/locales/zh/cache.json"
OUT = ROOT / "src/locales/zh/dicts"
RUNTIME = ROOT / "src/locales/zh/runtime"
CJK = re.compile(r"[\u3400-\u9fff]")
LATIN = re.compile(r"[A-Za-z]")
ATTRS = ("aria-label", "title", "placeholder", "alt")


def norm(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


FIXES = (
    ("股票行情灯笼", "TickerLantern"),
    ("股票代码灯笼", "TickerLantern"),
    ("股票灯笼", "TickerLantern"),
    ("阴性细胞", "负值单元格"),
    ("阳性细胞", "正值单元格"),
    ("零细胞", "零值单元格"),
    ("细胞", "单元格"),
    ("生长", "增长"),
    ("终端", "期末"),
    ("抵消", "冲抵"),
    ("入门市盈率", "起始市盈率"),
    ("条目市盈率", "起始市盈率"),
)


def fix(value: str) -> str:
    for old, new in FIXES:
        value = value.replace(old, new)
    return value


def textnodes(value: str) -> list[str]:
    soup = BeautifulSoup(value, "html.parser")
    return [norm(node) for node in soup.find_all(string=True) if norm(node)]


cache = json.loads(CACHE.read_text())
pairs: dict[str, str] = {}
for entry in cache.values():
    src, zh = entry.get("src", ""), entry.get("zh", "")
    if not src or not zh or src == zh or not CJK.search(zh):
        continue
    if "<" not in src:
        key = norm(src)
        if key and LATIN.search(key):
            pairs.setdefault(key, fix(zh))
        continue
    left, right = textnodes(src), textnodes(zh)
    if len(left) != len(right):
        continue
    for source, target in zip(left, right):
        if source and target and source != target and LATIN.search(source) and CJK.search(target):
            pairs.setdefault(source, fix(target))

# Interactive labels that are generated after load and do not always have a
# matching static text node on every page.
manual = {
    "View chart data": "查看图表数据",
    "Step": "步骤",
    "Scenario": "情景",
    "Value": "数值",
    "Series": "系列",
    "Change": "变化",
    "Running total": "累计金额",
    "Assumption": "假设",
    "Entry": "起始",
    "Exit": "期末",
    "English original": "英文原文",
    "Try again": "重试",
    "Loading the search library…": "正在加载搜索库…",
    "The search library could not load. Check your connection and try again.": "搜索库无法加载。请检查网络连接后重试。",
    "Search the whole library, or choose a question below.": "搜索整个资料库，或从下面的问题开始。",
    "Start with a question": "从一个问题开始",
    "Chart": "图表",
    "Tool": "工具",
    "Article": "文章",
    "In:": "所属：",
    "All topics": "所有主题",
    "results": "条结果",
    "result": "条结果",
    "No results for": "没有找到",
    "Try fewer words, a broader topic, or All topics.": "请减少关键词、扩大主题范围，或选择“所有主题”。",
    "Search articles, charts and tools | TickerLantern": "搜索文章、图表和工具 | TickerLantern",
}
manual_zh = {"search": "搜索", "all": "全部", "article": "文章", "chart": "图表", "tool": "工具",
             "planning": "财务规划", "investing": "投资与指数", "stocks": "股票分析", "products": "票据和担保投资证"}
for key, value in manual.items():
    pairs.setdefault(key, fix(value))
for key, value in manual_zh.items():
    pairs.setdefault(key, fix(value))
pairs.update({"Entry": "起始", "Exit": "期末"})
# The header logo splits the brand into two text nodes; keep both in English.
for brand in ("Ticker", "Lantern"):
    pairs.pop(brand, None)


def page_files():
    for path in sorted(DIST.rglob("*.html")):
        rel = path.relative_to(DIST)
        if rel.parts and rel.parts[0] == "zh":
            continue
        url = "/" + str(rel).replace("\\", "/")
        if url == "/index.html":
            url = "/"
        elif url.endswith("/index.html"):
            url = url[:-10]
        else:
            url = url[:-5]
        yield url, path


def dict_key(url: str) -> str:
    if url == "/":
        return "home"
    clean = re.sub(r"[^a-z0-9]+", "-", url.strip("/"), flags=re.I)
    return clean or "home"


page_keys: dict[str, dict[str, str]] = {}
frequency: Counter[str] = Counter()
for url, path in page_files():
    soup = BeautifulSoup(path.read_text(), "html.parser")
    body = soup.body
    if not body:
        continue
    keys: set[str] = set()
    for node in body.find_all(string=True):
        parent = node.parent
        if not parent or parent.name in {"script", "style", "noscript", "pre", "code", "textarea"}:
            continue
        value = norm(str(node))
        if value and LATIN.search(value) and value in pairs:
            keys.add(value)
    for tag in body.find_all(True):
        for attr in ATTRS:
            value = norm(tag.get(attr, ""))
            if value and LATIN.search(value) and value in pairs:
                keys.add(value)
    key = dict_key(url)
    captured = RUNTIME / f"{key}.json"
    if captured.exists():
        for value in json.loads(captured.read_text()):
            if value in pairs:
                keys.add(value)
    page_keys[key] = {key: pairs[key] for key in sorted(keys)}
    frequency.update(keys)

shared_keys = {key for key, count in frequency.items() if count >= 20}
shared = {key: pairs[key] for key in sorted(shared_keys)}
for values in page_keys.values():
    for key in shared_keys:
        values.pop(key, None)

OUT.mkdir(parents=True, exist_ok=True)
for old in OUT.glob("*.json"):
    old.unlink()
(OUT / "shared.json").write_text(json.dumps({"translations": shared}, ensure_ascii=False))
largest = 0
for key, values in page_keys.items():
    if not values:
        continue
    path = OUT / f"{key}.json"
    payload = json.dumps({"translations": values}, ensure_ascii=False)
    path.write_text(payload)
    largest = max(largest, len(payload))
print(f"dictionaries: {len([p for p in OUT.glob('*.json')])} files; shared {len(shared)} entries; largest page {largest // 1024} KB")
