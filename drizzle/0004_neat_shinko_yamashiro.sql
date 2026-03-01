CREATE TABLE `session_waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleSlotId` int NOT NULL,
	`userId` int NOT NULL,
	`programId` int NOT NULL,
	`status` enum('waiting','notified','converted','removed') NOT NULL DEFAULT 'waiting',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`notifiedAt` timestamp,
	CONSTRAINT `session_waitlist_id` PRIMARY KEY(`id`)
);
