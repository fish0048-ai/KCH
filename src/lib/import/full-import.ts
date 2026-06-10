import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/config";
import type { SeatingState, Student } from "@/types/seating";
import {
  columnIndex,
  EXAM_SHEET_BY_GROUP,
  fetchSheetTable,
  listSheetTabs,
  ROSTER_SHEETS,
  slugifyGroupId,
  type SheetTable,
} from "@/lib/import/google-sheets";

export interface ImportProgress {
  step: string;
  detail?: string;
}

export interface ImportResult {
  groups: number;
  students: number;
  bonusLogs: number;
  seating: number;
  examRows: number;
}

interface LegacySeatStudent {
  name?: string;
  number?: string;
  class?: string | number;
  group?: string;
  score1?: number;
  score2?: number;
}

interface LegacySeatingJson {
  rows?: number;
  cols?: number;
  blocked?: string[];
  fixedSeats?: Record<string, LegacySeatStudent>;
  draft?: Record<string, LegacySeatStudent>;
  assignments?: Record<string, LegacySeatStudent>;
}

function studentDocId(classNo: string, studentNo: string): string {
  return `${classNo}-${studentNo}`;
}

function parseNumber(value: string): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseRoster(table: SheetTable) {
  const groupName = table.name;
  const groupId = slugifyGroupId(groupName);
  const iScience = columnIndex(table.columns, "自然分組");
  const iClass = columnIndex(table.columns, "班級");
  const iNo = columnIndex(table.columns, "座號");
  const iName = columnIndex(table.columns, "姓名");
  const iBonus = columnIndex(table.columns, "加分");

  const students: Omit<Student, "id">[] = [];
  for (const row of table.rows) {
    const name = row[iName] ?? "";
    const classNo = String(row[iClass] ?? "").trim();
    const studentNo = String(row[iNo] ?? "").trim();
    if (!name || !classNo || !studentNo) continue;
    students.push({
      studentNo,
      name,
      classNo,
      scienceGroup: iScience >= 0 ? row[iScience] : undefined,
      bonusPoints: iBonus >= 0 ? parseNumber(row[iBonus] ?? "") : undefined,
      segmentScore: null,
    });
  }
  return { groupId, groupName, students };
}

function parseExamScores(table: SheetTable) {
  const iClass = columnIndex(table.columns, "班級");
  const iNo = columnIndex(table.columns, "座號");
  const iName = columnIndex(table.columns, "姓名");
  const iDaily = columnIndex(table.columns, "平時成績");

  const scores = new Map<string, number>();
  const details: Record<string, Record<string, string | number>> = {};

  for (const row of table.rows) {
    const name = row[iName] ?? "";
    const classNo = String(row[iClass] ?? "").trim();
    const studentNo = String(row[iNo] ?? "").trim();
    if (!name || !classNo || !studentNo) continue;
    const key = studentDocId(classNo, studentNo);
    const daily = iDaily >= 0 ? parseNumber(row[iDaily] ?? "") : undefined;
    if (daily != null) scores.set(key, daily);

    const detail: Record<string, string | number> = { name, classNo, studentNo };
    table.columns.forEach((col, idx) => {
      const val = row[idx];
      if (val) detail[col] = parseNumber(val) ?? val;
    });
    details[key] = detail;
  }
  return { scores, details, examName: table.name };
}

function findStudentId(
  students: Omit<Student, "id">[],
  seat: LegacySeatStudent,
): string | null {
  const classNo = String(seat.class ?? "").trim();
  const studentNo = String(seat.number ?? "").trim();
  const name = String(seat.name ?? "").trim();
  if (!classNo || !studentNo) return null;

  const match = students.find(
    (s) =>
      s.classNo === classNo &&
      s.studentNo === studentNo &&
      (!name || s.name === name),
  );
  return match ? studentDocId(classNo, studentNo) : null;
}

function convertSeatingJson(
  json: LegacySeatingJson,
  students: Omit<Student, "id">[],
  published = true,
): SeatingState {
  const fixed: Record<string, string> = {};
  const assignments: Record<string, string> = {};
  const bonus: Record<string, number> = {};

  Object.entries(json.fixedSeats ?? {}).forEach(([coord, seat]) => {
    const id = findStudentId(students, seat);
    if (id) fixed[coord] = id;
  });

  Object.entries(json.assignments ?? {}).forEach(([coord, seat]) => {
    const id = findStudentId(students, seat);
    if (id) assignments[coord] = id;
  });

  students.forEach((s) => {
    if (s.bonusPoints && s.classNo && s.studentNo) {
      bonus[studentDocId(s.classNo, s.studentNo)] = s.bonusPoints;
    }
  });

  return {
    rows: json.rows ?? 6,
    cols: json.cols ?? 7,
    blocked: json.blocked ?? [],
    fixed,
    draft: {},
    assignments,
    absent: [],
    bonus,
    published,
    updatedAt: new Date().toISOString(),
  };
}

function parseBonusLogs(table: SheetTable) {
  const iDate = columnIndex(table.columns, "日期");
  const iTime = columnIndex(table.columns, "時間");
  const iGroup = columnIndex(table.columns, "分組");
  const iClass = columnIndex(table.columns, "班級");
  const iNo = columnIndex(table.columns, "座號");
  const iName = columnIndex(table.columns, "姓名");
  const iBonus = columnIndex(table.columns, "加分");

  return table.rows
    .map((row) => {
      const groupName = row[iGroup] ?? "";
      const classNo = String(row[iClass] ?? "").trim();
      const studentNo = String(row[iNo] ?? "").trim();
      const name = row[iName] ?? "";
      const bonus = parseNumber(row[iBonus] ?? "");
      if (!groupName || !classNo || !studentNo || !name || bonus == null) return null;
      return {
        groupId: slugifyGroupId(groupName),
        groupName,
        classNo,
        studentNo,
        name,
        bonus,
        date: row[iDate] ?? "",
        time: row[iTime] ?? "",
      };
    })
    .filter(Boolean) as {
    groupId: string;
    groupName: string;
    classNo: string;
    studentNo: string;
    name: string;
    bonus: number;
    date: string;
    time: string;
  }[];
}

