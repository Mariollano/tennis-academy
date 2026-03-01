CREATE TABLE `blocked_times` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`blockedDate` date NOT NULL,
	`startTime` time,
	`endTime` time,
	`isAllDay` boolean NOT NULL DEFAULT false,
	`affectsPrivateLessons` boolean NOT NULL DEFAULT true,
	`affects105Clinic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blocked_times_id` PRIMARY KEY(`id`)
);
