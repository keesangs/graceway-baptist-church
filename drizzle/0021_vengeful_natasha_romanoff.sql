CREATE TABLE `discord_transcript_runs` (
	`id` varchar(36) NOT NULL,
	`transcriptId` int NOT NULL,
	`paragraphIndex` int NOT NULL,
	`status` enum('queued','playing','completed','failed','cancelled','interrupted') NOT NULL,
	`sentenceCount` int NOT NULL,
	`completedCount` int NOT NULL DEFAULT 0,
	`error` text,
	`runtimeId` varchar(32) NOT NULL,
	`requestedBy` int NOT NULL,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `discord_transcript_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discord_transcripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`filename` varchar(255),
	`paragraphs` json NOT NULL,
	`nextParagraph` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `discord_transcripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `discord_transcript_run_idx` ON `discord_transcript_runs` (`transcriptId`,`createdAt`);