async function commitBatch(ops: (batch: ReturnType<typeof writeBatch>) => void) {
  const batch = writeBatch(getFirestoreDb());
  ops(batch);
  await batch.commit();
}

export async function importAllFromGoogleSheets(
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportResult> {
  const db = getFirestoreDb();
  const tabs = await listSheetTabs();
  const tabByName = new Map(tabs.map((t) => [t.name, t.gid]));

  const result: ImportResult = {
    groups: 0,
    students: 0,
    bonusLogs: 0,
    seating: 0,
    examRows: 0,
  };

  const rosterData: {
    groupId: string;
    groupName: string;
    students: Omit<Student, "id">[];
  }[] = [];

  for (const sheetName of ROSTER_SHEETS) {
    const gid = tabByName.get(sheetName);
    if (!gid) continue;
    onProgress?.({ step: "讀取名單", detail: sheetName });
    const table = await fetchSheetTable(gid, sheetName);
    const parsed = parseRoster(table);
    rosterData.push(parsed);
  }

  const examScoresByGroup = new Map<string, Map<string, number>>();
  const examDetailsByGroup = new Map<string, Record<string, Record<string, string | number>>>();

  for (const [groupName, examSheetName] of Object.entries(EXAM_SHEET_BY_GROUP)) {
    const gid = tabByName.get(examSheetName);
    if (!gid) continue;
    onProgress?.({ step: "讀取段考", detail: examSheetName });
    const table = await fetchSheetTable(gid, examSheetName);
    const { scores, details } = parseExamScores(table);
    examScoresByGroup.set(slugifyGroupId(groupName), scores);
    examDetailsByGroup.set(slugifyGroupId(groupName), details);
    result.examRows += scores.size;
  }

  onProgress?.({ step: "寫入 Firestore", detail: "學生名單與成績" });
  for (const group of rosterData) {
    const examScores = examScoresByGroup.get(group.groupId);
    const examDetails = examDetailsByGroup.get(group.groupId);

    await commitBatch((batch) => {
      batch.set(
        doc(db, "groups", group.groupId),
        {
          name: group.groupName,
          scienceGroup: group.students[0]?.scienceGroup ?? null,
          published: true,
          updatedAt: serverTimestamp(),
          importedAt: serverTimestamp(),
        },
        { merge: true },
      );

      group.students.forEach((student) => {
        const id = studentDocId(student.classNo!, student.studentNo);
        const segmentScore = examScores?.get(id) ?? student.segmentScore ?? null;
        batch.set(
          doc(db, "groups", group.groupId, "students", id),
          {
            ...student,
            segmentScore,
            examDetail: examDetails?.[id] ?? null,
          },
          { merge: true },
        );
      });

      if (examDetails) {
        batch.set(
          doc(db, "groups", group.groupId, "exams", "second"),
          {
            name: EXAM_SHEET_BY_GROUP[group.groupName],
            details: examDetails,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    });

    result.groups += 1;
    result.students += group.students.length;
  }

  const seatingGid = tabByName.get("座位表");
  if (seatingGid) {
    onProgress?.({ step: "讀取座位表" });
    const seatingTable = await fetchSheetTable(seatingGid, "座位表");
    const iGroup = columnIndex(seatingTable.columns, "分組名稱");
    const iJson = columnIndex(seatingTable.columns, "JSON資料");

    for (const row of seatingTable.rows) {
      const groupName = row[iGroup] ?? "";
      const jsonRaw = row[iJson] ?? "";
      if (!groupName || !jsonRaw) continue;

      const groupId = slugifyGroupId(groupName);
      const roster = rosterData.find((g) => g.groupId === groupId);
      if (!roster) continue;

      let legacy: LegacySeatingJson;
      try {
        legacy = JSON.parse(jsonRaw) as LegacySeatingJson;
      } catch {
        continue;
      }

      const seating = convertSeatingJson(legacy, roster.students, true);
      await commitBatch((batch) => {
        batch.set(doc(db, "groups", groupId, "seating", "current"), seating, { merge: true });
        batch.set(
          doc(db, "groups", groupId),
          { published: true, updatedAt: serverTimestamp() },
          { merge: true },
        );
      });
      result.seating += 1;
    }
  }

  const bonusGid = tabByName.get("加分記錄");
  if (bonusGid) {
    onProgress?.({ step: "讀取加分記錄" });
    const bonusTable = await fetchSheetTable(bonusGid, "加分記錄");
    const logs = parseBonusLogs(bonusTable);

    let batch = writeBatch(db);
    let count = 0;
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const logId = `${log.date}-${log.time}-${log.classNo}-${log.studentNo}-${i}`
        .replace(/[\/:\s]/g, "-");
      batch.set(doc(db, "groups", log.groupId, "bonusLogs", logId), {
        ...log,
        studentId: studentDocId(log.classNo, log.studentNo),
        importedAt: serverTimestamp(),
      });
      count += 1;
      if (count >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
    result.bonusLogs = logs.length;
  }

  onProgress?.({ step: "完成" });
  return result;
}
