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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">課堂抽籤</h3>
        <div className="my-6 min-h-[80px] text-center">
          {current ? (
            <>
              <div className="text-3xl font-bold text-blue-700">{current.name}</div>
              {current.studentNo ? (
                <div className="mt-1 text-sm text-slate-500">學號 {current.studentNo}</div>
              ) : null}
            </>
          ) : (
            <div className="text-sm text-slate-500">按下開始抽籤</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startDraw}
            disabled={spinning || candidates.length === 0}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {spinning ? "抽籤中…" : "開始抽籤"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            關閉
          </button>
        </div>
        {revealed && current ? (
          <div className="mt-4 flex justify-center gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => onAwardBonus(current.id, -1)}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
            >
              −1
            </button>
            <button
              type="button"
              onClick={() => onAwardBonus(current.id, 1)}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => onAwardBonus(current.id, 2)}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white"
            >
              +2
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
