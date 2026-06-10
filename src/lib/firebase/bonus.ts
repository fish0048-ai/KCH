import {
  doc,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/config";
import type { Student } from "@/types/seating";

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function formatTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export type BonusSource = "seat" | "lottery" | "batch";

export async function recordBonus(
  groupId: string,
  groupName: string,
  student: Student,
  delta: number,
  source: BonusSource,
  sessionTotal: number,
): Promise<void> {
  if (delta === 0) return;

  const db = getFirestoreDb();
  const now = new Date();
  const date = formatDate(now);
  const time = formatTime(now);
  const logId = `${date}-${time}-${student.id}-${now.getTime()}`.replace(/[\/:\s]/g, "-");

  const batch = writeBatch(db);
  batch.set(doc(db, "groups", groupId, "bonusLogs", logId), {
    groupId,
    groupName,
    studentId: student.id,
    classNo: student.classNo ?? null,
    studentNo: student.studentNo,
    name: student.name,
    bonus: delta,
    date,
    time,
    source,
    sessionTotal,
    createdAt: serverTimestamp(),
  });
  batch.set(
    doc(db, "groups", groupId, "students", student.id),
    { bonusPoints: increment(delta) },
    { merge: true },
  );
  await batch.commit();
}

export async function syncSessionBonuses(
  groupId: string,
  groupName: string,
  students: Student[],
  sessionBonus: Record<string, number>,
): Promise<number> {
  let count = 0;
  for (const [studentId, total] of Object.entries(sessionBonus)) {
    if (!total) continue;
    const student = students.find((s) => s.id === studentId);
    if (!student) continue;
    const step = total > 0 ? 1 : -1;
    const times = Math.abs(total);
    for (let i = 0; i < times; i += 1) {
      const running = step * (i + 1);
      await recordBonus(groupId, groupName, student, step, "batch", running);
      count += 1;
    }
  }
  return count;
}
