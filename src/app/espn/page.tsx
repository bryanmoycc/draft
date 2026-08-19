"use client";

import { useState } from "react";
import Link from "next/link";
import { useEspnStore } from "@/store/espnStore";
import { EspnRosterPlayer, EspnTeamInfo } from "@/lib/espn";

const POSITION_COLORS: Record<string, string> = {
  QB: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  RB: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  WR: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  TE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  K: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "D/ST": "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

function PosBadge({ position }: { position: string }) {
  const color = POSITION_COLORS[position] ?? "bg-black/10 text-foreground/70 dark:bg-white/10";
  return (
    <span className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-semibold w-12 ${color}`}>
      {position}
    </span>
  );
}

function RosterGroup({ title, players }: { title: string; players: EspnRosterPlayer[] }) {
  if (players.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{title}</h3>
      {players.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 rounded-md border border-black/10 dark:border-white/15 px-3 py-2 text-sm"
        >
          <span className="w-10 shrink-0 text-xs font-semibold text-foreground/40">{p.slot}</span>
          <PosBadge position={p.position} />
          <span className="flex-1">{p.name}</span>
          <span className="text-foreground/60">{p.proTeam}</span>
          <span className="w-14 text-right text-foreground/60">{p.points !== null ? p.points.toFixed(1) : "—"}</span>
        </div>
      ))}
    </div>
  );
}

export default function EspnPage() {
  const credentials = useEspnStore((s) => s.credentials);
  const setCredentials = useEspnStore((s) => s.setCredentials);

  const [leagueId, setLeagueId] = useState(credentials?.leagueId ?? "");
  const [teamId, setTeamId] = useState(credentials?.teamId?.toString() ?? "");
  const [season, setSeason] = useState(credentials?.season?.toString() ?? new Date().getFullYear().toString());
  const [swid, setSwid] = useState(credentials?.swid ?? "");
  const [espnS2, setEspnS2] = useState(credentials?.espnS2 ?? "");

  const [team, setTeam] = useState<EspnTeamInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const creds = {
      leagueId: leagueId.trim(),
      teamId: Number(teamId),
      season: Number(season),
      swid: swid.trim(),
      espnS2: espnS2.trim(),
    };
    setCredentials(creds);

    try {
      const res = await fetch("/api/espn/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch roster");
      setTeam(data as EspnTeamInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch roster");
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }

  const starters = team?.roster.filter((p) => p.slot !== "BENCH" && p.slot !== "IR") ?? [];
  const bench = team?.roster.filter((p) => p.slot === "BENCH") ?? [];
  const ir = team?.roster.filter((p) => p.slot === "IR") ?? [];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/15">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">ESPN Live Roster</h1>
          <Link href="/" className="text-sm text-foreground/60 hover:text-foreground underline">
            ← Draft assistant
          </Link>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-6 max-w-3xl mx-auto w-full flex flex-col gap-6">
        <form onSubmit={handleSync} className="flex flex-col gap-3 rounded-lg border border-black/10 dark:border-white/15 p-4">
          <p className="text-sm text-foreground/60">
            Uses ESPN&apos;s unofficial fantasy API. Find your{" "}
            <code className="text-xs bg-black/5 dark:bg-white/10 px-1 rounded">leagueId</code> and{" "}
            <code className="text-xs bg-black/5 dark:bg-white/10 px-1 rounded">teamId</code> in your league URL. For a
            private league, get <code className="text-xs bg-black/5 dark:bg-white/10 px-1 rounded">SWID</code> and{" "}
            <code className="text-xs bg-black/5 dark:bg-white/10 px-1 rounded">espn_s2</code> from your browser&apos;s
            cookies while logged into ESPN (DevTools → Application → Cookies →{" "}
            <code className="text-xs bg-black/5 dark:bg-white/10 px-1 rounded">fantasy.espn.com</code>). These stay in
            this browser only.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              League ID
              <input
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                required
                className="px-2 py-1.5 rounded border border-black/10 dark:border-white/15 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Team ID
              <input
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                type="number"
                className="px-2 py-1.5 rounded border border-black/10 dark:border-white/15 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Season
              <input
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                required
                type="number"
                className="px-2 py-1.5 rounded border border-black/10 dark:border-white/15 bg-transparent"
              />
            </label>
            <div />
            <label className="flex flex-col gap-1 text-sm col-span-2">
              SWID (include the curly braces)
              <input
                value={swid}
                onChange={(e) => setSwid(e.target.value)}
                required
                placeholder="{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}"
                className="px-2 py-1.5 rounded border border-black/10 dark:border-white/15 bg-transparent font-mono text-xs"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm col-span-2">
              espn_s2
              <input
                value={espnS2}
                onChange={(e) => setEspnS2(e.target.value)}
                required
                type="password"
                className="px-2 py-1.5 rounded border border-black/10 dark:border-white/15 bg-transparent font-mono text-xs"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="self-start px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Syncing…" : "Sync roster"}
          </button>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>

        {team && (
          <div className="flex flex-col gap-5">
            <h2 className="text-base font-semibold">{team.teamName}</h2>
            <RosterGroup title="Starters" players={starters} />
            <RosterGroup title="Bench" players={bench} />
            <RosterGroup title="IR" players={ir} />
          </div>
        )}
      </main>
    </div>
  );
}
