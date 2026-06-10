"use client";

import { Suspense } from "react";
import { SeatingWorkspace } from "@/components/seating/SeatingWorkspace";

export function TeacherSeatingPageContent() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--ink-muted)]">載入中…</p>}>
      <SeatingWorkspace />
    </Suspense>
  );
}
