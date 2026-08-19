import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EspnCredentials } from "@/lib/espn";

interface EspnState {
  credentials: EspnCredentials | null;
  setCredentials: (credentials: EspnCredentials) => void;
  clearCredentials: () => void;
}

// SWID/espn_s2 are session-auth cookies, kept only in this browser's
// localStorage (never sent anywhere except our own server, which proxies
// them straight to ESPN) — never committed to the repo.
export const useEspnStore = create<EspnState>()(
  persist(
    (set) => ({
      credentials: null,
      setCredentials: (credentials) => set({ credentials }),
      clearCredentials: () => set({ credentials: null }),
    }),
    { name: "espn-credentials-storage" }
  )
);
