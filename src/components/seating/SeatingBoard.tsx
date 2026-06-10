"use client";

import { coordKey, type SeatingState, type Student } from "@/types/seating";
import { studentMap } from "@/lib/seating/logic";

interface SeatingBoardProps {
  state: SeatingState;
  students: Student[];
  mode: "edit" | "result";
  studentView?: boolean;
  absentMode?: boolean;
  bonusMode?: boolean;
  showScores?: boolean;
  selectedSeat?: string | null;
  onSeatClick?: (key: string) => void;
}

function seatVisualClass(
  key: string,
  state: SeatingState,
  hasStudent: boolean,
): string {
  if (state.blocked.includes(key)) return "seat-tile seat-blocked";
  if (!hasStudent && state.assignments[key] === undefined) return "seat-tile seat-empty";
  if (state.absent.includes(key)) return "seat-tile seat-absent";
  if (state.fixed[key]) return "seat-tile seat-fixed";
  if (state.draft[key]) return "seat-tile seat-draft";
  const parity = (key.charCodeAt(0) + Number(key.split(",")[1] ?? 0)) % 2;
  return parity === 0 ? "seat-tile seat-a" : "seat-tile seat-b";
}

export function SeatingBoard({
  state,
  students,
  mode,
  studentView = false,
  absentMode = false,
  bonusMode = false,
  showScores = false,
  selectedSeat,
  onSeatClick,
}: SeatingBoardProps) {
  const map = studentMap(students);
  const { rows, cols } = state;

  return (
    <div className="card overflow-auto p-5 sm:p-6">
      <div className="podium">講台</div>
      <div
        className="mx-auto grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(58px, 1fr))` }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const key = coordKey(r, c);
            const studentId =
              mode === "result"
                ? state.assignments[key]
                : state.fixed[key] || state.draft[key];
            const student = studentId ? map.get(studentId) : undefined;
            const bonus = studentId ? state.bonus[studentId] ?? 0 : 0;
            const isSelected = selectedSeat === key;
            const interactive = !studentView && !state.blocked.includes(key);

            return (
              <button
                key={key}
                type="button"
                disabled={studentView || state.blocked.includes(key)}
                onClick={() => onSeatClick?.(key)}
                className={`${seatVisualClass(key, state, Boolean(student))} ${
                  interactive ? "seat-tile-interactive" : ""
                } ${isSelected ? "seat-selected" : ""} ${
                  absentMode && interactive ? "ring-1 ring-slate-300" : ""
                } ${bonusMode && student && interactive ? "ring-1 ring-amber-300" : ""}`}
                aria-label={student ? `${student.name} 座位` : `空位 ${r + 1}-${c + 1}`}
              >
                {state.blocked.includes(key) ? (
                  <span className="text-lg font-light">✕</span>
                ) : student ? (
                  <>
                    <span className="max-w-full truncate px-1 text-xs font-bold">{student.name}</span>
                    {student.classNo && student.studentNo ? (
                      <span className="text-[10px] text-[var(--ink-muted)]">
                        {student.classNo}-{student.studentNo}
                      </span>
                    ) : student.studentNo ? (
                      <span className="text-[10px] text-[var(--ink-muted)]">{student.studentNo}</span>
                    ) : null}
                    {showScores && student.segmentScore != null ? (
                      <span className="mt-0.5 rounded-full bg-white/70 px-1.5 text-[10px] font-bold text-[var(--brand)]">
                        {student.segmentScore}
                      </span>
                    ) : null}
                    {bonus !== 0 ? (
                      <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                        {bonus > 0 ? `+${bonus}` : bonus}
                      </span>
                    ) : null}
                    {state.absent.includes(key) ? (
                      <span className="absolute left-1 top-1 rounded-md bg-slate-600 px-1 text-[9px] font-bold text-white">
                        缺
                      </span>
                    ) : null}
                  </>
                ) : mode === "edit" ? (
                  <span className="text-[10px] text-[#b7c3d1]">空</span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
