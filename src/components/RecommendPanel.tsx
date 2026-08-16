"use client";

import { Recommendation } from "@/lib/recommend";
import { estimateSurvival } from "@/lib/snake";
import { DraftedBy } from "@/lib/types";
import PositionBadge from "./PositionBadge";
import InjuryBadge from "./InjuryBadge";
import BreakoutBadge from "./BreakoutBadge";
import SurvivalBadge from "./SurvivalBadge";

interface RecommendPanelProps {
  recommendations: Recommendation[];
  onDraft: (playerId: string, by: DraftedBy) => void;
  nextMyPickNumber: number | null;
}

export default function RecommendPanel({ recommendations, onDraft, nextMyPickNumber }: RecommendPanelProps) {
  const top = recommendations.slice(0, 5);

  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-sm font-semibold text-foreground/70 mb-1">Recommended Picks</h2>
      {top.map((p, i) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-2 rounded-md border border-black/10 dark:border-white/15 px-2.5 py-1.5 text-sm"
        >
          <span className="w-4 shrink-0 text-xs font-mono text-foreground/40">{i + 1}</span>
          <PositionBadge position={p.position} />
          <span className="flex-1 truncate flex items-center gap-1.5">
            {p.name}
            <InjuryBadge status={p.injuryStatus} />
            <BreakoutBadge isBreakout={p.isBreakout} trendingAddCount={p.trendingAddCount} />
            {nextMyPickNumber !== null && <SurvivalBadge estimate={estimateSurvival(p.rank, nextMyPickNumber)} />}
          </span>
          <button
            onClick={() => onDraft(p.id, "me")}
            className="px-2 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Draft
          </button>
        </div>
      ))}
      {top.length === 0 && <p className="text-sm text-foreground/40">No players available.</p>}
    </div>
  );
}
