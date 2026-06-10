"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface PresentationContextValue {
  presentation: boolean;
  setPresentation: (value: boolean) => void;
  controlsOpen: boolean;
  setControlsOpen: (value: boolean) => void;
}

const PresentationContext = createContext<PresentationContextValue | null>(null);

export function PresentationProvider({ children }: { children: React.ReactNode }) {
  const [presentation, setPresentation] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);

  const value = useMemo(
    () => ({ presentation, setPresentation, controlsOpen, setControlsOpen }),
    [presentation, controlsOpen],
  );

  return (
    <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>
  );
}

export function usePresentation() {
  const ctx = useContext(PresentationContext);
  if (!ctx) {
    return {
      presentation: false,
      setPresentation: () => {},
      controlsOpen: false,
      setControlsOpen: () => {},
    };
  }
  return ctx;
}
