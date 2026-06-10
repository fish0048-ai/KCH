"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SeatingBoard } from "@/components/seating/SeatingBoard";
import { LotteryModal } from "@/components/seating/LotteryModal";
import { ImportPanel } from "@/components/seating/ImportPanel";
import { OneClickImport } from "@/components/seating/OneClickImport";
import {
  generateSeating,
  swapAssignments,
  countAvailableSeats,
} from "@/lib/seating/logic";
import {
  listGroups,
  publishSeating,
  saveSeatingState,
  subscribeGroups,
  subscribeSeating,
  subscribeStudents,
} from "@/lib/firebase/seating";
import { createEmptySeating } from "@/lib/seating/logic";
import type {
  EditMode,
  FixSubMode,
  Group,
  SeatingState,
  Student,
  ViewMode,
} from "@/types/seating";

export function SeatingWorkspace() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [state, setState] = useState<SeatingState>(createEmptySeating());
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [editMode, setEditMode] = useState<EditMode>("block");
  const [fixSubMode, setFixSubMode] = useState<FixSubMode>("draft");
  const [studentPreview, setStudentPreview] = useState(false);
  const [absentMode, setAbsentMode] = useState(false);
  const [bonusMode, setBonusMode] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [lotteryOpen, setLotteryOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [asideOpen, setAsideOpen] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => subscribeGroups(setGroups), []);
  useEffect(() => {
    if (!groupId && groups.length > 0) setGroupId(groups[0].id);
  }, [groups, groupId]);

  useEffect(() => {
    if (!groupId) return;
    const unsubStudents = subscribeStudents(groupId, setStudents);
    const unsubSeating = subscribeSeating(groupId, setState);
    return () => {
      unsubStudents();
      unsubSeating();
    };
  }, [groupId, reloadKey]);

  const persist = useCallback(
    async (next: SeatingState, message?: string) => {
      if (!groupId) return;
      setState(next);
      await saveSeatingState(groupId, next);
      if (message) setStatus(message);
    },
    [groupId],
  );

  const availableCount = useMemo(() => countAvailableSeats(state), [state]);

  const seatedStudents = useMemo(() => {
    const ids = new Set(Object.values(state.assignments));
    return students.filter((s) => ids.has(s.id));
  }, [students, state.assignments]);

  const handleSeatClick = (key: string) => {
    if (studentPreview) return;
    if (absentMode) {
      const absent = state.absent.includes(key)
        ? state.absent.filter((k) => k !== key)
        : [...state.absent, key];
      void persist({ ...state, absent });
      return;
    }
    if (bonusMode) {
      const studentId = state.assignments[key];
      if (!studentId) return;
      const nextBonus = { ...state.bonus, [studentId]: (state.bonus[studentId] ?? 0) + 1 };
      void persist({ ...state, bonus: nextBonus }, "已加分 +1");
      return;
    }

    if (viewMode === "result") {
      if (!selectedSeat) {
        setSelectedSeat(key);
        return;
      }
      if (selectedSeat === key) {
        setSelectedSeat(null);
        return;
      }
      const nextAssignments = swapAssignments(
        state.assignments,
        selectedSeat,
        key,
        state.blocked,
      );
      void persist({ ...state, assignments: nextAssignments }, "座位已對調");
      setSelectedSeat(null);
      return;
    }

    if (editMode === "block") {
      const blocked = state.blocked.includes(key)
        ? state.blocked.filter((k) => k !== key)
        : [...state.blocked, key];
      const fixed = { ...state.fixed };
      const draft = { ...state.draft };
      delete fixed[key];
      delete draft[key];
      void persist({ ...state, blocked, fixed, draft });
      return;
    }

    if (fixSubMode === "draft") {
      const draft = { ...state.draft };
      if (draft[key]) {
        delete draft[key];
      } else {
        const unassigned = students.find(
          (s) =>
            !Object.values(state.fixed).includes(s.id) &&
            !Object.values(draft).includes(s.id),
        );
        if (unassigned) draft[key] = unassigned.id;
      }
      void persist({ ...state, draft });
      return;
    }

    const fixed = { ...state.fixed };
    if (fixed[key]) delete fixed[key];
    else if (state.draft[key]) {
      fixed[key] = state.draft[key];
      const draft = { ...state.draft };
      delete draft[key];
      void persist({ ...state, fixed, draft });
    }
  };

  const applyLayout = () => {
    const rows = Number((document.getElementById("numRows") as HTMLInputElement)?.value) || 6;
    const cols = Number((document.getElementById("numCols") as HTMLInputElement)?.value) || 7;
    void persist({ ...state, rows, cols, assignments: {}, fixed: {}, draft: {} }, "已套用格局");
  };

  const generate = () => {
    const assignments = generateSeating(state, students);
    void persist({ ...state, assignments }, "已產生座位表");
    setViewMode("result");
  };

  const reshuffle = () => generate();

  const clearResult = () => {
    void persist({ ...state, assignments: {} }, "已清除隨機結果");
  };

  const lockAllDraft = () => {
    const fixed = { ...state.fixed, ...state.draft };
    void persist({ ...state, fixed, draft: {} }, "已鎖定全部指定座位");
  };

  const clearAllBonus = () => {
    void persist({ ...state, bonus: {} }, "已清除本堂加分");
  };

  const clearAllAbsent = () => {
    void persist({ ...state, absent: [] });
  };

  const handlePublish = async (published: boolean) => {
    if (!groupId) return;
    await publishSeating(groupId, published);
    setStatus(published ? "已公布給學生" : "已取消公布");
  };

  const publicUrl =
    typeof window !== "undefined" && groupId
      ? `${window.location.origin}/view/seating/${groupId}`
      : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="text-sm font-semibold text-slate-700" htmlFor="groupSelect">
          分組
        </label>
        <select
          id="groupSelect"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold"
        >
          <option value="">請選擇分組</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setStudentPreview((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            studentPreview
              ? "bg-blue-100 text-blue-700"
              : "border border-slate-200 text-slate-700"
          }`}
        >
          {studentPreview ? "學生預覽中" : "學生預覽"}
        </button>
        <button
          type="button"
          onClick={() => setAbsentMode((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            absentMode ? "bg-slate-200" : "border border-slate-200"
          }`}
        >
          缺勤
        </button>
        <button
          type="button"
          onClick={() => setShowScores((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            showScores ? "bg-blue-100 text-blue-700" : "border border-slate-200"
          }`}
        >
          成績
        </button>
        <button
          type="button"
          onClick={() => setLotteryOpen(true)}
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
        >
          抽籤
        </button>
        <button
          type="button"
          onClick={() => setBonusMode((v) => !v)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            bonusMode ? "bg-amber-100 text-amber-800" : "border border-slate-200"
          }`}
        >
          加分
        </button>
        <button
          type="button"
          onClick={() => handlePublish(true)}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
        >
          公布給學生
        </button>
        <button
          type="button"
          onClick={() => handlePublish(false)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          取消公布
        </button>
        {status ? <span className="text-xs text-slate-500">{status}</span> : null}
      </div>

      {publicUrl ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-800">
          學生公開連結：
          <a href={publicUrl} className="ml-1 font-semibold underline" target="_blank" rel="noreferrer">
            {publicUrl}
          </a>
        </div>
      ) : null}

      <OneClickImport
        onDone={() => {
          listGroups().then(setGroups);
          setReloadKey((k) => k + 1);
        }}
      />
      <ImportPanel onImported={() => listGroups().then(setGroups)} />

      <div
        className={`grid gap-4 ${asideOpen && !studentPreview ? "lg:grid-cols-[280px_1fr]" : "grid-cols-1"}`}
      >
        {!studentPreview && asideOpen ? (
          <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode("edit")}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                  viewMode === "edit" ? "bg-blue-100 text-blue-700" : "bg-slate-100"
                }`}
              >
                編輯格局
              </button>
              <button
                type="button"
                onClick={() => setViewMode("result")}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                  viewMode === "result" ? "bg-blue-100 text-blue-700" : "bg-slate-100"
                }`}
              >
                座位結果
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-500">
                列數（前後）
                <input
                  id="numRows"
                  type="number"
                  min={1}
                  max={12}
                  defaultValue={state.rows}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                />
              </label>
              <label className="text-xs text-slate-500">
                行數（左右）
                <input
                  id="numCols"
                  type="number"
                  min={1}
                  max={12}
                  defaultValue={state.cols}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={applyLayout}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
            >
              套用格局
            </button>

            {viewMode === "edit" ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setEditMode("block")}
                  className={`w-full rounded-lg px-3 py-2 text-xs font-semibold ${
                    editMode === "block" ? "bg-slate-800 text-white" : "bg-slate-100"
                  }`}
                >
                  封鎖座位
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode("fix")}
                  className={`w-full rounded-lg px-3 py-2 text-xs font-semibold ${
                    editMode === "fix" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-900"
                  }`}
                >
                  固定座位
                </button>
                {editMode === "fix" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFixSubMode("draft")}
                      className={`flex-1 rounded px-2 py-1 text-xs ${
                        fixSubMode === "draft" ? "bg-blue-100 font-bold" : "bg-slate-50"
                      }`}
                    >
                      ① 指定
                    </button>
                    <button
                      type="button"
                      onClick={() => setFixSubMode("lock")}
                      className={`flex-1 rounded px-2 py-1 text-xs ${
                        fixSubMode === "lock" ? "bg-blue-100 font-bold" : "bg-slate-50"
                      }`}
                    >
                      ② 鎖定
                    </button>
                  </div>
                ) : null}
                {editMode === "fix" && fixSubMode === "lock" ? (
                  <button
                    type="button"
                    onClick={lockAllDraft}
                    className="w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white"
                  >
                    鎖定全部指定
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  可座位數 {availableCount} / 學生 {students.length}
                </p>
                <button
                  type="button"
                  onClick={generate}
                  disabled={availableCount < students.length - Object.keys(state.fixed).length}
                  className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  產生座位表
                </button>
                <button
                  type="button"
                  onClick={reshuffle}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
                >
                  重新隨機
                </button>
                <button
                  type="button"
                  onClick={clearResult}
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                >
                  清除隨機結果
                </button>
              </div>
            )}

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => persist(state, "已儲存")}
                className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
              >
                儲存
              </button>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                重新載入
              </button>
              <button
                type="button"
                onClick={clearAllBonus}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                清除本堂加分
              </button>
              <button
                type="button"
                onClick={clearAllAbsent}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
              >
                清除缺勤標記
              </button>
            </div>
          </aside>
        ) : null}

        <main>
          {!studentPreview ? (
            <button
              type="button"
              onClick={() => setAsideOpen((v) => !v)}
              className="mb-2 rounded border border-slate-200 px-2 py-1 text-xs text-slate-600"
            >
              {asideOpen ? "收合設定" : "展開設定"}
            </button>
          ) : null}
          <SeatingBoard
            state={state}
            students={students}
            mode={viewMode}
            studentView={studentPreview}
            absentMode={absentMode && !studentPreview}
            bonusMode={bonusMode && !studentPreview}
            showScores={showScores}
            selectedSeat={selectedSeat}
            onSeatClick={handleSeatClick}
          />
          {viewMode === "result" && !studentPreview ? (
            <p className="mt-2 text-xs text-slate-500">
              點選兩個座位可對調學生位置。
            </p>
          ) : null}
        </main>
      </div>

      <LotteryModal
        open={lotteryOpen}
        candidates={seatedStudents.length ? seatedStudents : students}
        onClose={() => setLotteryOpen(false)}
        onAwardBonus={(studentId, delta) => {
          const next = {
            ...state.bonus,
            [studentId]: (state.bonus[studentId] ?? 0) + delta,
          };
          void persist({ ...state, bonus: next }, `已調整 ${delta > 0 ? "+" : ""}${delta} 分`);
        }}
      />
    </div>
  );
}
