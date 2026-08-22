CREATE TABLE `meditation_comment_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meditation_comment_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_meditation_comment_like` UNIQUE(`commentId`,`userId`)
);
--> statement-breakpoint
ALTER TABLE `meditation_comments` ADD `parentCommentId` int;--> statement-breakpoint
ALTER TABLE `meditation_comments` ADD `likeCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `meditation_comment_like_comment_idx` ON `meditation_comment_likes` (`commentId`);--> statement-breakpoint
CREATE INDEX `meditation_comment_thread_idx` ON `meditation_comments` (`meditationId`,`parentCommentId`,`createdAt`);