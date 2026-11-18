CREATE TABLE `discord_tts_preferences` (
	`id` int NOT NULL,
	`controls` json NOT NULL,
	`updatedAtMs` bigint NOT NULL,
	CONSTRAINT `discord_tts_preferences_id` PRIMARY KEY(`id`)
);
