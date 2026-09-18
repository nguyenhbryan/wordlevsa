import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createWeeklyWord } from "@/lib/data";
import { isValidFiveLetterWord } from "@/lib/valid-words";
import { isoDate, mondayFor } from "@/lib/week";
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: "Your admin session has expired." }, { status: 401 });
  const body = await request.json() as { word?: string; startsOn?: string }; const word = String(body.word || "").trim().toUpperCase(); const startsOn = String(body.startsOn || "");
  if (!/^[A-Z]{5}$/.test(word)) return NextResponse.json({ error: "The weekly word must be exactly five letters." }, { status: 400 });
  if (!isValidFiveLetterWord(word)) return NextResponse.json({ error: "Choose a recognized five-letter English word." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || isoDate(mondayFor(new Date(`${startsOn}T12:00:00Z`))) !== startsOn) return NextResponse.json({ error: "Choose a Monday for the new puzzle." }, { status: 400 });
  try { await createWeeklyWord(word, startsOn); return NextResponse.json({ created: true }); }
  catch (error) { console.error(error); return NextResponse.json({ error: "That week already has a word. Choose another Monday." }, { status: 409 }); }
}
