import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const weeklyWords = sqliteTable("weekly_words", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  word: text("word").notNull(),
  startsOn: text("starts_on").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_weekly_words_starts_on").on(table.startsOn)]);

export const scores = sqliteTable("scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  attemptId: text("attempt_id").notNull(),
  wordId: integer("word_id").notNull().references(() => weeklyWords.id),
  playerName: text("player_name").notNull(),
  guesses: integer("guesses").notNull(),
  won: integer("won", { mode: "boolean" }).notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_scores_attempt_id").on(table.attemptId),
  index("idx_scores_word_completed").on(table.wordId, table.completedAt),
]);
