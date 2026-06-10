export interface Student {
  id: string;
  studentNo: string;
  name: string;
  classNo?: string;
  scienceGroup?: string;
  bonusPoints?: number;
  gender?: string;
  segmentScore?: number | null;
}

export interface Group {
  id: string;
  name: string;
  published: boolean;
  updatedAt?: string;
}

export interface SeatCoord {
  r: number;
  c: number;
}

export interface SeatingState {
  rows: number;
  cols: number;
  blocked: string[];
  fixed: Record<string, string>;
  draft: Record<string, string>;
  assignments: Record<string, string>;
  absent: string[];
  bonus: Record<string, number>;
  published: boolean;
  updatedAt?: string;
}

export type EditMode = "block" | "fix";
export type FixSubMode = "draft" | "lock";
export type ViewMode = "edit" | "result";

export function coordKey(r: number, c: number): string {
  return `${r},${c}`;
}

export function parseCoord(key: string): SeatCoord | null {
  const [r, c] = key.split(",").map(Number);
  if (Number.isNaN(r) || Number.isNaN(c)) return null;
  return { r, c };
}
