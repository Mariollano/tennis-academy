ALTER TABLE `newsletters` MODIFY COLUMN `status` enum('draft','published','sent') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `newsletters` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `newsletters` ADD `slug` varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE `newsletters` ADD `season` varchar(100);--> statement-breakpoint
ALTER TABLE `newsletters` ADD `htmlContent` text;--> statement-breakpoint
ALTER TABLE `newsletters` ADD `publishedAt` timestamp;--> statement-breakpoint
ALTER TABLE `newsletters` ADD CONSTRAINT `newsletters_slug_unique` UNIQUE(`slug`);