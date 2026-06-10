"use client";

import { useEffect, useState } from "react";
import type { LiveBonusFlash } from "@/types/seating";

interface BonusFlashBannerProps {
  flash?: LiveBonusFlash | null;
  projection?: boolean;
}

export function BonusFlashBanner({ flash, projection = false }: BonusFlashBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!flash?.at) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(timer);
  }, [flash?.at, flash?.studentId, flash?.delta]);

  if (!visible || !flash) return null;

  const positive = flash.delta > 0;

  return (
    <div
      className={`bonus-flash ${projection ? "bonus-flash-projection" : ""} ${
        positive ? "bonus-flash-positive" : "bonus-flash-negative"
      }`}
      role="status"
    >
      <span className="bonus-flash-icon">{positive ? "⭐" : "−"}</span>
      <span className="bonus-flash-name">{flash.name}</span>
      <span className="bonus-flash-delta">
        {positive ? `+${flash.delta}` : flash.delta}
      </span>
      <span className="bonus-flash-total">本堂累計 {flash.sessionTotal > 0 ? `+${flash.sessionTotal}` : flash.sessionTotal}</span>
    </div>
  );
}
