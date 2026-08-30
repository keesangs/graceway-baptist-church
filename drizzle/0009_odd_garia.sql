CREATE TABLE `gallery_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`albumId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSize` int NOT NULL,
	`captionKo` varchar(500),
	`captionEn` varchar(500),
	`altTextKo` varchar(500),
	`altTextEn` varchar(500),
	`source` enum('manual','google_photos') NOT NULL DEFAULT 'manual',
	`sourceItemId` varchar(255),
	`sortOrder` int NOT NULL DEFAULT 0,
	`status` enum('draft','published','hidden') NOT NULL DEFAULT 'draft',
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gallery_photos_id` PRIMARY KEY(`id`),
	CONSTRAINT `gallery_photo_source_item_unique` UNIQUE(`source`,`sourceItemId`)
);
--> statement-breakpoint
CREATE TABLE `photo_albums` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titleKo` varchar(255) NOT NULL,
	`titleEn` varchar(255),
	`descriptionKo` text,
	`descriptionEn` text,
	`albumDate` varchar(10),
	`category` enum('worship','prayer','fellowship','ministry','special','community','other') NOT NULL DEFAULT 'other',
	`status` enum('draft','published','hidden') NOT NULL DEFAULT 'draft',
	`coverPhotoId` int,
	`createdBy` int NOT NULL,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `photo_albums_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `gallery_photo_album_status_order_idx` ON `gallery_photos` (`albumId`,`status`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `photo_album_status_date_idx` ON `photo_albums` (`status`,`albumDate`);--> statement-breakpoint
CREATE INDEX `photo_album_category_status_idx` ON `photo_albums` (`category`,`status`);