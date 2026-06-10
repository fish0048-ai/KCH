import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/config";
import type { Group, SeatingState, Student } from "@/types/seating";
import { createEmptySeating } from "@/lib/seating/logic";

function groupsCol() {
  return collection(getFirestoreDb(), "groups");
}

export async function listGroups(): Promise<Group[]> {
  const snap = await getDocs(groupsCol());
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: String(data.name ?? d.id),
      published: Boolean(data.published),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.(),
    };
  });
}

export function subscribeGroups(onData: (groups: Group[]) => void): Unsubscribe {
  return onSnapshot(groupsCol(), (snap) => {
    onData(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: String(data.name ?? d.id),
          published: Boolean(data.published),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.(),
        };
      }),
    );
  });
}

export async function listStudents(groupId: string): Promise<Student[]> {
  const snap = await getDocs(collection(getFirestoreDb(), "groups", groupId, "students"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      studentNo: String(data.studentNo ?? ""),
      name: String(data.name ?? ""),
      classNo: data.classNo ? String(data.classNo) : undefined,
      scienceGroup: data.scienceGroup ? String(data.scienceGroup) : undefined,
      bonusPoints:
        typeof data.bonusPoints === "number" ? data.bonusPoints : undefined,
      gender: data.gender ? String(data.gender) : undefined,
      segmentScore:
        typeof data.segmentScore === "number" ? data.segmentScore : null,
    };
  });
}

export function subscribeStudents(
  groupId: string,
  onData: (students: Student[]) => void,
): Unsubscribe {
  return onSnapshot(collection(getFirestoreDb(), "groups", groupId, "students"), (snap) => {
    onData(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          studentNo: String(data.studentNo ?? ""),
          name: String(data.name ?? ""),
          classNo: data.classNo ? String(data.classNo) : undefined,
          scienceGroup: data.scienceGroup ? String(data.scienceGroup) : undefined,
          bonusPoints:
            typeof data.bonusPoints === "number" ? data.bonusPoints : undefined,
          gender: data.gender ? String(data.gender) : undefined,
          segmentScore:
            typeof data.segmentScore === "number" ? data.segmentScore : null,
        };
      }),
    );
  });
}

export async function getSeatingState(groupId: string): Promise<SeatingState> {
  const ref = doc(getFirestoreDb(), "groups", groupId, "seating", "current");
  const snap = await getDoc(ref);
  if (!snap.exists()) return createEmptySeating();
  return snap.data() as SeatingState;
}

export function subscribeSeating(
  groupId: string,
  onData: (state: SeatingState) => void,
): Unsubscribe {
  const ref = doc(getFirestoreDb(), "groups", groupId, "seating", "current");
  return onSnapshot(ref, (snap) => {
    onData(snap.exists() ? (snap.data() as SeatingState) : createEmptySeating());
  });
}

export async function saveSeatingState(
  groupId: string,
  state: SeatingState,
): Promise<void> {
  const ref = doc(getFirestoreDb(), "groups", groupId, "seating", "current");
  await setDoc(
    ref,
    { ...state, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}

export async function publishSeating(groupId: string, published: boolean): Promise<void> {
  const batch = writeBatch(getFirestoreDb());
  const groupRef = doc(getFirestoreDb(), "groups", groupId);
  const seatingRef = doc(getFirestoreDb(), "groups", groupId, "seating", "current");
  batch.set(
    groupRef,
    { published, updatedAt: serverTimestamp() },
    { merge: true },
  );
  batch.set(seatingRef, { published }, { merge: true });
  await batch.commit();
}

export async function upsertGroup(groupId: string, name: string): Promise<void> {
  await setDoc(
    doc(getFirestoreDb(), "groups", groupId),
    { name, published: false, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function importStudents(
  groupId: string,
  groupName: string,
  students: Omit<Student, "id">[],
): Promise<void> {
  const batch = writeBatch(getFirestoreDb());
  batch.set(
    doc(getFirestoreDb(), "groups", groupId),
    { name: groupName, updatedAt: serverTimestamp() },
    { merge: true },
  );
  students.forEach((student, index) => {
    const id =
      student.classNo && student.studentNo
        ? `${student.classNo}-${student.studentNo}`
        : student.studentNo || `student-${index + 1}`;
    batch.set(doc(getFirestoreDb(), "groups", groupId, "students", id), {
      studentNo: student.studentNo,
      name: student.name,
      classNo: student.classNo ?? null,
      scienceGroup: student.scienceGroup ?? null,
      bonusPoints: student.bonusPoints ?? null,
      gender: student.gender ?? null,
      segmentScore: student.segmentScore ?? null,
    });
  });
  await batch.commit();
}

export async function getPublishedSeatingBundle(groupId: string): Promise<{
  group: Group | null;
  students: Student[];
  seating: SeatingState | null;
}> {
  const groupSnap = await getDoc(doc(getFirestoreDb(), "groups", groupId));
  if (!groupSnap.exists()) {
    return { group: null, students: [], seating: null };
  }
  const groupData = groupSnap.data();
  const group: Group = {
    id: groupId,
    name: String(groupData.name ?? groupId),
    published: Boolean(groupData.published),
  };
  if (!group.published) {
    return { group, students: [], seating: null };
  }
  const [students, seating] = await Promise.all([
    listStudents(groupId),
    getSeatingState(groupId),
  ]);
  if (!seating.published) {
    return { group, students: [], seating: null };
  }
  return { group, students, seating };
}
