import type { Student } from "@/types/seating";

export interface CsvImportRow {
  groupId: string;
  groupName: string;
  studentNo: string;
  name: string;
  gender?: string;
  segmentScore?: number | null;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

export function parseStudentCsv(text: string): CsvImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = {
    groupId: header.findIndex((h) => ["groupid", "分組id", "班級id"].includes(h)),
    groupName: header.findIndex((h) => ["groupname", "分組", "班級", "組別"].includes(h)),
    studentNo: header.findIndex((h) => ["studentno", "學號", "座號"].includes(h)),
    name: header.findIndex((h) => ["name", "姓名"].includes(h)),
    gender: header.findIndex((h) => ["gender", "性別"].includes(h)),
    segmentScore: header.findIndex((h) =>
      ["segmentscore", "段考成績", "成績"].includes(h),
    ),
  };

  if (idx.groupName < 0 || idx.name < 0) {
    throw new Error("CSV 需包含「班級/分組」與「姓名」欄位");
  }

  const rows: CsvImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const groupName = cols[idx.groupName] ?? "";
    const name = cols[idx.name] ?? "";
    if (!groupName || !name) continue;
    const groupId =
      (idx.groupId >= 0 ? cols[idx.groupId] : "") ||
      groupName.replace(/\s+/g, "-").toLowerCase();
    const scoreRaw = idx.segmentScore >= 0 ? cols[idx.segmentScore] : "";
    rows.push({
      groupId,
      groupName,
      studentNo: idx.studentNo >= 0 ? cols[idx.studentNo] ?? "" : "",
      name,
      gender: idx.gender >= 0 ? cols[idx.gender] : undefined,
      segmentScore: scoreRaw ? Number(scoreRaw) : null,
    });
  }
  return rows;
}

export function groupCsvRows(rows: CsvImportRow[]): Map<
  string,
  { groupName: string; students: Omit<Student, "id">[] }
> {
  const map = new Map<string, { groupName: string; students: Omit<Student, "id">[] }>();
  rows.forEach((row) => {
    const bucket = map.get(row.groupId) ?? { groupName: row.groupName, students: [] };
    bucket.students.push({
      studentNo: row.studentNo,
      name: row.name,
      gender: row.gender,
      segmentScore: row.segmentScore ?? null,
    });
    map.set(row.groupId, bucket);
  });
  return map;
}
