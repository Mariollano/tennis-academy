CREATE TABLE `gift_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`purchasedByUserId` int NOT NULL,
	`recipientName` varchar(200) NOT NULL,
	`recipientEmail` varchar(320),
	`recipientMessage` text,
	`programType` varchar(100) NOT NULL,
	`programLabel` varchar(200) NOT NULL,
	`amountInCents` int NOT NULL,
	`status` enum('active','redeemed','expired') NOT NULL DEFAULT 'active',
	`redeemedByUserId` int,
	`redeemedAt` timestamp,
	`stripePaymentIntentId` varchar(200),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gift_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `gift_cards_code_unique` UNIQUE(`code`)
);
