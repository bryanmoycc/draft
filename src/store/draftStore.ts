import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ROSTER_SETTINGS, DraftedBy, DraftPick, Player, RosterSettings } from "@/lib/types";

interface DraftState {
  players: Player[];
  picks: DraftPick[];
  rosterSettings: RosterSettings;
  setPlayers: (players: Player[]) => void;
  draftPlayer: (playerId: string, by: DraftedBy) => void;
  undoPick: (playerId: string) => void;
  resetDraft: () => void;
  setRosterSettings: (settings: RosterSettings) => void;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      players: [],
      picks: [],
      rosterSettings: DEFAULT_ROSTER_SETTINGS,

      setPlayers: (players) => set({ players }),

      draftPlayer: (playerId, by) => {
        if (get().picks.some((p) => p.playerId === playerId)) return;
        const pickNumber = get().picks.length + 1;
        set({ picks: [...get().picks, { playerId, by, pickNumber }] });
      },

      undoPick: (playerId) => {
        set({ picks: get().picks.filter((p) => p.playerId !== playerId) });
      },

      resetDraft: () => set({ picks: [] }),

      setRosterSettings: (rosterSettings) => set({ rosterSettings }),
    }),
    {
      name: "draft-assistant-storage",
      partialize: (state) => ({ picks: state.picks, rosterSettings: state.rosterSettings }),
    }
  )
);
