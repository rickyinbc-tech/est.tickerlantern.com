#!/usr/bin/env python3
"""Rejects translations whose numbers disagree with the English source.

Run after translate.mjs and before catalog.py apply. Rejected units keep the
English source in both the translation memory (cache.json) and the apply input
(work/translations.json), so pages, runtime dictionaries and the search index
all fall back to English for them. Rejections are listed in work/rejected.json
for review.
"""
import json
from pathlib import Path

from numguard import numbers_agree

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "src/locales/zh/cache.json"
TRANSLATIONS = ROOT / "src/locales/zh/work/translations.json"
REJECTED = ROOT / "src/locales/zh/work/rejected.json"

cache = json.loads(CACHE.read_text())
translations = json.loads(TRANSLATIONS.read_text())
rejected = []
for key, entry in cache.items():
    src, zh = entry.get("src", ""), entry.get("zh", "")
    if not src or not zh or zh == src or numbers_agree(src, zh):
        continue
    rejected.append({"src": src, "zh": zh})
    entry["zh"] = src
    if key[:32] in translations["translations"]:
        translations["translations"][key[:32]] = src

CACHE.write_text(json.dumps(cache, ensure_ascii=False, separators=(",", ":")))
TRANSLATIONS.write_text(json.dumps(translations, ensure_ascii=False, separators=(",", ":")))
REJECTED.write_text(json.dumps(rejected, ensure_ascii=False, indent=1))
print(f"numeric guard: kept English for {len(rejected)} of {len(cache)} units")
