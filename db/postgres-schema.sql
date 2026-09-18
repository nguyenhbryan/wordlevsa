CREATE TABLE IF NOT EXISTS weekly_words (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL CHECK (word ~ '^[A-Z]{5}$'),
  starts_on TEXT NOT NULL UNIQUE CHECK (starts_on ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  attempt_id TEXT NOT NULL UNIQUE,
  word_id INTEGER NOT NULL REFERENCES weekly_words(id),
  player_name TEXT NOT NULL,
  guesses INTEGER NOT NULL CHECK (guesses BETWEEN 1 AND 6),
  won SMALLINT NOT NULL CHECK (won IN (0, 1)),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scores_word_completed
  ON scores (word_id, completed_at);
