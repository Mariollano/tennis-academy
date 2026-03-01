ALTER TABLE `schedule_slots` MODIFY COLUMN `maxParticipants` int NOT NULL DEFAULT 12;--> statement-breakpoint
ALTER TABLE `schedule_slots` ADD `title` varchar(300);--> statement-breakpoint
ALTER TABLE `schedule_slots` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;