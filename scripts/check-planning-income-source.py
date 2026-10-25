"""Validate the seven published CIS observations against the original table ZIP."""
import csv
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import zipfile


def verify(path):
    root = Path(__file__).resolve().parents[1]
    snapshot = json.loads(subprocess.check_output([
        "node", "--input-type=module", "-e",
        "import {income2024} from './src/planning-rate-benchmarks-data.js';console.log(JSON.stringify(income2024));",
    ], cwd=root, text=True))
    content = Path(path).read_bytes()
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        assert {"11100190.csv", "11100190_MetaData.csv"}.issubset(archive.namelist())
        metadata = archive.read("11100190_MetaData.csv").decode("utf-8-sig")
        assert "A - Excellent (CV between 0% and 2%)" in metadata
        with archive.open("11100190.csv") as handle:
            rows = csv.DictReader(io.TextIOWrapper(handle, encoding="utf-8-sig"))
            candidates = [r for r in rows if r["REF_DATE"] == str(snapshot["year"]) and r["GEO"] == snapshot["geography"] and r["Income concept"] == snapshot["concept"]]
    requested = snapshot["units"] + snapshot["ageGroups"]
    assert len({r["source"] for r in requested}) == len(requested)
    assert len({r["vector"] for r in requested}) == len(requested)
    for expected in requested:
        matched = [r for r in candidates if r["Economic family type"] == expected["source"]]
        assert len(matched) == 1, (expected["source"], "missing or duplicated")
        row = matched[0]
        assert row["UOM"] == snapshot["unit"] and row["SCALAR_FACTOR"] == "units"
        assert row["STATUS"] == expected["quality"] and not row["SYMBOL"] and not row["TERMINATED"]
        assert row["VECTOR"] == expected["vector"]
        assert float(row["VALUE"]) == expected["value"]
    receipt = {"source": snapshot["url"], "release": snapshot["released"], "reference_year": snapshot["year"], "reviewed": snapshot["reviewed"], "unit": snapshot["unit"], "geography": snapshot["geography"], "sha256": hashlib.sha256(content).hexdigest(), "observations_verified": len(requested), "quality": "A; exact CVs and numeric confidence intervals are not provided in this extract", "verified": True}
    print(json.dumps(receipt, indent=2))
    return receipt


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 scripts/check-planning-income-source.py source-table.zip")
    verify(sys.argv[1])
