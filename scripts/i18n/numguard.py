"""Numeric guard for machine-translated units.

Machine translation rewrites English magnitudes into Chinese units (k → 千/万,
bn → 亿), and sometimes gets the scale wrong: "$9.5k" came back as
"9.5 万美元", a tenfold error. A translated unit is accepted only when every
quantity in the English source appears in the Chinese text with the same
value. Otherwise the English source is kept, which is never wrong, only
untranslated.
"""
from __future__ import annotations

import re
from collections import Counter

EN_SCALE = {
    "k": 1e3, "thousand": 1e3,
    "m": 1e6, "mn": 1e6, "mm": 1e6, "million": 1e6, "millions": 1e6,
    "b": 1e9, "bn": 1e9, "billion": 1e9, "billions": 1e9,
    "t": 1e12, "tn": 1e12, "trillion": 1e12,
}
EN_NUMBER = re.compile(
    r"(?<![A-Za-z0-9_.])(\d+(?:,\d{3})*(?:\.\d+)?|\.\d+)"
    r"(?:\s?(thousand|millions?|billions?|trillion)\b|(k|mn|mm|bn|tn|m|b|t)(?![A-Za-z]))?"
)
ZH_SCALE = (
    ("万亿", 1e12), ("千亿", 1e11), ("百亿", 1e10), ("十亿", 1e9), ("亿", 1e8),
    ("千万", 1e7), ("百万", 1e6), ("十万", 1e5), ("万", 1e4), ("千", 1e3),
)
ZH_NUMBER = re.compile(
    r"(?<![A-Za-z0-9_.])(\d+(?:,\d{3})*(?:\.\d+)?|\.\d+)\s?(?:(" + "|".join(s for s, _ in ZH_SCALE) + r")(?![瓦米克字卡焦兆赫]))?"
)
ZH_FACTOR = dict(ZH_SCALE)
# Small counts are often written as Chinese numerals: "year 2" → "第二年".
ZH_DIGITS = {"一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10}
ZH_NUMERAL = re.compile(r"十[一二三四五六七八九]?|[一二两三四五六七八九]十?")


def _value(number: str, factor: float) -> float:
    value = float(number.replace(",", "")) * factor
    return float(f"{value:.9g}")


TAG = re.compile(r"<[^>]*>")


def en_values(text: str) -> Counter:
    values = Counter()
    for match in EN_NUMBER.finditer(TAG.sub(" ", text)):
        word, suffix = match.group(2), match.group(3)
        scale = (word or suffix or "").lower()
        values[_value(match.group(1), EN_SCALE.get(scale, 1))] += 1
    return values


def zh_values(text: str) -> Counter:
    text = TAG.sub(" ", text)
    # Latin magnitudes such as "24k 美元" are kept as written.
    values = en_values(text)
    for match in ZH_NUMBER.finditer(text):
        factor = ZH_FACTOR.get(match.group(2) or "")
        if factor:
            values[_value(match.group(1), factor)] += 1
    for match in ZH_NUMERAL.finditer(text):
        numeral = match.group(0)
        if len(numeral) == 1:
            value = ZH_DIGITS[numeral]
        elif numeral[0] == "十":
            value = 10 + ZH_DIGITS[numeral[1]]
        else:
            value = ZH_DIGITS[numeral[0]] * 10
        values[float(value)] += 1
    return values


def numbers_agree(source: str, translation: str) -> bool:
    expected = en_values(source)
    if not expected:
        return True
    found = zh_values(translation)
    return all(found[value] >= count for value, count in expected.items())


def guard(source: str, translation: str | None) -> str | None:
    if translation is None:
        return None
    return translation if numbers_agree(source, translation) else source
