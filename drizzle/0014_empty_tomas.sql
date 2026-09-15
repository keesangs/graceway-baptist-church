CREATE TABLE `newsletter_subscription_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriberId` int NOT NULL,
	`purpose` enum('confirm','unsubscribe') NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletter_subscription_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscription_tokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `newsletter_subscribers` ADD `status` enum('pending','active','unsubscribed','suppressed') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `newsletter_subscribers` ADD `confirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `newsletter_subscribers` ADD `unsubscribedAt` timestamp;--> statement-breakpoint
ALTER TABLE `newsletter_subscribers` ADD `lastRequestAt` timestamp;--> statement-breakpoint
UPDATE `newsletter_subscribers` SET `status` = 'unsubscribed', `unsubscribedAt` = `updatedAt` WHERE `isActive` = 0;--> statement-breakpoint
UPDATE `newsletter_subscribers` SET `confirmedAt` = `createdAt`, `lastRequestAt` = `createdAt` WHERE `isActive` = 1;--> statement-breakpoint
CREATE INDEX `newsletter_token_subscriber_purpose_created_idx` ON `newsletter_subscription_tokens` (`subscriberId`,`purpose`,`createdAt`);--> statement-breakpoint
CREATE INDEX `newsletter_subscriber_status_created_idx` ON `newsletter_subscribers` (`status`,`createdAt`);
