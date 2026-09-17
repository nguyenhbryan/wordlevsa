import { NextResponse, type NextRequest } from "next/server";
import { getPuzzleById, recordScore } from "@/lib/data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { attemptId?: string; wordId?: number; playerName?: string; guesses?: number; won?: boolean; durationSeconds?: number };
    const playerName = String(body.playerName || "").trim().replace(/\s+/g, " ").slice(0, 28);
    const guesses = Number(body.guesses); const durationSeconds = Math.max(0, Math.min(86400, Math.round(Number(body.durationSeconds) || 0)));
    if (!/^[a-zA-Z0-9 _.'-]{1,28}$/.test(playerName)) return NextResponse.json({ error: "Enter a name using letters, numbers, spaces, apostrophes, periods, or hyphens." }, { status: 400 });
    if (!body.attemptId || String(body.attemptId).length > 64 || !(await getPuzzleById(Number(body.wordId))) || guesses < 1 || guesses > 6) return NextResponse.json({ error: "That result could not be saved." }, { status: 400 });
    await recordScore({ attemptId: String(body.attemptId), wordId: Number(body.wordId), playerName, guesses, won: Boolean(body.won), durationSeconds });
    return NextResponse.json({ saved: true });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Your result couldn’t be saved. Try again." }, { status: 500 }); }
}
