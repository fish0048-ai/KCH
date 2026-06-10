"use client";

import { useEffect, useState } from "react";
import type { Student } from "@/types/seating";

interface LotteryModalProps {
  open: boolean;
  candidates: Student[];
  onClose: () => void;
  onAwardBonus: (studentId: string, delta: number) => void;
}

export function LotteryModal({
  open,
  candidates,
  onClose,
  onAwardBonus,
}: LotteryModalProps) {
  const [current, setCurrent] = useState<Student | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrent(null);
      setSpinning(false);
      setRevealed(false);
    }
  }, [open]);

  if (!open) return null;

  const startDraw = () => {
    if (candidates.length === 0) return;
    setSpinning(true);
    setRevealed(false);
    let ticks = 0;
    const timer = setInterval(() => {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      setCurrent(pick);
      ticks += 1;
      if (ticks > 18) {
        clearInterval(timer);
        setSpinning(false);
        setRevealed(true);
      }
    }, 80);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1c2e]/50 p-4 backdrop-blur-sm">
      <div className={`card w-full max-w-md p-6 ${revealed ? "lottery-reveal" : ""}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--ink)]">課堂抽籤</h3>
          <button type="button" onClick={onClose} className="text-[var(--ink-muted)] hover:text-[var(--ink)]">
            ✕
          </button>
        </div>

        <div className="my-8 min-h-[96px] rounded-2xl bg-gradient-to-b from-[var(--brand-light)] to-white px-4 py-6 text-center">
          {current ? (
            <>
              <div className="text-3xl font-bold text-[var(--brand-dark)]">{current.name}</div>
              {current.classNo && current.studentNo ? (
                <div className="mt-2 text-sm text-[var(--ink-muted)]">
                  {current.classNo} 班 · 座號 {current.studentNo}
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-sm text-[var(--ink-muted)]">準備好了嗎？按下開始抽籤</div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={startDraw}
            disabled={spinning || candidates.length === 0}
            className="btn btn-primary flex-1 disabled:opacity-50"
          >
            {spinning ? "抽籤中…" : "開始抽籤"}
          </button>
        </div>

        {revealed && current ? (
          <div className="mt-5 flex justify-center gap-2 border-t border-[var(--line)] pt-5">
            <button
              type="button"
              onClick={() => onAwardBonus(current.id, -1)}
              className="btn btn-ghost min-w-[56px] font-bold"
            >
              −1
            </button>
            <button
              type="button"
              onClick={() => onAwardBonus(current.id, 1)}
              className="btn min-w-[56px] bg-[var(--accent)] font-bold text-white"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => onAwardBonus(current.id, 2)}
              className="btn min-w-[56px] bg-[var(--accent)] font-bold text-white"
            >
              +2
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
