import { coordKey, parseCoord, type SeatingState, type Student } from "@/types/seating";

export function createEmptySeating(rows = 6, cols = 7): SeatingState {
  return {
    rows,
    cols,
    blocked: [],
    fixed: {},
    draft: {},
    assignments: {},
    absent: [],
    bonus: {},
    published: false,
  };
}

export function countAvailableSeats(state: SeatingState): number {
  const { rows, cols, blocked, fixed, draft } = state;
  const used = new Set([...Object.keys(fixed), ...Object.keys(draft)]);
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = coordKey(r, c);
      if (blocked.includes(key) || used.has(key)) continue;
      count++;
    }
  }
  return count;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 梅花座排序：由後往前、中間向兩側 */
export function plumBlossomOrder(rows: number, cols: number): string[] {
  const cc = (cols - 1) / 2;
  const coords: { key: string; aRow: number; aCol: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const aRow = rows - 1 - r;
      const aCol = Math.abs(c - cc);
      coords.push({ key: coordKey(r, c), aRow, aCol });
    }
  }
  coords.sort((a, b) => {
    if (a.aRow !== b.aRow) return a.aRow - b.aRow;
    if (a.aCol !== b.aCol) return a.aCol - b.aCol;
    const ac = parseCoord(a.key)!.c;
    const bc = parseCoord(b.key)!.c;
    return ac - bc;
  });
  return coords.map((x) => x.key);
}

export function generateSeating(
  state: SeatingState,
  students: Student[],
): Record<string, string> {
  const order = plumBlossomOrder(state.rows, state.cols);
  const result: Record<string, string> = { ...state.fixed };

  const assignedStudentIds = new Set(Object.values(state.fixed));
  const pool = students.filter((s) => !assignedStudentIds.has(s.id));

  const openSeats = order.filter((key) => {
    if (state.blocked.includes(key)) return false;
    if (state.fixed[key]) return false;
    if (state.draft[key]) return false;
    return true;
  });

  const shuffled = shuffle(pool);
  openSeats.forEach((key, index) => {
    const student = shuffled[index];
    if (student) result[key] = student.id;
  });

  return result;
}

export function swapAssignments(
  assignments: Record<string, string>,
  fromKey: string,
  toKey: string,
  blocked: string[],
): Record<string, string> {
  if (blocked.includes(fromKey) || blocked.includes(toKey)) return assignments;
  const next = { ...assignments };
  const fromStudent = next[fromKey];
  const toStudent = next[toKey];
  if (!fromStudent) return assignments;
  if (toStudent) {
    next[fromKey] = toStudent;
    next[toKey] = fromStudent;
  } else {
    delete next[fromKey];
    next[toKey] = fromStudent;
  }
  return next;
}

export function studentMap(students: Student[]): Map<string, Student> {
  return new Map(students.map((s) => [s.id, s]));
}
