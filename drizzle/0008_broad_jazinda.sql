CREATE TABLE `weekly_newsletter_issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueDate` varchar(10) NOT NULL,
	`titleKo` varchar(255) NOT NULL,
	`titleEn` varchar(255),
	`sourceFilename` varchar(512) NOT NULL,
	`driveFileId` varchar(128),
	`sourceModifiedAt` timestamp,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`fileSize` int NOT NULL,
	`status` enum('draft','published','hidden') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_newsletter_issues_id` PRIMARY KEY(`id`),
	CONSTRAINT `weekly_newsletter_issues_driveFileId_unique` UNIQUE(`driveFileId`)
);
--> statement-breakpoint
CREATE TABLE `weekly_newsletter_sync_settings` (
	`id` int NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`lastRunAt` timestamp,
	`lastSuccessAt` timestamp,
	`lastError` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_newsletter_sync_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `weekly_newsletter_sync_settings_scheduleCronTaskUid_unique` UNIQUE(`scheduleCronTaskUid`)
);
--> statement-breakpoint
CREATE INDEX `weekly_newsletter_issue_date_idx` ON `weekly_newsletter_issues` (`issueDate`);--> statement-breakpoint
CREATE INDEX `weekly_newsletter_status_issue_date_idx` ON `weekly_newsletter_issues` (`status`,`issueDate`);