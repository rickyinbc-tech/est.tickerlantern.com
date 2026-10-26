#!/usr/bin/env python3
"""Extract translatable blocks from the built English site and apply the
committed Chinese translations.

Two stages keep the production build offline:

  python3 scripts/i18n/catalog.py extract   # writes work/units.json
  node scripts/i18n/translate.mjs ...       # writes work/translations.json
  python3 scripts/i18n/guard-memory.py      # keeps English where numbers disagree
  python3 scripts/i18n/catalog.py apply     # writes src/locales/zh/pages/*

Block units are the inner HTML of leaf elements, so inline links and emphasis
survive translation. Attribute and metadata units are translated separately.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist"
OUT = ROOT / "src" / "locales" / "zh"
WORK = OUT / "work"
PAGES_OUT = OUT / "pages"

BLOCK = {
    "address", "article", "aside", "blockquote", "body", "caption", "dd",
    "details", "dialog", "div", "dl", "dt", "fieldset", "figcaption",
    "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6",
    "header", "li", "main", "nav", "ol", "p", "section", "summary",
    "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul", "button",
    "label", "legend", "option", "select", "input", "textarea", "img",
    "svg", "picture", "video", "audio", "iframe", "noscript", "text",
}
SKIP = {
    "script", "style", "pre", "code", "kbd", "samp", "textarea", "template",
}
ATTRS = ("aria-label", "title", "placeholder", "alt")
HEAD_META = (
    ("name", "description"),
    ("property", "og:title"),
    ("property", "og:description"),
    ("property", "og:image:alt"),
    ("name", "twitter:title"),
    ("name", "twitter:description"),
    ("name", "twitter:image:alt"),
)
LATIN = re.compile(r"[A-Za-z]")


def url_for(path: str) -> str:
    rel = path[len(str(DIST)):]
    if rel == "/index.html":
        return "/"
    if rel.endswith("/index.html"):
        return rel[:-10]
    return rel[:-5]


def page_files():
    for root, dirs, files in os.walk(DIST):
        # The generated Chinese tree is an output, never a translation source.
        dirs[:] = [name for name in dirs if not (root == str(DIST) and name == "zh")]
        for name in sorted(files):
            if not name.endswith(".html"):
                continue
            path = os.path.join(root, name)
            yield url_for(path), path


def digest(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:32]


def meaningful(text: str) -> bool:
    return bool(text and text.strip() and LATIN.search(text))


def leaf_blocks(root: Tag, units: dict[str, str]) -> None:
    """Collect leaf inner HTML and loose text nodes."""

    def walk(node: Tag) -> None:
        if node.name in SKIP:
            return
        children = [child for child in node.children if isinstance(child, Tag)]
        has_block = any(child.name in BLOCK for child in children)
        if not has_block:
            inner = node.decode_contents()
            if meaningful(node.get_text(" ", strip=True)):
                units[digest(inner)] = inner
            return
        for child in node.children:
            if isinstance(child, NavigableString):
                text = str(child)
                if meaningful(text):
                    units[digest(text)] = text
            elif isinstance(child, Tag):
                walk(child)

    walk(root)


def collect_attributes(soup: BeautifulSoup, units: dict[str, str]) -> None:
    for tag in soup.find_all(True):
        if tag.name in {"script", "style"}:
            continue
        for attr in ATTRS:
            value = tag.get(attr)
            if isinstance(value, str) and meaningful(value):
                units[digest(value)] = value


def collect_head(soup: BeautifulSoup, units: dict[str, str]) -> None:
    if soup.title and soup.title.string:
        value = soup.title.string
        if meaningful(value):
            units[digest(value)] = value
    for key, name in HEAD_META:
        tag = soup.find("meta", attrs={key: name})
        if tag and tag.get("content") and meaningful(tag["content"]):
            units[digest(tag["content"])] = tag["content"]
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(script.string or "")
        except Exception:
            continue
        for value in jsonld_strings(data):
            if meaningful(value):
                units[digest(value)] = value


def jsonld_strings(value):
    if isinstance(value, dict):
        for key, item in value.items():
            if key in {"name", "headline", "description", "alternateName"} and isinstance(item, str):
                yield item
            elif isinstance(item, (dict, list)):
                yield from jsonld_strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from jsonld_strings(item)


def collect() -> dict[str, str]:
    units: dict[str, str] = {}
    for _url, path in page_files():
        with open(path, encoding="utf-8") as handle:
            soup = BeautifulSoup(handle.read(), "lxml")
        body = soup.body
        if body:
            leaf_blocks(body, units)
            # Parent units keep inline markup intact, but the engine sometimes
            # translates only part of a long fragment. Text-node units let the
            # apply pass repair the remainder without losing links or emphasis.
            for node in body.find_all(string=True):
                parent = node.parent
                if not parent or parent.name in SKIP:
                    continue
                text = str(node)
                if meaningful(text):
                    units[digest(text)] = text
        collect_attributes(soup, units)
        collect_head(soup, units)
    return units


def has_cjk(text: str) -> bool:
    return bool(re.search(r"[\u3400-\u9fff]", text))


TERM_FIXES = (
    # The brand name stays in English.
    ("股票行情灯笼", "TickerLantern"),
    ("股票代码灯笼", "TickerLantern"),
    ("股票灯笼", "TickerLantern"),
    ("偿债基金", "专项储备金"),
    ("每日例会", "每日计息惯例"),
    ("本金支付", "本金还款"),
    ("贷方", "贷款机构"),
    ("抵消账户", "冲抵账户"),
    ("抵消式", "冲抵式"),
    ("抵消余额", "冲抵余额"),
    ("按揭抵消", "房屋贷款冲抵"),
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


def postprocess(text: str) -> str:
    for old, new in TERM_FIXES:
        text = text.replace(old, new)
    text = re.sub(r"(?:股票代码|股票行情|股票)(<span[^>]*>)灯笼</span>", r"Ticker\1Lantern</span>", text)
    text = re.sub(r"(?<=[\u3400-\u9fff])\|(?=\s*TickerLantern)", " |", text)
    return text


# Short section tags are left alone by the generic engine, which treats them as
# tickers. These are navigation labels in the bank-research layout, so give
# them an explicit Chinese form.
MANUAL = {
    "COMP": "同行比较",
    "DIST": "股息",
    "EST": "估算",
    "FY": "财年",
    "HIST": "历史",
    "METH": "方法",
    "OPS": "经营",
    "STRESS": "压力测试",
    "TRIG": "触发条件",
    "VAL": "估值",
    "VALUE": "价值",
    "LAB": "实验室",
    "Mobile navigation": "移动端导航",
    "Main navigation": "主导航",
    # The header logo splits the brand into two text nodes.
    "Ticker": "Ticker",
    "Lantern": "Lantern",
}


def translated(value: str, translations: dict[str, str]) -> str | None:
    stripped_value = value.strip()
    if stripped_value in MANUAL:
        lead = value[: len(value) - len(value.lstrip())]
        trail = value[len(value.rstrip()):]
        return lead + MANUAL[stripped_value] + trail
    key = digest(value)
    found = translations.get(key)
    if found is None:
        # Whitespace around text nodes is presentation, not content.
        stripped = value.strip()
        if stripped != value:
            found = translations.get(digest(stripped))
            if found is not None:
                lead = value[: len(value) - len(value.lstrip())]
                trail = value[len(value.rstrip()):]
                return lead + postprocess(found) + trail
    return postprocess(found) if found is not None else None


def attr_snapshot(node: Tag) -> list[tuple[str, dict]]:
    return [(tag.name, dict(tag.attrs)) for tag in node.find_all(True)]


def restore_attrs(node: Tag, snapshot: list[tuple[str, dict]]) -> None:
    """Keeps machine translation from editing URLs, classes and other markup.

    Translatable attributes (title, alt, ...) are translated afterwards in
    apply_page, so every attribute is restored from the English source here.
    """
    current = node.find_all(True)
    if [tag.name for tag in current] == [name for name, _attrs in snapshot]:
        for tag, (_name, attrs) in zip(current, snapshot):
            tag.attrs = dict(attrs)
        return
    # A translation occasionally drops or merges an inline element. Restore
    # what can be matched by tag name, in order, without inventing elements.
    by_name: dict[str, list[dict]] = {}
    for name, attrs in snapshot:
        by_name.setdefault(name, []).append(attrs)
    for tag in current:
        queue = by_name.get(tag.name)
        tag.attrs = dict(queue.pop(0)) if queue else {}


def replace_contents(tag: Tag, value: str) -> None:
    snapshot = attr_snapshot(tag)
    tag.clear()
    fragment = BeautifulSoup(value, "html.parser")
    for child in list(fragment.contents):
        tag.append(child)
    restore_attrs(tag, snapshot)


def apply_to_body(root: Tag, translations: dict[str, str], missing: set[str]) -> None:
    def walk(node: Tag) -> None:
        if node.name in SKIP:
            return
        children = [child for child in node.children if isinstance(child, Tag)]
        has_block = any(child.name in BLOCK for child in children)
        if not has_block:
            inner = node.decode_contents()
            if meaningful(node.get_text(" ", strip=True)):
                found = translated(inner, translations)
                if found is None:
                    missing.add(inner)
                elif found != inner:
                    replace_contents(node, found)
            return
        for child in node.children:
            if isinstance(child, NavigableString):
                text = str(child)
                if meaningful(text):
                    found = translated(text, translations)
                    if found is None:
                        missing.add(text)
                    elif found != text:
                        child.replace_with(found)
            elif isinstance(child, Tag):
                walk(child)

    walk(root)

    # Inline markup sometimes makes the engine return a whole parent unit
    # unchanged even though the individual strings inside it are translated.
    # Revisit every remaining text node so no English fragment is left behind.
    for node in list(root.find_all(string=True)):
        parent = node.parent
        if not parent or parent.name in SKIP:
            continue
        text = str(node)
        if not meaningful(text):
            continue
        found = translated(text, translations)
        if found is not None and found != text:
            node.replace_with(found)


def apply_page(path: str, translations: dict[str, str], missing: set[str]) -> str:
    with open(path, encoding="utf-8") as handle:
        soup = BeautifulSoup(handle.read(), "lxml")

    if soup.body:
        apply_to_body(soup.body, translations, missing)

    for tag in soup.find_all(True):
        if tag.name in {"script", "style"}:
            continue
        for attr in ATTRS:
            value = tag.get(attr)
            if not isinstance(value, str) or not meaningful(value):
                continue
            found = translated(value, translations)
            if found is None:
                missing.add(value)
            elif found != value:
                tag[attr] = found

    if soup.title and soup.title.string:
        found = translated(soup.title.string, translations)
        if found is None:
            missing.add(soup.title.string)
        else:
            soup.title.string = found

    for key, name in HEAD_META:
        tag = soup.find("meta", attrs={key: name})
        if tag and tag.get("content") and meaningful(tag["content"]):
            found = translated(tag["content"], translations)
            if found is None:
                missing.add(tag["content"])
            else:
                tag["content"] = found

    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(script.string or "")
        except Exception:
            continue

        def patch(value):
            if isinstance(value, dict):
                out = {}
                for key, item in value.items():
                    if key in {"name", "headline", "description", "alternateName"} and isinstance(item, str):
                        out[key] = translated(item, translations) or item
                    else:
                        out[key] = patch(item)
                return out
            if isinstance(value, list):
                return [patch(item) for item in value]
            return value

        script.string = json.dumps(patch(data), ensure_ascii=False, separators=(",", ":"))

    return str(soup)


def extract() -> None:
    units = collect()
    WORK.mkdir(parents=True, exist_ok=True)
    payload = [{"id": key, "text": text} for key, text in sorted(units.items())]
    with open(WORK / "units.json", "w", encoding="utf-8") as handle:
        json.dump({"units": payload}, handle, ensure_ascii=False)
    print(f"pages: {sum(1 for _ in page_files())}; unique units: {len(payload)}")
    chars = sum(len(item["text"]) for item in payload)
    print(f"source characters: {chars:,}")


def apply() -> None:
    translations_path = WORK / "translations.json"
    if not translations_path.exists():
        raise SystemExit("Run the translation step first: " + str(translations_path))
    with open(translations_path, encoding="utf-8") as handle:
        translations = json.load(handle)["translations"]
    PAGES_OUT.mkdir(parents=True, exist_ok=True)
    missing: set[str] = set()
    count = 0
    for url, path in page_files():
        rendered = apply_page(path, translations, missing)
        if url == "/":
            target = PAGES_OUT / "index.html"
        elif url.endswith("/"):
            target = PAGES_OUT / url.strip("/") / "index.html"
        else:
            target = PAGES_OUT / (url.strip("/") + ".html")
        target.parent.mkdir(parents=True, exist_ok=True)
        with open(target, "w", encoding="utf-8") as handle:
            handle.write(rendered)
        count += 1
    meta = {
        "sourceRevision": subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", "HEAD"], text=True).strip(),
        "pages": count,
        "translatedUnits": len(translations),
        "missingUnits": len(missing),
    }
    with open(OUT / "meta.json", "w", encoding="utf-8") as handle:
        json.dump(meta, handle, indent=2)
    print(f"wrote {count} pages; missing {len(missing)} units")
    if missing:
        with open(WORK / "missing.json", "w", encoding="utf-8") as handle:
            json.dump(sorted(missing), handle, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    stage = sys.argv[1] if len(sys.argv) > 1 else "extract"
    if stage == "extract":
        extract()
    elif stage == "apply":
        apply()
    else:
        raise SystemExit("stage must be extract or apply")
