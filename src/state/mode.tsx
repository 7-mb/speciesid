import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type IdentifyMode = 'plants' | 'moths' | 'mushrooms';

type ModeContextValue = {
  mode: IdentifyMode;
  setMode: (mode: IdentifyMode) => void;
};

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<IdentifyMode>('plants');

  const value = useMemo<ModeContextValue>(() => ({ mode, setMode }), [mode]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const value = useContext(ModeContext);
  if (!value) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return value;
}
