"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SeatingBoard } from "@/components/seating/SeatingBoard";
import { LotteryModal } from "@/components/seating/LotteryModal";
import { BonusFlashBanner } from "@/components/seating/BonusFlashBanner";
import { ImportPanel } from "@/components/seating/ImportPanel";
import { OneClickImport } from "@/components/seating/OneClickImport";
import {
  generateSeating,
  swapAssignments,
  countAvailableSeats,
  createEmptySeating,
  getSeatedStudentIds,
  resolveSeatStudentId,
} from "@/lib/seating/logic";
import { recordBonus, syncSessionBonuses } from "@/lib/firebase/bonus";
import {
  listGroups,
  publishSeating,
  saveSeatingState,
  subscribeGroups,
  subscribeSeating,
  subscribeStudents,
} from "@/lib/firebase/seating";
import type {
  EditMode,
  FixSubMode,
  Group,
  LiveLottery,
  LotteryPhase,
  SeatingState,
  Student,
  ViewMode,
} from "@/types/seating";

function ChipButton({
  active,
  warn,
  onClick,
  children,
}: {
  active?: boolean;
  warn?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn btn-chip ${active ? (warn ? "btn-chip-warn-active" : "btn-chip-active") : ""}`}
    >
      {children}
    </button>
  );
}

export function SeatingWorkspace() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [state, setState] = useState<SeatingState>(createEmptySeating());
  const [viewMode, setViewMode] = useState<ViewMode>("result");
  const [editMode, setEditMode] = useState<EditMode>("block");
  const [fixSubMode, setFixSubMode] = useState<FixSubMode>("draft");
  const [absentMode, setAbsentMode] = useState(false);
  const [bonusMode, setBonusMode] = useState(true);
  const [showScores, setShowScores] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [lotteryHighlightId, setLotteryHighlightId] = useState<string | null>(null);
  const [lotteryPhase, setLotteryPhase] = useState<LotteryPhase | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [asideOpen, setAsideOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const currentGroup = groups.find((g) => g.id === groupId);

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

  const awardBonus = useCallback(
    async (studentId: string, delta: number, source: "seat" | "lottery") => {
      if (!groupId) return;
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      const current = stateRef.current;
      const sessionTotal = (current.bonus[studentId] ?? 0) + delta;
      const nextBonus = { ...current.bonus, [studentId]: sessionTotal };

      try {
        await recordBonus(
          groupId,
          currentGroup?.name ?? groupId,
          student,
          delta,
          source,
          sessionTotal,
        );
        await persist(
          {
            ...current,
            bonus: nextBonus,
            live: {
              ...current.live,
              bonusFlash: {
                studentId,
                name: student.name,
                delta,
                sessionTotal,
                at: new Date().toISOString(),
              },
            },
          },
          `${delta > 0 ? `+${delta}` : delta} 分 · 已同步雲端`,
        );
      } catch {
        setStatus("加分同步失敗，請檢查網路後重試");
      }
    },
    [groupId, currentGroup?.name, students, persist],
  );

  const updateLiveLottery = useCallback(
    (lottery: LiveLottery) => {
      const current = stateRef.current;
      void persist({
        ...current,
        live: { ...current.live, lottery },
      });
    },
    [persist],
  );

  const availableCount = useMemo(() => countAvailableSeats(state), [state]);
  const seatedStudents = useMemo(() => {
    const ids = getSeatedStudentIds(state);
    return students.filter((s) => ids.has(s.id));
  }, [students, state]);

  const handleSeatClick = (key: string) => {
    if (absentMode) {
      const absent = state.absent.includes(key)
        ? state.absent.filter((k) => k !== key)
        : [...state.absent, key];
      void persist({ ...state, absent });
      return;
    }
    if (bonusMode) {
      const studentId = resolveSeatStudentId(state, key, "result");
      if (!studentId) return;
      void awardBonus(studentId, 1, "seat");
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
      if (draft[key]) delete draft[key];
      else {
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

  const handlePublish = async (published: boolean) => {
    if (!groupId) return;
    await publishSeating(groupId, published);
    setStatus(published ? "已公布給學生" : "已取消公布");
  };

  const handleBatchSync = async () => {
    if (!groupId || syncing) return;
    const hasBonus = Object.values(state.bonus).some((v) => v !== 0);
    if (!hasBonus) {
      setStatus("本堂尚無加分紀錄");
      return;
    }
    if (!window.confirm("將本堂所有加分補傳至雲端？若已即時同步過，可能產生重複紀錄。")) {
      return;
    }
    setSyncing(true);
    try {
      const count = await syncSessionBonuses(
        groupId,
        currentGroup?.name ?? groupId,
        students,
        state.bonus,
      );
      setStatus(`已補傳 ${count} 筆加分至雲端`);
    } catch {
      setStatus("補傳失敗，請稍後再試");
    } finally {
      setSyncing(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = origin && groupId ? `${origin}/view/seating/${groupId}` : "";

  const lotteryPanel = (
    <LotteryModal
      candidates={seatedStudents.length ? seatedStudents : students}
      onLiveChange={updateLiveLottery}
      onHighlightChange={(studentId, phase) => {
        setLotteryHighlightId(studentId);
        setLotteryPhase(phase);
      }}
      onAwardBonus={(studentId, delta) => void awardBonus(studentId, delta, "lottery")}
    />
  );

  return (
    <div className="classroom-shell">
      <header className="classroom-header card">
        <div className="classroom-header-main">
          <div className="classroom-title-group">
            <h2 className="classroom-title">{currentGroup?.name ?? "梅花座位表"}</h2>
            <select
              id="groupSelect"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="select classroom-select font-semibold"
            >
              <option value="">請選擇</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-group classroom-toolbar">
            <button
              type="button"
              onClick={() => setAsideOpen((v) => !v)}
              className={`btn btn-chip ${asideOpen ? "btn-chip-active" : ""}`}
            >
              {asideOpen ? "◀ 收合編排" : "▶ 編排"}
            </button>
            <ChipButton active={bonusMode} warn onClick={() => setBonusMode((v) => !v)}>
              ⭐ 加分
            </ChipButton>
            <ChipButton active={absentMode} onClick={() => setAbsentMode((v) => !v)}>
              缺勤
            </ChipButton>
            <ChipButton active={showScores} onClick={() => setShowScores((v) => !v)}>
              成績
            </ChipButton>
            <button type="button" onClick={() => handlePublish(true)} className="btn btn-success btn-sm">
              公布
            </button>
            <button type="button" onClick={() => handlePublish(false)} className="btn btn-ghost btn-sm">
              取消公布
            </button>
          </div>
        </div>

        <div className="classroom-lottery-bar">{lotteryPanel}</div>

        <div className="classroom-header-meta">
          <BonusFlashBanner flash={state.live?.bonusFlash} inline />
          {status ? <span className="badge badge-brand">{status}</span> : null}
          {bonusMode ? <span className="badge badge-muted">加分同步雲端</span> : null}
          {publicUrl ? (
            <a href={publicUrl} className="classroom-student-link" target="_blank" rel="noreferrer">
              學生連結
            </a>
          ) : null}
        </div>
      </header>

      <div className={`classroom-body ${asideOpen ? "classroom-body-aside-open" : ""}`}>
        {asideOpen ? (
        <aside className="classroom-aside card">
          <p className="section-label">編排</p>
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#f4f7fb] p-1">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`rounded-lg py-1.5 text-[11px] font-bold ${
                viewMode === "edit" ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-[var(--ink-muted)]"
              }`}
            >
              編輯
            </button>
            <button
              type="button"
              onClick={() => setViewMode("result")}
              className={`rounded-lg py-1.5 text-[11px] font-bold ${
                viewMode === "result" ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-[var(--ink-muted)]"
              }`}
            >
              結果
            </button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <label className="text-[10px] text-[var(--ink-muted)]">
              列
              <input id="numRows" type="number" min={1} max={12} defaultValue={state.rows} className="input mt-0.5 py-1 text-xs" />
            </label>
            <label className="text-[10px] text-[var(--ink-muted)]">
              行
              <input id="numCols" type="number" min={1} max={12} defaultValue={state.cols} className="input mt-0.5 py-1 text-xs" />
            </label>
          </div>

          {viewMode === "edit" ? (
            <div className="mt-2 space-y-1.5">
              <button
                type="button"
                onClick={() => setEditMode("block")}
                className={`btn w-full py-1.5 text-[11px] ${editMode === "block" ? "btn-primary" : "btn-ghost"}`}
              >
                封鎖
              </button>
              <button
                type="button"
                onClick={() => setEditMode("fix")}
                className={`btn w-full py-1.5 text-[11px] ${
                  editMode === "fix" ? "bg-[var(--accent)] text-white" : "btn-ghost"
                }`}
              >
                固定
              </button>
              {editMode === "fix" ? (
                <div className="grid grid-cols-2 gap-1">
                  <ChipButton active={fixSubMode === "draft"} onClick={() => setFixSubMode("draft")}>
                    指定
                  </ChipButton>
                  <ChipButton active={fixSubMode === "lock"} onClick={() => setFixSubMode("lock")}>
                    鎖定
                  </ChipButton>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-2 space-y-1.5">
              <p className="rounded-lg bg-[#f4f7fb] px-2 py-1.5 text-[10px] text-[var(--ink-muted)]">
                座位 <strong>{availableCount}</strong> / {students.length}
              </p>
              <button type="button" onClick={applyLayout} className="btn btn-ghost w-full py-1.5 text-[11px]">
                套用格局
              </button>
              <button type="button" onClick={generate} className="btn btn-primary w-full py-1.5 text-[11px]">
                產生座位
              </button>
              <button type="button" onClick={generate} className="btn btn-ghost w-full py-1.5 text-[11px]">
                重新隨機
              </button>
            </div>
          )}

          <div className="mt-2 space-y-1 border-t border-[var(--line)] pt-2">
            <button type="button" onClick={() => void persist({ ...state, bonus: {} })} className="btn btn-ghost w-full py-1.5 text-[11px]">
              清除加分
            </button>
            <button type="button" onClick={handleBatchSync} disabled={syncing} className="btn btn-ghost w-full py-1.5 text-[11px]">
              {syncing ? "上傳中" : "補傳加分"}
            </button>
          </div>
        </aside>
        ) : null}

        <div className="classroom-board-wrap">
          <SeatingBoard
            state={state}
            students={students}
            mode={viewMode}
            studentView={viewMode === "result"}
            absentMode={absentMode}
            bonusMode={bonusMode}
            showScores={showScores}
            classroomFit
            highlightStudentId={lotteryHighlightId}
            lotteryPhase={lotteryPhase}
            selectedSeat={selectedSeat}
            onSeatClick={handleSeatClick}
          />
        </div>
      </div>

      <section className="classroom-advanced card">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="classroom-advanced-toggle"
        >
          <span className="text-sm font-bold text-[var(--ink)]">進階設定</span>
          <span className="text-xs text-[var(--ink-muted)]">{advancedOpen ? "收合 ▲" : "展開 ▼"}</span>
        </button>
        {advancedOpen ? (
          <div className="space-y-4 border-t border-[var(--line)] p-4">
            {publicUrl ? (
              <p className="text-xs text-[var(--ink-muted)]">
                學生課後連結：
                <a href={publicUrl} className="ml-1 font-semibold text-[var(--brand)] underline">
                  {publicUrl}
                </a>
              </p>
            ) : null}
            <OneClickImport
              onDone={() => {
                listGroups().then(setGroups);
                setReloadKey((k) => k + 1);
              }}
            />
            <ImportPanel onImported={() => listGroups().then(setGroups)} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => persist(state, "已儲存")} className="btn btn-primary btn-sm">
                儲存
              </button>
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn btn-ghost btn-sm">
                重新載入
              </button>
              <button type="button" onClick={() => void persist({ ...state, absent: [] })} className="btn btn-ghost btn-sm">
                清除缺勤
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
