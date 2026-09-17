import { env } from "cloudflare:workers";
import { isoDate, mondayFor } from "./week";

export type PuzzleRow = { id: number; word: string; starts_on: string; created_at: string };
function database() { if (!env.DB) throw new Error("The puzzle database is unavailable."); return env.DB; }

export async function getCurrentPuzzle(): Promise<PuzzleRow> {
  const db = database(); const today = isoDate(new Date());
  let puzzle = await db.prepare("SELECT id, word, starts_on, created_at FROM weekly_words WHERE starts_on <= ? ORDER BY starts_on DESC LIMIT 1").bind(today).first<PuzzleRow>();
  if (!puzzle) {
    const startsOn = isoDate(mondayFor());
    await db.prepare("INSERT OR IGNORE INTO weekly_words (word, starts_on) VALUES (?, ?)").bind("CRANE", startsOn).run();
    puzzle = await db.prepare("SELECT id, word, starts_on, created_at FROM weekly_words WHERE starts_on = ? LIMIT 1").bind(startsOn).first<PuzzleRow>();
  }
  if (!puzzle) throw new Error("No weekly puzzle is available yet.");
  return puzzle;
}
export async function getPuzzleById(id: number) { return database().prepare("SELECT id, word, starts_on, created_at FROM weekly_words WHERE id = ? LIMIT 1").bind(id).first<PuzzleRow>(); }
export async function recordScore(input: { attemptId: string; wordId: number; playerName: string; guesses: number; won: boolean; durationSeconds: number }) {
  return database().prepare("INSERT OR IGNORE INTO scores (attempt_id, word_id, player_name, guesses, won, duration_seconds) VALUES (?, ?, ?, ?, ?, ?)").bind(input.attemptId, input.wordId, input.playerName, input.guesses, input.won ? 1 : 0, input.durationSeconds).run();
}
export async function listAdminData() {
  const db = database();
  const [words, scores] = await Promise.all([
    db.prepare("SELECT w.id, w.word, w.starts_on, w.created_at, COUNT(s.id) AS plays, COALESCE(SUM(CASE WHEN s.won = 1 THEN 1 ELSE 0 END), 0) AS wins FROM weekly_words w LEFT JOIN scores s ON s.word_id = w.id GROUP BY w.id ORDER BY w.starts_on DESC").all(),
    db.prepare("SELECT s.id, s.player_name, s.guesses, s.won, s.duration_seconds, s.completed_at, w.word, w.starts_on FROM scores s JOIN weekly_words w ON w.id = s.word_id ORDER BY s.completed_at DESC, s.guesses ASC LIMIT 250").all(),
  ]);
  return { words: words.results, scores: scores.results };
}
export async function createWeeklyWord(word: string, startsOn: string) { return database().prepare("INSERT INTO weekly_words (word, starts_on) VALUES (?, ?)").bind(word, startsOn).run(); }
