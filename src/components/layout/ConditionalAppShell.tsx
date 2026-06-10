"use client";

import { usePresentation } from "@/contexts/PresentationContext";
import { AppNav } from "@/components/layout/AppNav";

export function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const { presentation } = usePresentation();

  return (
    <>
      {!presentation ? <AppNav /> : null}
      <main className={presentation ? "immersive-main" : "app-main"}>{children}</main>
    </>
  );
}
