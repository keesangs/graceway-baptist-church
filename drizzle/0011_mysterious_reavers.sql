CREATE TABLE `meditation_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meditationId` int NOT NULL,
	`userId` int NOT NULL,
	`questionOne` text NOT NULL,
	`questionTwo` text NOT NULL,
	`questionThree` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meditation_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `meditation_note_user_meditation_unique` UNIQUE(`userId`,`meditationId`)
);
--> statement-breakpoint
CREATE INDEX `meditation_note_user_updated_idx` ON `meditation_notes` (`userId`,`updatedAt`);