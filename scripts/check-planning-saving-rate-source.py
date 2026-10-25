"""Check the published saving-rate extract against retained original StatCan CSV bytes."""
import csv
import hashlib
import json
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "qa/saving-rate/36100112.csv"
module = (ROOT / "src/planning-saving-rate-data.js").as_uri()
published = json.loads(subprocess.check_output([
    "node", "--input-type=module", "-e",
    f"import {{householdSavingSource as source,householdSavingRows as rows}} from {json.dumps(module)}; console.log(JSON.stringify({{source,rows}}));",
], text=True))
assert hashlib.sha256(CSV_PATH.read_bytes()).hexdigest() == published["source"]["sourceCsvSha256"], "Source vintage differs; re-review the complete extract."
MEASURES = {
    "Household saving rate": ("rate", "v62305984", "1.1.33", "Percent", "units", "1"),
    "Household disposable income": ("income", "v62305981", "1.1.30", "Dollars", "millions", "0"),
    "Less: household final consumption expenditure": ("consumption", "v62305982", "1.1.31", "Dollars", "millions", "0"),
    "Plus: change in pension entitlements": ("pension", "v105775422", "1.1.48", "Dollars", "millions", "0"),
    "Equals: household net saving": ("saving", "v62305983", "1.1.32", "Dollars", "millions", "0"),
}
expected = {row["refDate"]: row for row in published["rows"]}
assert len(expected) == 12 and list(expected) == sorted(expected)
observed = {}
with CSV_PATH.open(encoding="utf-8-sig", newline="") as source:
    for row in csv.DictReader(source):
        if row["GEO"] != "Canada" or row["Seasonal adjustment"] != "Seasonally adjusted at annual rates" or row["Estimates"] not in MEASURES or row["REF_DATE"] not in expected:
            continue
        key, *dimensions = MEASURES[row["Estimates"]]
        assert tuple(row[k] for k in ["VECTOR", "COORDINATE", "UOM", "SCALAR_FACTOR", "DECIMALS"]) == tuple(dimensions)
        assert row["DGUID"] == "2016A000011124"
        assert not any(row[k] for k in ["STATUS", "SYMBOL", "TERMINATED"])
        identity = row["REF_DATE"], key
        assert identity not in observed, "Duplicate source dimension."
        observed[identity] = Decimal(row["VALUE"])
        assert observed[identity] == Decimal(str(expected[row["REF_DATE"]][key])), identity
assert len(observed) == 60
for date in expected:
    income, consumption, pension, saving, rate = [observed[date, key] for key in ["income", "consumption", "pension", "saving", "rate"]]
    assert income - consumption + pension == saving
    assert (100 * saving / income).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP) == rate
print(json.dumps({"quarters": 12, "originalSourceRowsChecked": 60, "identityChecks": 12, "roundedRateChecks": 12, "publishedValuesMatchSource": True}))
