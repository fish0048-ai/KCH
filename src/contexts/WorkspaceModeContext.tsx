"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type WorkspaceMode = "class" | "prep";

interface WorkspaceModeContextValue {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  teacherToolsOpen: boolean;
  setTeacherToolsOpen: (open: boolean) => void;
}

const WorkspaceModeContext = createContext<WorkspaceModeContextValue | null>(null);

export function WorkspaceModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<WorkspaceMode>("class");
  const [teacherToolsOpen, setTeacherToolsOpen] = useState(false);

  const value = useMemo(
    () => ({ mode, setMode, teacherToolsOpen, setTeacherToolsOpen }),
    [mode, teacherToolsOpen],
  );

  return (
    <WorkspaceModeContext.Provider value={value}>{children}</WorkspaceModeContext.Provider>
  );
}

export function useWorkspaceMode() {
  const ctx = useContext(WorkspaceModeContext);
  if (!ctx) {
    return {
      mode: "prep" as WorkspaceMode,
      setMode: () => {},
      teacherToolsOpen: false,
      setTeacherToolsOpen: () => {},
    };
  }
  return ctx;
}
