import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { isoDate, mondayFor } from "./week";

export type PuzzleRow = {
  id: number;
  word: string;
  starts_on: string;
  created_at: string;
};

let client: NeonQueryFunction<false, false> | null = null;

function database() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }
  client ??= neon(databaseUrl);
  return client;
}

export async function getCurrentPuzzle(): Promise<PuzzleRow> {
  const sql = database();
  const today = isoDate(new Date());
  let rows = await sql`
    SELECT id, word, starts_on, created_at::text
    FROM weekly_words
    WHERE starts_on <= ${today}
    ORDER BY starts_on DESC
    LIMIT 1
  `;
  let puzzle = rows[0] as PuzzleRow | undefined;

  if (!puzzle) {
    const startsOn = isoDate(mondayFor());
    await sql`
      INSERT INTO weekly_words (word, starts_on)
      VALUES ('CRANE', ${startsOn})
      ON CONFLICT (starts_on) DO NOTHING
    `;
    rows = await sql`
      SELECT id, word, starts_on, created_at::text
      FROM weekly_words
      WHERE starts_on = ${startsOn}
      LIMIT 1
    `;
    puzzle = rows[0] as PuzzleRow | undefined;
  }

  if (!puzzle) throw new Error("No weekly puzzle is available yet.");
  return puzzle;
}

export async function getPuzzleById(id: number) {
  const rows = await database()`
    SELECT id, word, starts_on, created_at::text
    FROM weekly_words
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] as PuzzleRow | undefined;
}

export async function recordScore(input: {
  attemptId: string;
  wordId: number;
  playerName: string;
  guesses: number;
  won: boolean;
  durationSeconds: number;
}) {
  return database()`
    INSERT INTO scores (
      attempt_id,
      word_id,
      player_name,
      guesses,
      won,
      duration_seconds
    )
    VALUES (
      ${input.attemptId},
      ${input.wordId},
      ${input.playerName},
      ${input.guesses},
      ${input.won ? 1 : 0},
      ${input.durationSeconds}
    )
    ON CONFLICT (attempt_id) DO NOTHING
  `;
}

export async function listAdminData() {
  const sql = database();
  const [words, scores, averageLeaderboard, completionLeaderboard] =
    await Promise.all([
      sql`
        SELECT
          w.id,
          w.word,
          w.starts_on,
          w.created_at::text,
          COUNT(s.id)::int AS plays,
          COALESCE(SUM(CASE WHEN s.won = 1 THEN 1 ELSE 0 END), 0)::int AS wins
        FROM weekly_words w
        LEFT JOIN scores s ON s.word_id = w.id
        GROUP BY w.id
        ORDER BY w.starts_on DESC
      `,
      sql`
        SELECT
          s.id,
          s.player_name,
          s.guesses,
          s.won,
          s.duration_seconds,
          s.completed_at::text,
          w.word,
          w.starts_on
        FROM scores s
        JOIN weekly_words w ON w.id = s.word_id
        ORDER BY s.completed_at DESC, s.guesses ASC
        LIMIT 250
      `,
      sql`
        SELECT
          MIN(player_name) AS player_name,
          ROUND(AVG(best_guesses)::numeric, 2)::float8 AS average_guesses,
          COUNT(*)::int AS wins
        FROM (
          SELECT
            LOWER(TRIM(player_name)) AS player_key,
            MIN(player_name) AS player_name,
            word_id,
            MIN(guesses) AS best_guesses
          FROM scores
          WHERE won = 1
          GROUP BY LOWER(TRIM(player_name)), word_id
        ) AS winning_wordles
        GROUP BY player_key
        ORDER BY average_guesses ASC, wins DESC, player_name ASC
        LIMIT 100
      `,
      sql`
        SELECT
          MIN(player_name) AS player_name,
          COUNT(*)::int AS completed,
          SUM(won)::int AS wins
        FROM (
          SELECT
            LOWER(TRIM(player_name)) AS player_key,
            MIN(player_name) AS player_name,
            word_id,
            MAX(won) AS won
          FROM scores
          GROUP BY LOWER(TRIM(player_name)), word_id
        ) AS completed_wordles
        GROUP BY player_key
        ORDER BY completed DESC, wins DESC, player_name ASC
        LIMIT 100
      `,
    ]);

  return { words, scores, averageLeaderboard, completionLeaderboard };
}

export async function createWeeklyWord(word: string, startsOn: string) {
  return database()`
    INSERT INTO weekly_words (word, starts_on)
    VALUES (${word}, ${startsOn})
  `;
}
