import { create } from 'zustand';

interface AppState {
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;
  activeMinerIndex: number | null;
  setActiveMinerIndex: (v: number | null) => void;
  minerIndices: number[];
  setMinerIndices: (v: number[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: (v) => set({ hasCompletedOnboarding: v }),
  activeMinerIndex: null,
  setActiveMinerIndex: (v) => set({ activeMinerIndex: v }),
  minerIndices: [],
  setMinerIndices: (v) => set({ minerIndices: v }),
}));
