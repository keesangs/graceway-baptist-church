CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titleKo` varchar(255) NOT NULL,
	`titleEn` varchar(255),
	`startAt` timestamp NOT NULL,
	`endAt` timestamp,
	`allDay` int NOT NULL DEFAULT 0,
	`venueKo` varchar(255),
	`venueEn` varchar(255),
	`descriptionKo` text,
	`descriptionEn` text,
	`eventType` enum('worship','prayer','fellowship','ministry','special','other') NOT NULL DEFAULT 'other',
	`status` enum('draft','published','cancelled') NOT NULL DEFAULT 'draft',
	`recurrence` enum('none','weekly') NOT NULL DEFAULT 'none',
	`recurrenceUntil` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `calendar_event_status_start_idx` ON `calendar_events` (`status`,`startAt`);--> statement-breakpoint
CREATE INDEX `calendar_event_recurrence_until_idx` ON `calendar_events` (`recurrence`,`recurrenceUntil`);