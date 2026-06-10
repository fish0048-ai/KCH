"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SeatingWorkspace } from "@/components/seating/SeatingWorkspace";
import { PageHeader } from "@/components/ui/PageHeader";

function TeacherSeatingInner() {
  const searchParams = useSearchParams();
  const classMode = searchParams.get("class") === "1";

  return (
    <>
      {!classMode ? (
        <PageHeader
          eyebrow="Teacher Console"
          title="梅花座位表"
          description="編排座位、進行課堂互動。完成後按「公布給學生」，學生即可透過公開連結檢視。"
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
