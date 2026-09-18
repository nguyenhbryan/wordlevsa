import { NextResponse, type NextRequest } from "next/server";
import { getCurrentPuzzle, getPuzzleById } from "@/lib/data";
import { endOfWeek, formatWeek, weekNumber } from "@/lib/week";
import { isValidFiveLetterWord } from "@/lib/valid-words";
import { scoreGuess } from "@/lib/wordle";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const puzzle = await getCurrentPuzzle();
    return NextResponse.json({ id: puzzle.id, number: puzzle.id.toString().padStart(3, "0"), startsOn: puzzle.starts_on, endsOn: endOfWeek(puzzle.starts_on).toISOString().slice(0, 10), weekLabel: formatWeek(puzzle.starts_on), weekNumber: weekNumber(new Date(`${puzzle.starts_on}T00:00:00Z`)), length: puzzle.word.length });
  } catch (error) { console.error(error); return NextResponse.json({ error: "The weekly puzzle is temporarily unavailable." }, { status: 503 }); }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { id?: number; guess?: string };
    const guess = String(body.guess || "").toUpperCase(); const puzzle = await getPuzzleById(Number(body.id));
    if (!puzzle) return NextResponse.json({ error: "That puzzle is no longer available." }, { status: 404 });
    if (!/^[A-Z]+$/.test(guess) || guess.length !== puzzle.word.length) return NextResponse.json({ error: `Enter a ${puzzle.word.length}-letter word.` }, { status: 400 });
    if (!isValidFiveLetterWord(guess)) return NextResponse.json({ error: "That isn’t a recognized five-letter word." }, { status: 400 });
    const states = scoreGuess(guess, puzzle.word); const won = states.every((state) => state === "correct");
    return NextResponse.json({ states, won });
  } catch (error) { console.error(error); return NextResponse.json({ error: "We couldn’t check that guess." }, { status: 500 }); }
}
