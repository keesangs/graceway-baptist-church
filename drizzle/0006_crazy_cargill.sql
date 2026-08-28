CREATE TABLE `youtube_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoKind` enum('sermon','worship') NOT NULL,
	`videoId` varchar(32) NOT NULL,
	`playlistItemId` varchar(128) NOT NULL,
	`title` varchar(500) NOT NULL,
	`publishedAt` timestamp NOT NULL,
	`thumbnailUrl` varchar(1024) NOT NULL,
	`playlistPosition` int NOT NULL,
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `youtube_videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtube_video_kind_unique` UNIQUE(`videoKind`,`videoId`)
);
--> statement-breakpoint
CREATE INDEX `youtube_video_kind_published_idx` ON `youtube_videos` (`videoKind`,`publishedAt`);