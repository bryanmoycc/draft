import { NextResponse } from "next/server";
import { fetchPlayers } from "@/lib/sleeper";

export async function GET() {
  try {
    const players = await fetchPlayers();
    return NextResponse.json({ players });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch players" },
      { status: 502 }
    );
  }
}
