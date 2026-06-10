"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveLottery, LotteryPhase, Student } from "@/types/seating";

interface LotteryPanelProps {
  candidates: Student[];
  onAwardBonus: (studentId: string, delta: number) => void;
  onLiveChange?: (lottery: LiveLottery) => void;
  onHighlightChange?: (studentId: string | null, phase: LotteryPhase | null) => void;
}

export function LotteryModal({
  candidates,
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
      open: phase !== "idle",
      phase,
      studentId,
      updatedAt: new Date().toISOString(),
    });
    onHighlightChange?.(studentId ?? null, phase === "idle" ? null : phase);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      onLiveChange?.({ open: false, phase: "idle", updatedAt: new Date().toISOString() });
      onHighlightChange?.(null, null);
    },
    [],
  );

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
    }, 70);
  };

  const resetDraw = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrent(null);
    setSpinning(false);
    setRevealed(false);
    pushLive("idle");
  };

  return (
    <div className="lottery-panel lottery-panel-inline">
      <div className="lottery-panel-row">
        <span className="lottery-panel-label">🎲 課堂抽籤</span>

        {current ? (
          <span className="lottery-panel-status">
            {spinning ? "抽籤中" : "中籤"}：
            <strong>{current.name}</strong>
          </span>
        ) : (
          <span className="lottery-panel-status text-[var(--ink-muted)]">座位表會框選學生</span>
        )}

        <div className="lottery-panel-actions">
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
              <button type="button" onClick={() => onAwardBonus(current.id, -1)} className="btn btn-ghost btn-sm font-bold">
                −1
              </button>
              <button
                type="button"
                onClick={() => onAwardBonus(current.id, 1)}
                className="btn btn-sm bg-[var(--accent)] font-bold text-white"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => onAwardBonus(current.id, 2)}
                className="btn btn-sm bg-[var(--accent)] font-bold text-white"
              >
                +2
              </button>
            </>
          ) : null}

          {current ? (
            <button type="button" onClick={resetDraw} className="btn btn-ghost btn-sm">
              重設
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
