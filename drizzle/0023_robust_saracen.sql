CREATE TABLE `ai_checkout_intents` (
	`id` varchar(64) NOT NULL,
	`claimHash` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`origin` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `ai_checkout_intents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_guide_assets` (
	`slot` varchar(40) NOT NULL,
	`encryptedStorageKey` varchar(500) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_guide_assets_slot` PRIMARY KEY(`slot`)
);
--> statement-breakpoint
CREATE TABLE `ai_login_tokens` (
	`hash` varchar(64) NOT NULL,
	`memberId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	CONSTRAINT `ai_login_tokens_hash` PRIMARY KEY(`hash`)
);
--> statement-breakpoint
CREATE TABLE `ai_member_sessions` (
	`hash` varchar(64) NOT NULL,
	`memberId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `ai_member_sessions_hash` PRIMARY KEY(`hash`)
);
--> statement-breakpoint
CREATE TABLE `ai_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_members_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `ai_membership_settings` (
	`id` int NOT NULL,
	`checkoutEnabled` boolean NOT NULL DEFAULT false,
	`promptLibrary` mediumtext,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_membership_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_subscriptions` (
	`id` varchar(255) NOT NULL,
	`memberId` int NOT NULL,
	`customerId` varchar(255) NOT NULL,
	`status` varchar(40) NOT NULL,
	`paidThrough` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`livemode` boolean NOT NULL DEFAULT false,
	`welcomeSentAt` timestamp,
	`welcomeLeaseAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_subscriptions_id` PRIMARY KEY(`id`)
);
