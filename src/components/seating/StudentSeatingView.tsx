"use client";

import { useEffect, useState } from "react";
import { SeatingBoard } from "@/components/seating/SeatingBoard";
import { BonusFlashBanner } from "@/components/seating/BonusFlashBanner";
import { listGroups, subscribeSeating, subscribeStudents } from "@/lib/firebase/seating";
import type { Group, SeatingState, Student } from "@/types/seating";
import { createEmptySeating } from "@/lib/seating/logic";

interface StudentSeatingViewProps {
  initialGroupId?: string;
  projection?: boolean;
}

export function StudentSeatingView({
  initialGroupId,
  projection = false,
}: StudentSeatingViewProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState(initialGroupId ?? "");
  const [students, setStudents] = useState<Student[]>([]);
  const [state, setState] = useState<SeatingState>(createEmptySeating());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listGroups()
      .then((all) => {
        const published = all.filter((g) => g.published);
        setGroups(published);
        if (!groupId && published.length > 0) {
          setGroupId(initialGroupId ?? published[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [groupId, initialGroupId]);

  useEffect(() => {
    if (!groupId) return;
    const unsub1 = subscribeStudents(groupId, setStudents);
    const unsub2 = subscribeSeating(groupId, setState);
    return () => {
      unsub1();
      unsub2();
    };
  }, [groupId]);

  const currentGroup = groups.find((g) => g.id === groupId);
  const isPublished = Boolean(currentGroup?.published && state.published);
  const lottery = state.live?.lottery;
  const lotteryActive = Boolean(lottery?.open && lottery.phase !== "idle");

  if (loading) {
    return (
      <div className={`flex min-h-[200px] items-center justify-center text-sm text-[var(--ink-muted)] ${projection ? "" : "card"}`}>
        載入座位表中…
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={`p-10 text-center ${projection ? "" : "card"}`}>
        <div className="mx-auto mb-3 text-3xl">📋</div>
        <p className="text-sm text-[var(--ink-muted)]">目前尚無已公布的座位表，請等待教師公布。</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${projection ? "projection-shell" : ""}`}>
      {!projection ? (
        <div className="card flex flex-wrap items-center gap-3 p-4">
          <label className="text-sm font-bold text-[var(--ink)]" htmlFor="studentGroup">
            選擇班級
          </label>
          <select
            id="studentGroup"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="select w-auto min-w-[160px] font-semibold"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <span className="badge badge-muted">唯讀檢視</span>
        </div>
      ) : (
        <div className="projection-header">
          <h1 className="text-xl font-bold text-[var(--brand-dark)] sm:text-2xl">
            {currentGroup?.name ?? "座位表"}
          </h1>
          <span className="badge badge-brand">即時同步</span>
        </div>
      )}

      {isPublished ? (
        <div className="relative">
          <SeatingBoard
            state={state}
            students={students}
            mode="result"
            studentView
            projection={projection}
            highlightStudentId={lotteryActive ? lottery?.studentId : null}
            lotteryPhase={lotteryActive ? lottery?.phase : null}
          />
          <BonusFlashBanner flash={state.live?.bonusFlash} projection={projection} />
        </div>
      ) : (
        <div className="rounded-2xl border border-[#f0d49a] bg-[var(--accent-soft)] p-6 text-sm text-[#8a5a00]">
          此班級座位表尚未公布。
        </div>
      )}
    </div>
  );
}
