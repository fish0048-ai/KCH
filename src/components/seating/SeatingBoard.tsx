"use client";

import { coordKey, type LotteryPhase, type SeatingState, type Student } from "@/types/seating";
import { resolveSeatStudentId, studentMap } from "@/lib/seating/logic";

interface SeatingBoardProps {
  state: SeatingState;
  students: Student[];
  mode: "edit" | "result";
  studentView?: boolean;
  absentMode?: boolean;
  bonusMode?: boolean;
  showScores?: boolean;
  projection?: boolean;
  classroomFit?: boolean;
  selectedSeat?: string | null;
  highlightStudentId?: string | null;
  lotteryPhase?: LotteryPhase | null;
  lotteryPanel?: React.ReactNode;
  onSeatClick?: (key: string) => void;
}

function seatVisualClass(
  key: string,
  state: SeatingState,
  hasStudent: boolean,
  mode: "edit" | "result",
  studentView: boolean,
): string {
  if (state.blocked.includes(key)) return "seat-tile seat-blocked";
  if (!hasStudent) return "seat-tile seat-empty";
  if (state.absent.includes(key)) return "seat-tile seat-absent";
  if (!studentView && mode === "edit" && state.fixed[key]) return "seat-tile seat-fixed";
  if (!studentView && mode === "edit" && state.draft[key]) return "seat-tile seat-draft";
  if (!studentView && mode === "result" && state.fixed[key] && !state.assignments[key]) {
    return "seat-tile seat-fixed";
  }
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
  projection = false,
  classroomFit = false,
  selectedSeat,
  highlightStudentId,
  lotteryPhase,
  lotteryPanel,
  onSeatClick,
}: SeatingBoardProps) {
  const map = studentMap(students);
  const { rows, cols } = state;
  const minSeat = classroomFit ? 52 : projection ? 88 : 58;
  const fitClass = classroomFit ? "classroom-board" : projection ? "projection-board" : "card p-5 sm:p-6";

  const grid = (
    <div
      className={`mx-auto grid ${classroomFit ? "gap-1.5 classroom-grid" : projection ? "gap-3" : "gap-2"}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(${minSeat}px, 1fr))` }}
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
            const key = coordKey(r, c);
            const studentId = resolveSeatStudentId(state, key, mode);
            const student = studentId ? map.get(studentId) : undefined;
            const bonus = studentId ? state.bonus[studentId] ?? 0 : 0;
            const isSelected = selectedSeat === key;
            const isLotteryTarget =
              Boolean(highlightStudentId && studentId === highlightStudentId && lotteryPhase);
            const interactive = !studentView && !state.blocked.includes(key);

            return (
              <button
                key={key}
                type="button"
                disabled={studentView || state.blocked.includes(key)}
                onClick={() => onSeatClick?.(key)}
                className={`${seatVisualClass(key, state, Boolean(student), mode, studentView)} ${
                  classroomFit ? "seat-tile-classroom" : projection ? "seat-tile-projection" : ""
                } ${interactive ? "seat-tile-interactive" : ""} ${isSelected ? "seat-selected" : ""} ${
                  isLotteryTarget && lotteryPhase === "spinning" ? "seat-lottery-spin" : ""
                } ${isLotteryTarget && lotteryPhase === "revealed" ? "seat-lottery-winner" : ""} ${
                  absentMode && interactive ? "ring-1 ring-slate-300" : ""
                } ${bonusMode && student && interactive ? "ring-1 ring-amber-300" : ""}`}
                aria-label={student ? `${student.name} 座位` : `空位 ${r + 1}-${c + 1}`}
              >
                {state.blocked.includes(key) ? (
                  <span className="text-lg font-light">✕</span>
                ) : student ? (
                  <>
                    <span
                      className={`max-w-full truncate px-1 font-bold ${
                        classroomFit ? "text-[11px] sm:text-xs" : projection ? "text-base sm:text-lg" : "text-xs"
                      }`}
                    >
                      {student.name}
                    </span>
                    {student.classNo && student.studentNo ? (
                      <span className={projection ? "text-xs text-[var(--ink-muted)]" : "text-[10px] text-[var(--ink-muted)]"}>
                        {student.classNo}-{student.studentNo}
                      </span>
                    ) : student.studentNo ? (
                      <span className={projection ? "text-xs text-[var(--ink-muted)]" : "text-[10px] text-[var(--ink-muted)]"}>
                        {student.studentNo}
                      </span>
                    ) : null}
                    {showScores && student.segmentScore != null ? (
                      <span
                        className={`mt-0.5 rounded-full bg-white/70 font-bold text-[var(--brand)] ${
                          projection ? "px-2 text-xs" : "px-1.5 text-[10px]"
                        }`}
                      >
                        {student.segmentScore}
                      </span>
                    ) : null}
                    {bonus !== 0 ? (
                      <span
                        className={`absolute rounded-full bg-[var(--accent)] font-bold text-white shadow ${
                          projection
                            ? "-right-2 -top-2 px-2.5 py-1 text-sm"
                            : "-right-1.5 -top-1.5 px-1.5 py-0.5 text-[10px]"
                        }`}
                      >
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
  );

  const podium = (
    <div
      className={
        classroomFit
          ? "podium podium-bottom podium-classroom"
          : projection
            ? "podium podium-bottom podium-projection"
            : "podium podium-bottom"
      }
    >
      講台
    </div>
  );

  return (
    <div className={`seating-board ${fitClass}`}>
      {classroomFit ? (
        <>
          <div className="classroom-grid-area">{grid}</div>
          <div className="classroom-board-footer">
            {lotteryPanel}
            {podium}
          </div>
        </>
      ) : (
        <>
          {grid}
          {lotteryPanel}
          {podium}
        </>
      )}
    </div>
  );
}
