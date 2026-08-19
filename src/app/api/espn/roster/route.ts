import { NextRequest, NextResponse } from "next/server";
import { EspnCredentials, fetchEspnTeam } from "@/lib/espn";

export async function POST(req: NextRequest) {
  try {
    const credentials = (await req.json()) as EspnCredentials;
    if (!credentials.leagueId || !credentials.teamId || !credentials.season || !credentials.swid || !credentials.espnS2) {
      return NextResponse.json({ error: "Missing required ESPN credential fields." }, { status: 400 });
    }

    const team = await fetchEspnTeam(credentials);
    return NextResponse.json(team);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch ESPN roster" },
      { status: 502 }
    );
  }
}
