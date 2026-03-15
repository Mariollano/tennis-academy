CREATE TABLE `ical_sync_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`icalUrl` text NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`lastSyncedAt` timestamp,
	`lastSyncStatus` varchar(50),
	`lastSyncMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ical_sync_settings_id` PRIMARY KEY(`id`)
);
