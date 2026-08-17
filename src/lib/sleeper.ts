import { Player, Position, POSITIONS } from "./types";

const SLEEPER_PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl";
const SLEEPER_TRENDING_ADD_URL =
  "https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=48&limit=200";

// The NFL league year turns over in March; before that we're still in the
// prior season's playoffs/offseason discussion.
function currentNflSeason(): number {
  const now = new Date();
  return now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
}

function projectionsUrl(): string {
  return `https://api.sleeper.app/v1/projections/nfl/regular/${currentNflSeason()}`;
}

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
  injury_status?: string | null;
  years_exp?: number | null;
}

interface TrendingEntry {
  player_id: string;
  count: number;
}

interface ProjectionStats {
  pts_ppr?: number;
}

// A player is a "breakout candidate" if they're seeing real add/rostering
// momentum on Sleeper (trending_add) while still early in their career and
// not already a consensus top-tier player (i.e. not already priced-in).
const BREAKOUT_MAX_YEARS_EXP = 3;
const BREAKOUT_MIN_TIER = 2;

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

// Trending adds shift over hours, so refresh this much more often than the
// player pool itself.
const TRENDING_CACHE_TTL_MS = 30 * 60 * 1000;
let trendingCache: { counts: Map<string, number>; fetchedAt: number } | null = null;

async function fetchTrendingAddCounts(): Promise<Map<string, number>> {
  if (trendingCache && Date.now() - trendingCache.fetchedAt < TRENDING_CACHE_TTL_MS) {
    return trendingCache.counts;
  }

  try {
    const res = await fetch(SLEEPER_TRENDING_ADD_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Sleeper trending request failed: ${res.status}`);
    const entries = (await res.json()) as TrendingEntry[];
    const counts = new Map(entries.map((e) => [e.player_id, e.count]));
    trendingCache = { counts, fetchedAt: Date.now() };
    return counts;
  } catch {
    // Breakout detection is a nice-to-have; don't fail the whole player load over it.
    return trendingCache?.counts ?? new Map();
  }
}

// Projections update over the course of the season but not minute to
// minute, so cache them alongside the player pool.
let projectionsCache: { points: Map<string, number>; fetchedAt: number } | null = null;

async function fetchProjectedPoints(): Promise<Map<string, number>> {
  if (projectionsCache && Date.now() - projectionsCache.fetchedAt < CACHE_TTL_MS) {
    return projectionsCache.points;
  }

  try {
    const res = await fetch(projectionsUrl(), { cache: "no-store" });
    if (!res.ok) throw new Error(`Sleeper projections request failed: ${res.status}`);
    const data = (await res.json()) as Record<string, ProjectionStats>;
    const points = new Map<string, number>();
    for (const [playerId, stats] of Object.entries(data)) {
      if (typeof stats.pts_ppr === "number") points.set(playerId, stats.pts_ppr);
    }
    projectionsCache = { points, fetchedAt: Date.now() };
    return points;
  } catch {
    // Projections are a nice-to-have; don't fail the whole player load over it.
    return projectionsCache?.points ?? new Map();
  }
}

export async function fetchPlayers(): Promise<Player[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.players;
  }

  const [res, trendingAddCounts, projectedPoints] = await Promise.all([
    fetch(SLEEPER_PLAYERS_URL, { cache: "no-store" }),
    fetchTrendingAddCounts(),
    fetchProjectedPoints(),
  ]);
  if (!res.ok) {
    throw new Error(`Sleeper API request failed: ${res.status}`);
  }
  const data = (await res.json()) as Record<string, SleeperPlayer>;

  const raw = Object.values(data).filter((p): p is SleeperPlayer & { position: string } => {
    // Sleeper's `active` flag doesn't reliably track roster status — plenty of
    // long-retired players (Tom Brady, Todd Gurley) still come back as active
    // with no team. Requiring a team is what actually means "on an NFL roster".
    if (!p.active || !p.position || !p.team) return false;
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
    const trendingAddCount = trendingAddCounts.get(p.player_id) ?? 0;
    const yearsExp = p.years_exp ?? null;
    const isBreakout =
      trendingAddCount > 0 && yearsExp !== null && yearsExp <= BREAKOUT_MAX_YEARS_EXP && tier >= BREAKOUT_MIN_TIER;

    players.push({
      id: p.player_id,
      name: p.full_name ?? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      position: pos,
      team: p.team ?? null,
      rank: overallRank++,
      positionRank,
      tier,
      injuryStatus: p.injury_status ?? null,
      yearsExp,
      trendingAddCount,
      isBreakout,
      projectedPoints: projectedPoints.get(p.player_id) ?? null,
    });
  }

  cache = { players, fetchedAt: Date.now() };
  return players;
}
