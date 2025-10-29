import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SettingsState {
  irlEnabled: boolean;
  irlPolicyVersion: string; // e.g., "auto", "v1", "v2"
  setIrlEnabled: (v: boolean) => void;
  setIrlPolicyVersion: (v: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      irlEnabled: false,
      irlPolicyVersion: "auto",
      setIrlEnabled: (v) => set({ irlEnabled: v }),
      setIrlPolicyVersion: (v) => set({ irlPolicyVersion: v }),
    }),
    { name: "settings-storage" }
  )
);
