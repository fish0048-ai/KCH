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

export type LotteryPhase = "idle" | "spinning" | "revealed";

export interface LiveLottery {
  open: boolean;
  phase: LotteryPhase;
  studentId?: string;
  updatedAt?: string;
}

export interface LiveBonusFlash {
  studentId: string;
  name: string;
  delta: number;
  sessionTotal: number;
  at: string;
}

export interface LiveSession {
  lottery?: LiveLottery;
  bonusFlash?: LiveBonusFlash | null;
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
  live?: LiveSession;
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
