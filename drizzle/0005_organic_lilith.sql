CREATE TABLE `promo_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`discountType` enum('percent','fixed','free') NOT NULL,
	`discountValue` int NOT NULL DEFAULT 0,
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`appliesTo` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	CONSTRAINT `promo_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promo_codes_code_unique` UNIQUE(`code`)
);
