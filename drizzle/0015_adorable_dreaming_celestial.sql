CREATE TABLE `weekly_newsletter_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`status` enum('scheduled','sending','sent','partial','skipped','failed') NOT NULL DEFAULT 'scheduled',
	`subject` varchar(500) NOT NULL,
	`sender` varchar(500) NOT NULL,
	`scheduledFor` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`totalRecipients` int NOT NULL DEFAULT 0,
	`sentCount` int NOT NULL DEFAULT 0,
	`deliveredCount` int NOT NULL DEFAULT 0,
	`bouncedCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`skippedCount` int NOT NULL DEFAULT 0,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_newsletter_campaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `weekly_newsletter_campaigns_issueId_unique` UNIQUE(`issueId`)
);
--> statement-breakpoint
CREATE TABLE `weekly_newsletter_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`subscriberId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`lang` enum('en','ko') NOT NULL,
	`status` enum('queued','sent','delivered','bounced','failed','suppressed','unsubscribed') NOT NULL DEFAULT 'queued',
	`providerEmailId` varchar(128),
	`attemptCount` int NOT NULL DEFAULT 0,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`bouncedAt` timestamp,
	`failureReason` varchar(500),
	`providerEventAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_newsletter_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `weekly_newsletter_deliveries_providerEmailId_unique` UNIQUE(`providerEmailId`),
	CONSTRAINT `weekly_newsletter_delivery_campaign_subscriber_unique` UNIQUE(`campaignId`,`subscriberId`)
);
--> statement-breakpoint
CREATE TABLE `weekly_newsletter_delivery_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerEventId` varchar(128) NOT NULL,
	`providerEmailId` varchar(128),
	`eventType` varchar(64) NOT NULL,
	`occurredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_newsletter_delivery_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `weekly_newsletter_delivery_events_providerEventId_unique` UNIQUE(`providerEventId`)
);
--> statement-breakpoint
CREATE TABLE `weekly_newsletter_delivery_settings` (
	`id` int NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`deliveryEnabled` int NOT NULL DEFAULT 0,
	`lastRunAt` timestamp,
	`lastSuccessAt` timestamp,
	`lastError` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_newsletter_delivery_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `weekly_newsletter_delivery_settings_scheduleCronTaskUid_unique` UNIQUE(`scheduleCronTaskUid`)
);
--> statement-breakpoint
CREATE INDEX `weekly_newsletter_campaign_status_scheduled_idx` ON `weekly_newsletter_campaigns` (`status`,`scheduledFor`);--> statement-breakpoint
CREATE INDEX `weekly_newsletter_delivery_campaign_status_idx` ON `weekly_newsletter_deliveries` (`campaignId`,`status`);--> statement-breakpoint
CREATE INDEX `weekly_newsletter_delivery_subscriber_status_idx` ON `weekly_newsletter_deliveries` (`subscriberId`,`status`);--> statement-breakpoint
CREATE INDEX `weekly_newsletter_delivery_event_email_idx` ON `weekly_newsletter_delivery_events` (`providerEmailId`,`createdAt`);