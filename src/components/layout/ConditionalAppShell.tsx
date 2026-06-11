"use client";

import { usePathname } from "next/navigation";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { AppNav } from "@/components/layout/AppNav";

export function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode } = useWorkspaceMode();
  const isClassroom = pathname.startsWith("/teacher/seating");
  const hideNav = isClassroom && mode === "class";

  return (
    <>
      {!hideNav ? <AppNav /> : null}
      <main className={isClassroom ? "classroom-main" : "app-main"}>{children}</main>
    </>
  );
}
