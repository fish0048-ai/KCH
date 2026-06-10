"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";

export function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isProject = pathname.endsWith("/project");
  const isClassMode =
    pathname.startsWith("/teacher/seating") && searchParams.get("class") === "1";
  const immersive = isProject || isClassMode;

  return (
    <>
      {!immersive ? <AppNav /> : null}
      <main className={immersive ? "immersive-main" : "app-main"}>{children}</main>
    </>
  );
}
