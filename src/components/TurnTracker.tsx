"use client";

import { getTurnInfo } from "@/lib/snake";
import { RosterSettings } from "@/lib/types";

interface TurnTrackerProps {
  picksCount: number;
  settings: RosterSettings;
  onSettingsChange: (settings: RosterSettings) => void;
}

export default function TurnTracker({ picksCount, settings, onSettingsChange }: TurnTrackerProps) {
  const turn = getTurnInfo(picksCount, settings);

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1.5 text-foreground/60" title="Change this any time your draft slot changes — recommendations update instantly">
        <span>My slot</span>
        <input
          type="number"
          min={1}
          max={settings.numTeams}
          value={settings.myDraftSlot}
          onChange={(e) => {
            const myDraftSlot = Math.min(Math.max(1, Number(e.target.value) || 1), settings.numTeams);
            onSettingsChange({ ...settings, myDraftSlot });
          }}
          className="w-12 px-1.5 py-0.5 rounded border border-black/10 dark:border-white/15 bg-transparent text-center"
        />
        <span>of</span>
        <input
          type="number"
          min={2}
          max={32}
          value={settings.numTeams}
          onChange={(e) => {
            const numTeams = Math.min(Math.max(2, Number(e.target.value) || 2), 32);
            const myDraftSlot = Math.min(settings.myDraftSlot, numTeams);
            onSettingsChange({ ...settings, numTeams, myDraftSlot });
          }}
          className="w-12 px-1.5 py-0.5 rounded border border-black/10 dark:border-white/15 bg-transparent text-center"
        />
      </div>

      {turn.isMyTurnNow ? (
        <span className="px-3 py-1 rounded-full font-bold bg-emerald-600 text-white animate-pulse">
          YOUR TURN
        </span>
      ) : turn.nextMyPickNumber !== null ? (
        <span className="px-3 py-1 rounded-full border border-black/10 dark:border-white/15 text-foreground/70">
          Next pick in {turn.picksUntilMyTurn} (#{turn.nextMyPickNumber})
        </span>
      ) : null}
    </div>
  );
}
