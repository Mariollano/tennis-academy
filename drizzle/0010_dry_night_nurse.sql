CREATE TABLE `scheduled_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`userId` int NOT NULL,
	`sendAt` timestamp NOT NULL,
	`status` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`emailSent` boolean NOT NULL DEFAULT false,
	`smsSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`error` text,
	CONSTRAINT `scheduled_reminders_id` PRIMARY KEY(`id`)
);
