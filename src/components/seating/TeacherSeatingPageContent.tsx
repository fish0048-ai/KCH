"use client";

import { Suspense } from "react";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { SeatingWorkspace } from "@/components/seating/SeatingWorkspace";
import { PageHeader } from "@/components/ui/PageHeader";

function TeacherSeatingInner() {
  const { mode } = useWorkspaceMode();

  return (
    <>
      {mode === "prep" ? (
        <PageHeader
          eyebrow="Teacher Console"
          title="梅花座位表"
          description="編排後台用於排座位、固定座位與匯入資料。完成後切換至「上課投影」，即可將座位表、抽籤與加分投影給全班。"
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
