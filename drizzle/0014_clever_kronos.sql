CREATE TABLE `announcement_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcement_reads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`body` text NOT NULL,
	`type` enum('info','cancellation','schedule_change','urgent') NOT NULL DEFAULT 'info',
	`sendEmail` boolean NOT NULL DEFAULT true,
	`sendSms` boolean NOT NULL DEFAULT false,
	`targetProgram` varchar(100),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`emailsSent` int NOT NULL DEFAULT 0,
	`smsSent` int NOT NULL DEFAULT 0,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
