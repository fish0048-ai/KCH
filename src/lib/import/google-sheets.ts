const SPREADSHEET_ID = "1GzToDiDVuLfDZ4Y67BABloyaldCgqv1zwtoT7UNJnYs";

export interface SheetMeta {
  name: string;
  gid: string;
}

export interface SheetTable {
  name: string;
  gid: string;
  columns: string[];
  rows: string[][];
}

function cellValue(cell: unknown): string {
  if (!cell || typeof cell !== "object") return "";
  const c = cell as { f?: string; v?: string | number | null };
  if (c.f != null && c.f !== "") return String(c.f);
  if (c.v == null) return "";
  return String(c.v);
}

export async function listSheetTabs(): Promise<SheetMeta[]> {
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/htmlview`,
    { cache: "no-store" },
  );
  const html = await res.text();
  const matches = [...html.matchAll(/items\.push\(\{name: "([^"]+)", pageUrl: "[^"]+gid=(\d+)"/g)];
  return matches.map((m) => ({ name: m[1], gid: m[2] }));
}

export async function fetchSheetTable(gid: string, name: string): Promise<SheetTable> {
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`,
    { cache: "no-store" },
  );
  let raw = await res.text();
  raw = raw.replace(/^\/\*O_o\*\/\n/, "");
  raw = raw.replace(/^google\.visualization\.Query\.setResponse\(/, "").replace(/\);?\s*$/, "");
  const data = JSON.parse(raw) as {
    table: {
      cols: { label?: string }[];
      rows: { c?: ({ f?: string; v?: string | number } | null)[] }[];
    };
  };

  const columns = data.table.cols.map((c) => String(c.label ?? "").trim());
  const rows = data.table.rows.map((row) =>
    (row.c ?? []).map((cell) => cellValue(cell)),
  );

  return { name, gid, columns, rows };
}

export function columnIndex(columns: string[], ...aliases: string[]): number {
  const normalized = columns.map((c) => c.trim().toLowerCase().replace(/\s+/g, ""));
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias.toLowerCase().replace(/\s+/g, ""));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function slugifyGroupId(name: string): string {
  return name.trim().toLowerCase();
}

export const ROSTER_SHEETS = ["801A名單", "804A名單", "806B名單"] as const;
export const EXAM_SHEET_BY_GROUP: Record<string, string> = {
  "801A名單": "801A第二次段考",
  "804A名單": "804第二次段考",
  "806B名單": "806第二次段考",
};
