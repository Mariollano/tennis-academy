CREATE TABLE `doubles_league_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionDate` date NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`dayOfWeek` enum('tuesday','thursday','saturday') NOT NULL,
	`priceInCents` int NOT NULL DEFAULT 1500,
	`isActive` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doubles_league_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doubles_league_signups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`playerName` varchar(200) NOT NULL,
	`playerEmail` varchar(320) NOT NULL,
	`playerPhone` varchar(20),
	`userId` int,
	`status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('card','cash','check') DEFAULT 'card',
	`stripeSessionId` varchar(255),
	`paidAt` timestamp,
	`partnerId` int,
	`courtNumber` int,
	`matchNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doubles_league_signups_id` PRIMARY KEY(`id`)
);
