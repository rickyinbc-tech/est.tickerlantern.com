"""Reconcile the published extract with both retained original public StatCan CSVs."""
import csv
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "qa/debt-income"
module = (ROOT / "src/planning-debt-income-data.js").as_uri()
published = json.loads(subprocess.check_output([
    "node", "--input-type=module", "-e",
    f"import {{householdDebtSource as source,householdDebtRows as rows}} from {json.dumps(module)}; console.log(JSON.stringify({{source,rows}}));",
], text=True))
source = published["source"]
expected = {r["refDate"]: r for r in published["rows"]}
assert len(expected) == 12 and list(expected) == sorted(expected)
observed = {}
for table, filename in [("debt", "38100238.csv"), ("income", "36100112.csv")]:
    path = SOURCE_DIR / filename
    assert hashlib.sha256(path.read_bytes()).hexdigest() == source[table + "CsvSha256"], "Different source vintage; review both tables before updating."
    series = {v["label"]: (k, v) for k, v in source["series"].items() if v["source"] == table}
    with path.open(encoding="utf-8-sig", newline="") as original:
        for row in csv.DictReader(original):
            dimension = "Categories" if table == "debt" else "Estimates"
            if row["GEO"] != "Canada" or row["REF_DATE"] not in expected or row[dimension] not in series:
                continue
            key, spec = series[row[dimension]]
            if table == "income" and row["Seasonal adjustment"] != spec["seasonal_adjustment"]:
                continue
            assert row["DGUID"] == "2016A000011124"
            for csv_key, spec_key in [("VECTOR", "vector"), ("COORDINATE", "coordinate"), ("UOM", "uom"), ("UOM_ID", "uom_id"), ("SCALAR_FACTOR", "scalar"), ("SCALAR_ID", "scalar_id"), ("DECIMALS", "decimals")]:
                assert row[csv_key] == spec[spec_key], (key, csv_key)
            assert not any(row[k] for k in ["STATUS", "SYMBOL", "TERMINATED"])
            identity = row["REF_DATE"], key
            assert identity not in observed, "Duplicate source row."
            observed[identity] = Decimal(row["VALUE"])
            assert observed[identity] == Decimal(str(expected[row["REF_DATE"]][key])), identity
assert len(observed) == 84
for date in expected:
    debt, consumer, other, mortgage, income, ratio = [observed[date, k] for k in ["debt", "consumer", "nonMortgage", "mortgage", "income", "ratio"]]
    assert debt == consumer + other + mortgage
    assert (100 * debt / income).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) == ratio
print(json.dumps({"quarters": 12, "originalSourceRowsChecked": 84, "stockComponentChecks": 12, "roundedRatioChecks": 12, "publishedValuesMatchSource": True}))
