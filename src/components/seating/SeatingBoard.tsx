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

function seatClass(
  key: string,
  state: SeatingState,
  hasStudent: boolean,
  studentView: boolean,
): string {
  const classes = [
    "relative flex min-h-[52px] min-w-[52px] flex-col items-center justify-center rounded-lg border text-center transition",
  ];
  if (state.blocked.includes(key)) {
    classes.push("border-slate-300 bg-slate-200 text-slate-400");
    return classes.join(" ");
  }
  if (!hasStudent && state.assignments[key] === undefined) {
    classes.push("border-dashed border-slate-200 bg-white text-slate-300");
    return classes.join(" ");
  }
  if (state.absent.includes(key)) {
    classes.push("border-slate-400 bg-slate-100 text-slate-500 line-through");
  } else if (state.fixed[key]) {
    classes.push("border-amber-400 bg-amber-50 text-amber-900");
  } else if (state.draft[key]) {
    classes.push("border-blue-300 bg-blue-50 text-blue-900 border-dashed");
  } else {
    const parity = (key.charCodeAt(0) + Number(key.split(",")[1] ?? 0)) % 2;
    classes.push(
      parity === 0
        ? "border-blue-200 bg-blue-50 text-slate-800"
        : "border-violet-200 bg-violet-50 text-slate-800",
    );
  }
  if (!studentView) classes.push("cursor-pointer hover:scale-[1.02]");
  return classes.join(" ");
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
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-center text-xs font-semibold text-slate-500">講台</div>
      <div
        className="mx-auto grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(52px, 1fr))` }}
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

            return (
              <button
                key={key}
                type="button"
                disabled={studentView || state.blocked.includes(key)}
                onClick={() => onSeatClick?.(key)}
                className={`${seatClass(key, state, Boolean(student), studentView)} ${
                  isSelected ? "ring-2 ring-blue-500" : ""
                } ${absentMode && !state.blocked.includes(key) ? "hover:ring-2 hover:ring-slate-400" : ""} ${
                  bonusMode && student ? "hover:ring-2 hover:ring-amber-400" : ""
                }`}
                aria-label={student ? `${student.name} 座位` : `空位 ${r + 1}-${c + 1}`}
              >
                {state.blocked.includes(key) ? (
                  <span className="text-lg">✕</span>
                ) : student ? (
                  <>
                    <span className="max-w-full truncate px-1 text-xs font-bold">{student.name}</span>
                    {student.studentNo ? (
                      <span className="text-[10px] text-slate-500">{student.studentNo}</span>
                    ) : null}
                    {showScores && student.segmentScore != null ? (
                      <span className="text-[10px] text-blue-700">{student.segmentScore}</span>
                    ) : null}
                    {bonus !== 0 ? (
                      <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                        {bonus > 0 ? `+${bonus}` : bonus}
                      </span>
                    ) : null}
                    {state.absent.includes(key) ? (
                      <span className="absolute left-1 top-1 rounded bg-slate-500 px-1 text-[9px] text-white">
                        缺
                      </span>
                    ) : null}
                  </>
                ) : mode === "edit" ? (
                  <span className="text-[10px] text-slate-300">空</span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
