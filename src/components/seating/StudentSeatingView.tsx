"use client";

import { useEffect, useState } from "react";
import { SeatingBoard } from "@/components/seating/SeatingBoard";
import { listGroups, subscribeSeating, subscribeStudents } from "@/lib/firebase/seating";
import type { Group, SeatingState, Student } from "@/types/seating";
import { createEmptySeating } from "@/lib/seating/logic";

interface StudentSeatingViewProps {
  initialGroupId?: string;
}

export function StudentSeatingView({ initialGroupId }: StudentSeatingViewProps) {
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

  if (loading) {
    return (
      <div className="card flex min-h-[200px] items-center justify-center text-sm text-[var(--ink-muted)]">
        載入座位表中…
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="mx-auto mb-3 text-3xl">📋</div>
        <p className="text-sm text-[var(--ink-muted)]">目前尚無已公布的座位表，請等待教師公布。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {isPublished ? (
        <SeatingBoard state={state} students={students} mode="result" studentView />
      ) : (
        <div className="rounded-2xl border border-[#f0d49a] bg-[var(--accent-soft)] p-6 text-sm text-[#8a5a00]">
          此班級座位表尚未公布。
        </div>
      )}
    </div>
  );
}
