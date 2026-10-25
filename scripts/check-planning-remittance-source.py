"""Verify the small public FCAC case extract against a saved official HTML page."""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys


class CaseTable(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.row = None
        self.cell = None
        self.text = []

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.row = []
        if tag in ("td", "th") and self.row is not None:
            self.cell = []

    def handle_data(self, data):
        self.text.append(data)
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cell is not None:
            self.row.append(" ".join("".join(self.cell).split()))
            self.cell = None
        if tag == "tr" and self.row is not None:
            self.rows.append(self.row)
            self.row = None


def verify(source_path):
    root = Path(__file__).resolve().parents[1]
    content = Path(source_path).read_bytes()
    parser = CaseTable()
    parser.feed(content.decode("utf-8"))
    text = " ".join(" ".join(parser.text).split())
    assert "June 23, 2026" in text, "Quote-date context changed"
    assert "2026-10-23" in text, "Publication-date context changed"
    data = json.loads(subprocess.check_output([
        "node", "--input-type=module", "-e",
        "import {remittanceCase} from './src/planning-payment-options-data.js';console.log(JSON.stringify(remittanceCase));",
    ], cwd=root, text=True))
    table = [r for r in parser.rows if len(r) == 4]
    assert any(all(item in " ".join(r) for item in ["Big Six bank", "Fintech A", "Fintech B"]) for r in table), "Provider columns changed"

    def numbers(prefix):
        rows = [r for r in table if r[0].startswith(prefix)]
        assert len(rows) == 1, (prefix, "missing or repeated")
        return [float(re.sub(r"[^0-9.-]", "", c)) for c in rows[0][1:]]

    assert numbers("Amount received by payee") == [data["recipientUSD"]] * 3
    assert numbers("Transfer fee") == [r["fee"] for r in data["rows"]]
    assert numbers("Estimated currency conversion markup") == [r["markup"] for r in data["rows"]]
    assert numbers("Total cost of 1 transfer") == [round(r["fee"] + r["markup"], 2) for r in data["rows"]]
    receipt = {"source": data["url"], "quoted": data["quoted"], "published": data["published"], "reviewed": data["reviewed"], "sha256": hashlib.sha256(content).hexdigest(), "providers": len(data["rows"]), "verified": True}
    print(json.dumps(receipt, indent=2))
    return receipt


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 scripts/check-planning-remittance-source.py saved-source.html")
    verify(sys.argv[1])
