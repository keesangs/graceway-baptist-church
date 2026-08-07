CREATE TABLE `daily_meditations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meditationDate` varchar(10) NOT NULL,
	`scriptureReference` varchar(255) NOT NULL,
	`scriptureText` text NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`authorId` int NOT NULL,
	`likeCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_meditations_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_meditations_meditationDate_unique` UNIQUE(`meditationDate`)
);
--> statement-breakpoint
CREATE TABLE `meditation_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meditationId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meditation_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meditation_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meditationId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meditation_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_meditation_like` UNIQUE(`meditationId`,`userId`)
);
