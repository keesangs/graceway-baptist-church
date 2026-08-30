CREATE TABLE `google_photos_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`googleAccountEmail` varchar(320),
	`encryptedRefreshToken` text NOT NULL,
	`scope` varchar(1024) NOT NULL,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_photos_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_photos_connections_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `google_photos_oauth_states` (
	`state` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `google_photos_oauth_states_state` PRIMARY KEY(`state`)
);
--> statement-breakpoint
CREATE INDEX `google_photos_oauth_state_expires_idx` ON `google_photos_oauth_states` (`expiresAt`);