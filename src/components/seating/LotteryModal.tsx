"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveLottery, Student } from "@/types/seating";

interface LotteryModalProps {
  open: boolean;
  candidates: Student[];
  classMode?: boolean;
  onClose: () => void;
  onAwardBonus: (studentId: string, delta: number) => void;
  onLiveChange?: (lottery: LiveLottery) => void;
}

export function LotteryModal({
  open,
  candidates,
  classMode = false,
  onClose,
  onAwardBonus,
  onLiveChange,
}: LotteryModalProps) {
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
  };

  useEffect(() => {
    if (!open) {
      setCurrent(null);
      setSpinning(false);
      setRevealed(false);
      if (timerRef.current) clearInterval(timerRef.current);
      onLiveChange?.({ open: false, phase: "idle", updatedAt: new Date().toISOString() });
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
    }, classMode ? 70 : 80);
  };

  const handleClose = () => {
    onLiveChange?.({ open: false, phase: "idle", updatedAt: new Date().toISOString() });
    onClose();
  };

  const nameSize = classMode ? "text-5xl" : "text-3xl";
  const panelMax = classMode ? "max-w-2xl" : "max-w-md";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1c2e]/55 p-4 backdrop-blur-sm">
      <div className={`card w-full ${panelMax} p-6 sm:p-8 ${revealed ? "lottery-reveal" : ""}`}>
        <div className="flex items-center justify-between">
          <h3 className={classMode ? "text-2xl font-bold text-[var(--ink)]" : "text-lg font-bold text-[var(--ink)]"}>
            課堂抽籤
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-2 py-1 text-[var(--ink-muted)] hover:bg-[#f4f7fb] hover:text-[var(--ink)]"
          >
            ✕
          </button>
        </div>

        <div
          className={`my-8 rounded-2xl bg-gradient-to-b from-[var(--brand-light)] to-white text-center ${
            classMode ? "min-h-[160px] px-6 py-10" : "min-h-[96px] px-4 py-6"
          }`}
        >
          {current ? (
            <>
              <div className={`font-bold text-[var(--brand-dark)] ${nameSize} ${spinning ? "lottery-spin-text" : ""}`}>
                {current.name}
              </div>
              {current.classNo && current.studentNo ? (
                <div className={`mt-2 text-[var(--ink-muted)] ${classMode ? "text-lg" : "text-sm"}`}>
                  {current.classNo} 班 · 座號 {current.studentNo}
                </div>
              ) : null}
            </>
          ) : (
            <div className={`text-[var(--ink-muted)] ${classMode ? "text-lg" : "text-sm"}`}>
              準備好了嗎？按下開始抽籤
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={startDraw}
            disabled={spinning || candidates.length === 0}
            className={`btn btn-primary flex-1 disabled:opacity-50 ${classMode ? "py-3.5 text-base" : ""}`}
          >
            {spinning ? "抽籤中…" : "開始抽籤"}
          </button>
        </div>

        {revealed && current ? (
          <div className={`mt-5 flex justify-center gap-3 border-t border-[var(--line)] pt-5 ${classMode ? "gap-4" : ""}`}>
            <button
              type="button"
              onClick={() => onAwardBonus(current.id, -1)}
              className={`btn btn-ghost font-bold ${classMode ? "min-w-[72px] py-3 text-lg" : "min-w-[56px]"}`}
            >
              −1
            </button>
            <button
              type="button"
              onClick={() => onAwardBonus(current.id, 1)}
              className={`btn bg-[var(--accent)] font-bold text-white ${classMode ? "min-w-[72px] py-3 text-lg" : "min-w-[56px]"}`}
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => onAwardBonus(current.id, 2)}
              className={`btn bg-[var(--accent)] font-bold text-white ${classMode ? "min-w-[72px] py-3 text-lg" : "min-w-[56px]"}`}
            >
              +2
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
