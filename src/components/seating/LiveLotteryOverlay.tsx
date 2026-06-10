"use client";

import type { LiveLottery, Student } from "@/types/seating";

interface LiveLotteryOverlayProps {
  lottery?: LiveLottery;
  student?: Student | null;
  projection?: boolean;
}

export function LiveLotteryOverlay({
  lottery,
  student,
  projection = false,
}: LiveLotteryOverlayProps) {
  if (!lottery?.open) return null;

  const titleSize = projection ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl";
  const subSize = projection ? "text-xl" : "text-sm";
  const panelPad = projection ? "px-8 py-12" : "px-6 py-8";

  return (
    <div className="live-overlay">
      <div className={`live-overlay-panel ${panelPad}`}>
        <p className="text-xs font-bold tracking-[0.2em] text-white/70 sm:text-sm">課堂抽籤</p>
        {lottery.phase === "idle" ? (
          <p className={`mt-6 font-semibold text-white/85 ${subSize}`}>老師準備抽籤中…</p>
        ) : student ? (
          <>
            <div
              className={`mt-6 font-bold text-white ${titleSize} ${
                lottery.phase === "spinning" ? "lottery-spin-text" : "lottery-reveal-text"
              }`}
            >
              {student.name}
            </div>
            {student.classNo && student.studentNo ? (
              <p className={`mt-3 text-white/80 ${subSize}`}>
                {student.classNo} 班 · 座號 {student.studentNo}
              </p>
            ) : null}
            {lottery.phase === "spinning" ? (
              <p className="mt-4 text-sm font-semibold text-amber-200">抽籤中…</p>
            ) : (
              <p className="mt-4 text-lg font-bold text-amber-300">恭喜中籤！</p>
            )}
          </>
        ) : (
          <p className={`mt-6 text-white/80 ${subSize}`}>等待抽籤結果…</p>
        )}
      </div>
    </div>
  );
}
