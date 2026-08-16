"use client";

import { useEffect, useMemo, useState } from "react";
import PlayerBoard from "@/components/PlayerBoard";
import RosterSidebar from "@/components/RosterSidebar";
import RecommendPanel from "@/components/RecommendPanel";
import BreakoutWatch from "@/components/BreakoutWatch";
import TurnTracker from "@/components/TurnTracker";
import { useDraftStore } from "@/store/draftStore";
import { recommendPlayers } from "@/lib/recommend";
import { assignRoster } from "@/lib/roster";
import { getTurnInfo } from "@/lib/snake";
import { countMyPositions, getDraftPhase, PHASE_LABELS } from "@/lib/strategy";
import { Player } from "@/lib/types";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const players = useDraftStore((s) => s.players);
  const picks = useDraftStore((s) => s.picks);
  const rosterSettings = useDraftStore((s) => s.rosterSettings);
  const setPlayers = useDraftStore((s) => s.setPlayers);
  const draftPlayer = useDraftStore((s) => s.draftPlayer);
  const undoPick = useDraftStore((s) => s.undoPick);
  const resetDraft = useDraftStore((s) => s.resetDraft);
  const setRosterSettings = useDraftStore((s) => s.setRosterSettings);

  useEffect(() => {
    fetch("/api/players")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlayers(data.players as Player[]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load players"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draftedIds = useMemo(() => new Set(picks.map((p) => p.playerId)), [picks]);

  const availablePlayers = useMemo(
    () => players.filter((p) => !draftedIds.has(p.id)),
    [players, draftedIds]
  );

  const myPlayersInDraftOrder = useMemo(() => {
    const byId = new Map(players.map((p) => [p.id, p]));
    return picks
      .filter((pick) => pick.by === "me")
      .sort((a, b) => a.pickNumber - b.pickNumber)
      .map((pick) => byId.get(pick.playerId))
      .filter((p): p is Player => Boolean(p));
  }, [picks, players]);

  const rosterAssignment = useMemo(
    () => assignRoster(myPlayersInDraftOrder, rosterSettings),
    [myPlayersInDraftOrder, rosterSettings]
  );

  const recommendations = useMemo(
    () => recommendPlayers(availablePlayers, rosterAssignment, rosterSettings),
    [availablePlayers, rosterAssignment, rosterSettings]
  );

  const turnInfo = useMemo(() => getTurnInfo(picks.length, rosterSettings), [picks.length, rosterSettings]);

  const phaseLabel = useMemo(() => {
    const counts = countMyPositions(myPlayersInDraftOrder);
    return PHASE_LABELS[getDraftPhase(counts)];
  }, [myPlayersInDraftOrder]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/15">
        <h1 className="text-lg font-bold">Fantasy Draft Assistant</h1>
        <div className="flex items-center gap-4">
          <TurnTracker picksCount={picks.length} settings={rosterSettings} onSettingsChange={setRosterSettings} />
          <span className="text-sm text-foreground/60">{picks.length} picks made</span>
          <button
            onClick={() => {
              if (confirm("Reset the entire draft? This clears all picks.")) resetDraft();
            }}
            className="px-3 py-1 rounded-full border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
          >
            Reset Draft
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_280px_280px] gap-4 p-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center text-foreground/50">
            Loading players…
          </div>
        ) : error ? (
          <div className="col-span-full flex items-center justify-center text-red-500">{error}</div>
        ) : (
          <>
            <section className="min-h-0">
              <PlayerBoard
                availablePlayers={availablePlayers}
                onDraft={draftPlayer}
                nextMyPickNumber={turnInfo.nextMyPickNumber}
              />
            </section>
            <aside className="min-h-0 overflow-y-auto flex flex-col gap-5">
              <RecommendPanel
                recommendations={recommendations}
                onDraft={draftPlayer}
                nextMyPickNumber={turnInfo.nextMyPickNumber}
                phaseLabel={phaseLabel}
              />
              <BreakoutWatch availablePlayers={availablePlayers} onDraft={draftPlayer} />
            </aside>
            <aside className="min-h-0 overflow-y-auto">
              <RosterSidebar assignment={rosterAssignment} onUndo={undoPick} />
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
