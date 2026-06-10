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
    return <p className="text-sm text-slate-500">載入中…</p>;
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        目前尚無已公布的座位表，請等待教師公布。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-semibold" htmlFor="studentGroup">
          班級
        </label>
        <select
          id="studentGroup"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">學生檢視模式（唯讀）</span>
      </div>

      {isPublished ? (
        <SeatingBoard
          state={state}
          students={students}
          mode="result"
          studentView
        />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          此班級座位表尚未公布。
        </div>
      )}
    </div>
  );
}
