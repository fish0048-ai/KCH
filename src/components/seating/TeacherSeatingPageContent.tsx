"use client";

import { Suspense } from "react";
import { usePresentation } from "@/contexts/PresentationContext";
import { SeatingWorkspace } from "@/components/seating/SeatingWorkspace";
import { PageHeader } from "@/components/ui/PageHeader";

function TeacherSeatingInner() {
  const { presentation } = usePresentation();

  return (
    <>
      {!presentation ? (
        <PageHeader
          eyebrow="Teacher Console"
          title="梅花座位表"
          description="編排座位、進行課堂互動。上課時可開啟投影模式，收合教師操作區，直接投影此頁給全班。"
        />
      ) : null}
      <SeatingWorkspace />
    </>
  );
}

export function TeacherSeatingPageContent() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--ink-muted)]">載入中…</p>}>
      <TeacherSeatingInner />
    </Suspense>
  );
}
