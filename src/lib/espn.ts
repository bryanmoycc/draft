export interface EspnCredentials {
  leagueId: string;
  teamId: number;
  season: number;
  swid: string;
  espnS2: string;
}

export interface EspnRosterPlayer {
  id: number;
  name: string;
  proTeam: string;
  position: string;
  slot: string;
  points: number | null;
}

export interface EspnTeamInfo {
  teamName: string;
  roster: EspnRosterPlayer[];
}

// ESPN's fantasy API is unofficial and undocumented — these ID mappings are
// reverse-engineered (community-standard, e.g. used by the espn-api project)
// and may need adjustment if ESPN changes them.
const PRO_TEAM_MAP: Record<number, string> = {
  1: "ATL", 2: "BUF", 3: "CHI", 4: "CIN", 5: "CLE", 6: "DAL", 7: "DEN", 8: "DET",
  9: "GB", 10: "TEN", 11: "IND", 12: "KC", 13: "LV", 14: "LAR", 15: "MIA", 16: "MIN",
  17: "NE", 18: "NO", 19: "NYG", 20: "NYJ", 21: "PHI", 22: "ARI", 23: "PIT", 24: "LAC",
  25: "SF", 26: "SEA", 27: "TB", 28: "WSH", 29: "CAR", 30: "JAX", 33: "BAL", 34: "HOU",
};

const POSITION_MAP: Record<number, string> = {
  1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "D/ST",
};

const LINEUP_SLOT_MAP: Record<number, string> = {
  0: "QB", 2: "RB", 4: "WR", 6: "TE", 16: "D/ST", 17: "K", 23: "FLEX", 20: "BENCH", 21: "IR",
};

interface EspnPlayer {
  id: number;
  fullName: string;
  proTeamId: number;
  defaultPositionId: number;
}

interface EspnRosterEntry {
  lineupSlotId: number;
  appliedStatTotal?: number;
  playerPoolEntry: { player: EspnPlayer; appliedStatTotal?: number };
}

interface EspnTeam {
  id: number;
  name?: string;
  location?: string;
  nickname?: string;
  roster?: { entries: EspnRosterEntry[] };
}

interface EspnLeagueResponse {
  teams: EspnTeam[];
}

export async function fetchEspnTeam(credentials: EspnCredentials): Promise<EspnTeamInfo> {
  const swid = credentials.swid.trim().startsWith("{") ? credentials.swid.trim() : `{${credentials.swid.trim()}}`;
  const espnS2 = credentials.espnS2.trim();

  const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${credentials.season}/segments/0/leagues/${credentials.leagueId}?view=mRoster&view=mTeam`;

  const res = await fetch(url, {
    headers: {
      Cookie: `SWID=${swid}; espn_s2=${espnS2}`,
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; fantasy-draft-assistant/1.0)",
    },
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("ESPN rejected the credentials — check your SWID/espn_s2 cookies and league ID.");
  }
  if (!res.ok) {
    throw new Error(`ESPN request failed: ${res.status}`);
  }

  // ESPN sometimes returns 200 with an HTML page instead of JSON (e.g. stale
  // cookies, wrong league ID) rather than a proper error status.
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "ESPN returned an unexpected (non-JSON) response — double-check the league ID, team ID, and that your SWID/espn_s2 cookies are still valid (they expire when you log out)."
    );
  }

  const data = (await res.json()) as EspnLeagueResponse;
  const team = data.teams?.find((t) => t.id === credentials.teamId);
  if (!team) {
    throw new Error(`Team ${credentials.teamId} not found in this league's response.`);
  }

  const roster: EspnRosterPlayer[] = (team.roster?.entries ?? []).map((entry) => {
    const player = entry.playerPoolEntry.player;
    return {
      id: player.id,
      name: player.fullName,
      proTeam: PRO_TEAM_MAP[player.proTeamId] ?? "FA",
      position: POSITION_MAP[player.defaultPositionId] ?? "?",
      slot: LINEUP_SLOT_MAP[entry.lineupSlotId] ?? "BENCH",
      points: entry.playerPoolEntry.appliedStatTotal ?? entry.appliedStatTotal ?? null,
    };
  });

  const teamName = team.name ?? (`${team.location ?? ""} ${team.nickname ?? ""}`.trim() || `Team ${team.id}`);

  return { teamName, roster };
}
