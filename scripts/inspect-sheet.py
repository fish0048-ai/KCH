import json
import re
import urllib.request
from pathlib import Path

SHEET_ID = "1GzToDiDVuLfDZ4Y67BABloyaldCgqv1zwtoT7UNJnYs"
OUT = Path(__file__).resolve().parents[1] / "docs" / "spreadsheet-structure.json"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req).read().decode("utf-8", "replace")


def load_sheet(gid: str) -> dict:
    raw = fetch(
        f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&gid={gid}"
    )
    raw = raw.lstrip("/*O_o*/\n")
    raw = re.sub(r"^google\.visualization\.Query\.setResponse\(", "", raw)
    raw = raw.rstrip(");\n")
    return json.loads(raw)


html = fetch(f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/htmlview")
items = re.findall(
    r'items\.push\(\{name: "([^"]+)", pageUrl: "[^"]+gid=(\d+)"',
    html,
)

result = {"spreadsheetId": SHEET_ID, "title": "八年級分組名單", "sheets": []}
for name, gid in items:
    data = load_sheet(gid)
    cols = [c.get("label", "") for c in data["table"]["cols"]]
    sample_rows = []
    for row in data["table"]["rows"][:5]:
        vals = []
        for cell in row.get("c", []) or []:
            if not cell:
                vals.append("")
            else:
                vals.append(str(cell.get("f") or cell.get("v") or ""))
        sample_rows.append(vals)
    result["sheets"].append(
        {
            "name": name,
            "gid": gid,
            "columns": [c for c in cols if c],
            "sampleRows": sample_rows,
            "totalRows": len(data["table"]["rows"]),
        }
    )

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {len(items)} sheets to {OUT}")
