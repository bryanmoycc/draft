import { Player, Position, POSITIONS } from "./types";

const SLEEPER_PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl";

interface SleeperPlayer {
  player_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  fantasy_positions?: string[];
  team?: string | null;
  active?: boolean;
  search_rank?: number;
}

const TIER_SIZE: Record<Position, number> = {
  QB: 3,
  RB: 5,
  WR: 5,
  TE: 3,
  K: 4,
  DEF: 4,
};

// Fallback rank offset for players Sleeper doesn't assign a search_rank to
// (e.g. team defenses). Keeps them ordered after ranked players, by name.
const UNRANKED_BASE = 9000;

// The Sleeper players payload is ~20MB, which exceeds Next's fetch cache
// limit (2MB) and gets silently uncached. Cache it in memory ourselves.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cache: { players: Player[]; fetchedAt: number } | null = null;

export async function fetchPlayers(): Promise<Player[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.players;
  }

  const res = await fetch(SLEEPER_PLAYERS_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Sleeper API request failed: ${res.status}`);
  }
  const data = (await res.json()) as Record<string, SleeperPlayer>;

  const raw = Object.values(data).filter((p): p is SleeperPlayer & { position: string } => {
    if (!p.active || !p.position) return false;
    return POSITIONS.includes(p.position as Position);
  });

  // Stable fallback ordering for players with no search_rank (mostly DEF).
  raw.sort((a, b) => {
    const rankA = a.search_rank ?? UNRANKED_BASE;
    const rankB = b.search_rank ?? UNRANKED_BASE;
    if (rankA !== rankB) return rankA - rankB;
    return (a.full_name ?? "").localeCompare(b.full_name ?? "");
  });

  const byPosition = new Map<Position, SleeperPlayer[]>();
  for (const p of raw) {
    const pos = p.position as Position;
    if (!byPosition.has(pos)) byPosition.set(pos, []);
    byPosition.get(pos)!.push(p);
  }

  const players: Player[] = [];
  let overallRank = 1;
  for (const p of raw) {
    const pos = p.position as Position;
    const posList = byPosition.get(pos)!;
    const positionRank = posList.indexOf(p) + 1;
    const tier = Math.ceil(positionRank / TIER_SIZE[pos]);
    players.push({
      id: p.player_id,
      name: p.full_name ?? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      position: pos,
      team: p.team ?? null,
      rank: overallRank++,
      positionRank,
      tier,
    });
  }

  cache = { players, fetchedAt: Date.now() };
  return players;
}
