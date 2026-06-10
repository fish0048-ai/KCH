"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveLottery, LotteryPhase, Student } from "@/types/seating";

interface LotteryPanelProps {
  open: boolean;
  candidates: Student[];
  compact?: boolean;
  onClose: () => void;
  onAwardBonus: (studentId: string, delta: number) => void;
  onLiveChange?: (lottery: LiveLottery) => void;
  onHighlightChange?: (studentId: string | null, phase: LotteryPhase | null) => void;
}

export function LotteryModal({
  open,
  candidates,
  compact = false,
  onClose,
  onAwardBonus,
  onLiveChange,
  onHighlightChange,
}: LotteryPanelProps) {
  const [current, setCurrent] = useState<Student | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pushLive = (phase: LiveLottery["phase"], studentId?: string) => {
    onLiveChange?.({
      open: true,
      phase,
      studentId,
      updatedAt: new Date().toISOString(),
    });
    onHighlightChange?.(studentId ?? null, phase);
  };

  useEffect(() => {
    if (!open) {
      setCurrent(null);
      setSpinning(false);
      setRevealed(false);
      if (timerRef.current) clearInterval(timerRef.current);
      onLiveChange?.({ open: false, phase: "idle", updatedAt: new Date().toISOString() });
      onHighlightChange?.(null, null);
    } else {
      pushLive("idle");
    }
  }, [open]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  if (!open) return null;

  const startDraw = () => {
    if (candidates.length === 0) return;
    setSpinning(true);
    setRevealed(false);
    pushLive("spinning");
    let ticks = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      setCurrent(pick);
      pushLive("spinning", pick.id);
      ticks += 1;
      if (ticks > 22) {
        if (timerRef.current) clearInterval(timerRef.current);
        setSpinning(false);
        setRevealed(true);
        pushLive("revealed", pick.id);
      }
    }, compact ? 70 : 80);
  };

  const handleClose = () => {
    onLiveChange?.({ open: false, phase: "idle", updatedAt: new Date().toISOString() });
    onHighlightChange?.(null, null);
    onClose();
  };

  return (
    <div className={`lottery-panel ${compact ? "lottery-panel-compact" : ""}`}>
      <div className="lottery-panel-inner">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold text-[var(--ink)]">🎲 課堂抽籤</span>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-2 py-1 text-xs text-[var(--ink-muted)] hover:bg-[#f4f7fb]"
          >
            關閉
          </button>
        </div>

        {current ? (
          <p className="mt-2 text-center text-xs text-[var(--ink-muted)]">
            {spinning ? "抽籤中：" : "中籤："}
            <strong className="text-[var(--brand-dark)]">{current.name}</strong>
            {revealed ? <span className="ml-1 text-amber-600">（已框選座位）</span> : null}
          </p>
        ) : (
          <p className="mt-2 text-center text-xs text-[var(--ink-muted)]">按下開始，座位表會即時框選學生</p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={startDraw}
            disabled={spinning || candidates.length === 0}
            className="btn btn-primary disabled:opacity-50"
          >
            {spinning ? "抽籤中…" : "開始抽籤"}
          </button>

          {revealed && current ? (
            <>
              <button type="button" onClick={() => onAwardBonus(current.id, -1)} className="btn btn-ghost font-bold">
                −1
              </button>
              <button
                type="button"
                onClick={() => onAwardBonus(current.id, 1)}
                className="btn bg-[var(--accent)] font-bold text-white"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => onAwardBonus(current.id, 2)}
                className="btn bg-[var(--accent)] font-bold text-white"
              >
                +2
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
