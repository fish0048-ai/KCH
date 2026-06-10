import type { Student } from "@/types/seating";

export interface CsvImportRow {
  groupId: string;
  groupName: string;
  studentNo: string;
  name: string;
  classNo?: string;
  scienceGroup?: string;
  bonusPoints?: number;
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

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex((h) => aliases.some((a) => normalizeHeader(a) === h));
}

function slugifyGroupId(name: string): string {
  return name.trim().toLowerCase();
}

export interface ParseStudentCsvOptions {
  /** 對應試算表分頁名，例如 801A名單 */
  defaultGroupName?: string;
}

export function parseStudentCsv(
  text: string,
  options: ParseStudentCsvOptions = {},
): CsvImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const rawHeader = parseCsvLine(lines[0]);
  const idx = {
    groupId: findColumnIndex(rawHeader, ["groupid", "分組id", "班級id"]),
    groupName: findColumnIndex(rawHeader, [
      "groupname",
      "分組名稱",
      "分組",
      "組別",
      "名單",
    ]),
    scienceGroup: findColumnIndex(rawHeader, ["自然分組", "sciencegroup"]),
    classNo: findColumnIndex(rawHeader, ["班級", "class", "classno"]),
    studentNo: findColumnIndex(rawHeader, ["studentno", "學號", "座號"]),
    name: findColumnIndex(rawHeader, ["name", "姓名"]),
    bonus: findColumnIndex(rawHeader, ["加分", "bonus"]),
    gender: findColumnIndex(rawHeader, ["gender", "性別"]),
    segmentScore: findColumnIndex(rawHeader, [
      "segmentscore",
      "段考成績",
      "平時成績",
      "成績",
    ]),
  };

  if (idx.name < 0) {
    throw new Error("CSV 需包含「姓名」欄位");
  }

  const hasExplicitGroup = idx.groupName >= 0;
  const fallbackGroupName = options.defaultGroupName?.trim();
  if (!hasExplicitGroup && !fallbackGroupName) {
    throw new Error("請在匯入區塊填寫分組名稱（例如 801A名單），或 CSV 包含分組欄位");
  }

  const rows: CsvImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = cols[idx.name] ?? "";
    if (!name) continue;

    const groupName = hasExplicitGroup
      ? cols[idx.groupName] ?? ""
      : fallbackGroupName!;
    if (!groupName) continue;

    const groupId =
      (idx.groupId >= 0 ? cols[idx.groupId] : "") || slugifyGroupId(groupName);
    const bonusRaw = idx.bonus >= 0 ? cols[idx.bonus] : "";
    const scoreRaw = idx.segmentScore >= 0 ? cols[idx.segmentScore] : "";

    rows.push({
      groupId,
      groupName,
      studentNo: idx.studentNo >= 0 ? cols[idx.studentNo] ?? "" : "",
      name,
      classNo: idx.classNo >= 0 ? cols[idx.classNo] : undefined,
      scienceGroup: idx.scienceGroup >= 0 ? cols[idx.scienceGroup] : undefined,
      bonusPoints: bonusRaw ? Number(bonusRaw) : undefined,
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
      classNo: row.classNo,
      scienceGroup: row.scienceGroup,
      bonusPoints: row.bonusPoints,
      gender: row.gender,
      segmentScore: row.segmentScore ?? null,
    });
    map.set(row.groupId, bucket);
  });
  return map;
}
