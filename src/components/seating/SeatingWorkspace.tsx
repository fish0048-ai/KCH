"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SeatingBoard } from "@/components/seating/SeatingBoard";
import { LotteryModal } from "@/components/seating/LotteryModal";
import { BonusFlashBanner } from "@/components/seating/BonusFlashBanner";
import { ImportPanel } from "@/components/seating/ImportPanel";
import { OneClickImport } from "@/components/seating/OneClickImport";
import { usePresentation } from "@/contexts/PresentationContext";
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
  large,
  onClick,
  children,
}: {
  active?: boolean;
  warn?: boolean;
  large?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn btn-chip ${large ? "btn-chip-lg" : ""} ${
        active ? (warn ? "btn-chip-warn-active" : "btn-chip-active") : ""
      }`}
    >
      {children}
    </button>
  );
}

export function SeatingWorkspace() {
  const { presentation, setPresentation, controlsOpen, setControlsOpen } = usePresentation();

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [state, setState] = useState<SeatingState>(createEmptySeating());
  const [viewMode, setViewMode] = useState<ViewMode>("result");
  const [editMode, setEditMode] = useState<EditMode>("block");
  const [fixSubMode, setFixSubMode] = useState<FixSubMode>("draft");
  const [studentPreview, setStudentPreview] = useState(false);
  const [absentMode, setAbsentMode] = useState(false);
  const [bonusMode, setBonusMode] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [lotteryOpen, setLotteryOpen] = useState(false);
  const [lotteryHighlightId, setLotteryHighlightId] = useState<string | null>(null);
  const [lotteryPhase, setLotteryPhase] = useState<LotteryPhase | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [asideOpen, setAsideOpen] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
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

  useEffect(() => {
    if (presentation) {
      setBonusMode(true);
      setControlsOpen(false);
      setAsideOpen(false);
    }
  }, [presentation, setControlsOpen]);

  const enterPresentation = () => {
    setPresentation(true);
    setBonusMode(true);
    setControlsOpen(false);
  };

  const exitPresentation = () => {
    setPresentation(false);
    setControlsOpen(false);
  };

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
    if (studentPreview) return;
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

  const lotteryPanel = lotteryOpen ? (
    <LotteryModal
      open={lotteryOpen}
      candidates={seatedStudents.length ? seatedStudents : students}
      compact={presentation}
      onClose={() => setLotteryOpen(false)}
      onLiveChange={updateLiveLottery}
      onHighlightChange={(studentId, phase) => {
        setLotteryHighlightId(studentId);
        setLotteryPhase(phase);
      }}
      onAwardBonus={(studentId, delta) => void awardBonus(studentId, delta, "lottery")}
    />
  ) : null;

  const teacherControls = (
    <>
      <div className="toolbar-group">
        <span className="px-2 text-xs font-bold text-[var(--ink-muted)]">分組</span>
        <select
          id="groupSelect"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className={`select w-auto min-w-[140px] border-0 bg-transparent font-semibold ${
            presentation ? "py-2 text-base" : "py-1"
          }`}
        >
          <option value="">請選擇</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-group">
        {!presentation ? (
          <>
            <ChipButton active={studentPreview} onClick={() => setStudentPreview((v) => !v)}>
              👁 學生預覽
            </ChipButton>
            <ChipButton active={absentMode} onClick={() => setAbsentMode((v) => !v)}>
              缺勤
            </ChipButton>
            <ChipButton active={showScores} onClick={() => setShowScores((v) => !v)}>
              成績
            </ChipButton>
          </>
        ) : null}
        <ChipButton large={presentation} warn onClick={() => setLotteryOpen(true)}>
          🎲 抽籤
        </ChipButton>
        <ChipButton
          large={presentation}
          active={bonusMode}
          warn
          onClick={() => setBonusMode((v) => !v)}
        >
          ⭐ 加分
        </ChipButton>
      </div>

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => handlePublish(true)}
          className={`btn btn-success ${presentation ? "text-sm" : "text-xs"}`}
        >
          公布給學生
        </button>
        {!presentation ? (
          <button type="button" onClick={() => handlePublish(false)} className="btn btn-ghost text-xs">
            取消公布
          </button>
        ) : null}
      </div>

      {status ? <span className="badge badge-brand">{status}</span> : null}
      {bonusMode && !presentation ? <span className="badge badge-muted">加分即時同步雲端</span> : null}
    </>
  );

  return (
    <div className={`space-y-5 ${presentation ? "presentation-mode" : ""}`}>
      {presentation ? (
        <div className="presentation-stage">
          <div className="presentation-title">
            <h2 className="text-xl font-bold text-[var(--brand-dark)] sm:text-2xl">
              {currentGroup?.name ?? "座位表"}
            </h2>
          </div>

          <div className="relative">
            <SeatingBoard
              state={state}
              students={students}
              mode="result"
              studentView
              bonusMode={bonusMode}
              projection
              selectedSeat={selectedSeat}
              highlightStudentId={lotteryHighlightId}
              lotteryPhase={lotteryPhase}
              lotteryPanel={lotteryPanel}
              onSeatClick={handleSeatClick}
            />
            <BonusFlashBanner flash={state.live?.bonusFlash} projection />
          </div>

          <button
            type="button"
            onClick={() => setControlsOpen(!controlsOpen)}
            className="presentation-fab"
            aria-expanded={controlsOpen}
          >
            {controlsOpen ? "收合教師控制 ▼" : "教師控制 ▲"}
          </button>

          {controlsOpen ? (
            <div className="presentation-controls card p-4">
              <div className="flex flex-wrap items-center gap-3">{teacherControls}</div>
              <button type="button" onClick={exitPresentation} className="btn btn-ghost mt-3 text-xs">
                離開投影模式
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              {teacherControls}
              <button type="button" onClick={enterPresentation} className="btn btn-primary text-xs">
                📺 投影模式
              </button>
            </div>

            {publicUrl ? (
              <div className="mt-3 rounded-xl bg-[var(--brand-light)] px-4 py-2.5 text-xs text-[var(--brand-dark)]">
                學生課後檢視連結：
                <a href={publicUrl} className="ml-1 font-semibold underline" target="_blank" rel="noreferrer">
                  {publicUrl}
                </a>
              </div>
            ) : null}
          </div>

          <div className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setImportOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#f8fafc]"
            >
              <span>
                <span className="section-label">Data</span>
                <span className="mt-1 block text-sm font-bold text-[var(--ink)]">資料匯入</span>
              </span>
              <span className="text-sm text-[var(--ink-muted)]">{importOpen ? "收合 ▲" : "展開 ▼"}</span>
            </button>
            {importOpen ? (
              <div className="space-y-4 border-t border-[var(--line)] bg-[#fafbfd] p-4">
                <OneClickImport
                  onDone={() => {
                    listGroups().then(setGroups);
                    setReloadKey((k) => k + 1);
                  }}
                />
                <ImportPanel onImported={() => listGroups().then(setGroups)} />
              </div>
            ) : null}
          </div>

          <div className={`grid gap-5 ${asideOpen && !studentPreview ? "lg:grid-cols-[300px_1fr]" : "grid-cols-1"}`}>
            {!studentPreview && asideOpen ? (
              <aside className="card space-y-4 p-4">
                <p className="section-label">Workspace</p>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f4f7fb] p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("edit")}
                    className={`rounded-lg py-2 text-xs font-bold ${
                      viewMode === "edit" ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-[var(--ink-muted)]"
                    }`}
                  >
                    編輯格局
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("result")}
                    className={`rounded-lg py-2 text-xs font-bold ${
                      viewMode === "result" ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-[var(--ink-muted)]"
                    }`}
                  >
                    座位結果
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-[var(--ink-muted)]">
                    列數
                    <input id="numRows" type="number" min={1} max={12} defaultValue={state.rows} className="input mt-1" />
                  </label>
                  <label className="text-xs text-[var(--ink-muted)]">
                    行數
                    <input id="numCols" type="number" min={1} max={12} defaultValue={state.cols} className="input mt-1" />
                  </label>
                </div>
                <button type="button" onClick={applyLayout} className="btn btn-ghost w-full text-xs">
                  套用格局
                </button>

                {viewMode === "edit" ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setEditMode("block")}
                      className={`btn w-full text-xs ${editMode === "block" ? "btn-primary" : "btn-ghost"}`}
                    >
                      封鎖座位
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode("fix")}
                      className={`btn w-full text-xs ${
                        editMode === "fix"
                          ? "bg-[var(--accent)] text-white"
                          : "btn-ghost border-[#f0d49a] bg-[var(--accent-soft)] text-[#8a5a00]"
                      }`}
                    >
                      固定座位
                    </button>
                    {editMode === "fix" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <ChipButton active={fixSubMode === "draft"} onClick={() => setFixSubMode("draft")}>
                          ① 指定
                        </ChipButton>
                        <ChipButton active={fixSubMode === "lock"} onClick={() => setFixSubMode("lock")}>
                          ② 鎖定
                        </ChipButton>
                      </div>
                    ) : null}
                    {editMode === "fix" && fixSubMode === "lock" ? (
                      <button
                        type="button"
                        onClick={() => {
                          const fixed = { ...state.fixed, ...state.draft };
                          void persist({ ...state, fixed, draft: {} }, "已鎖定全部指定");
                        }}
                        className="btn w-full bg-[var(--accent)] text-xs text-white"
                      >
                        鎖定全部指定
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="rounded-lg bg-[#f4f7fb] px-3 py-2 text-xs text-[var(--ink-muted)]">
                      可座位 <strong className="text-[var(--brand)]">{availableCount}</strong> / 學生{" "}
                      <strong>{students.length}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={generate}
                      disabled={availableCount < students.length - Object.keys(state.fixed).length}
                      className="btn btn-primary w-full text-xs disabled:opacity-50"
                    >
                      產生座位表
                    </button>
                    <button type="button" onClick={generate} className="btn btn-ghost w-full text-xs">
                      重新隨機
                    </button>
                    <button
                      type="button"
                      onClick={() => void persist({ ...state, assignments: {} }, "已清除隨機結果")}
                      className="btn w-full border-[#f5c4c4] bg-[var(--danger-soft)] text-xs text-[var(--danger)]"
                    >
                      清除隨機結果
                    </button>
                  </div>
                )}

                <div className="space-y-2 border-t border-[var(--line)] pt-3">
                  <button type="button" onClick={() => persist(state, "已儲存")} className="btn btn-primary w-full text-xs">
                    儲存
                  </button>
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="btn btn-ghost w-full text-xs"
                  >
                    重新載入
                  </button>
                  <button
                    type="button"
                    onClick={() => void persist({ ...state, bonus: {} }, "已清除本堂加分")}
                    className="btn btn-ghost w-full text-xs"
                  >
                    清除本堂加分
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchSync}
                    disabled={syncing}
                    className="btn btn-ghost w-full text-xs disabled:opacity-50"
                  >
                    {syncing ? "上傳中…" : "補傳本堂加分至雲端"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void persist({ ...state, absent: [] })}
                    className="btn btn-ghost w-full text-xs"
                  >
                    清除缺勤標記
                  </button>
                </div>
              </aside>
            ) : null}

            <main>
              <button
                type="button"
                onClick={() => setAsideOpen((v) => !v)}
                className="btn btn-ghost mb-3 text-xs"
              >
                {asideOpen ? "◀ 收合設定面板" : "▶ 展開設定面板"}
              </button>
              <SeatingBoard
                state={state}
                students={students}
                mode={viewMode}
                studentView={studentPreview}
                absentMode={absentMode && !studentPreview}
                bonusMode={bonusMode && !studentPreview}
                showScores={showScores}
                selectedSeat={selectedSeat}
                highlightStudentId={lotteryHighlightId}
                lotteryPhase={lotteryPhase}
                lotteryPanel={lotteryPanel}
                onSeatClick={handleSeatClick}
              />
              {viewMode === "result" && !studentPreview ? (
                <p className="mt-3 text-xs text-[var(--ink-muted)]">提示：點選兩個座位可對調學生位置。</p>
              ) : null}
            </main>
          </div>
        </>
      )}

    </div>
  );
}
