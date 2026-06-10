"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";

export function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isClassroom = pathname.startsWith("/teacher/seating");

  return (
    <>
      <AppNav />
      <main className={isClassroom ? "classroom-main" : "app-main"}>{children}</main>
    </>
  );
}
