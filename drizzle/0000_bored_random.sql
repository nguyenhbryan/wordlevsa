CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attempt_id` text NOT NULL,
	`word_id` integer NOT NULL,
	`player_name` text NOT NULL,
	`guesses` integer NOT NULL,
	`won` integer NOT NULL,
	`duration_seconds` integer DEFAULT 0 NOT NULL,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`word_id`) REFERENCES `weekly_words`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_scores_attempt_id` ON `scores` (`attempt_id`);--> statement-breakpoint
CREATE INDEX `idx_scores_word_completed` ON `scores` (`word_id`,`completed_at`);--> statement-breakpoint
CREATE TABLE `weekly_words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`starts_on` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_weekly_words_starts_on` ON `weekly_words` (`starts_on`);--> statement-breakpoint
PRAGMA optimize;
