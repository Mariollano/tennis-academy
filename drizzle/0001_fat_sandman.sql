CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programId` int NOT NULL,
	`scheduleSlotId` int,
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`bookingDate` timestamp NOT NULL DEFAULT (now()),
	`sessionDate` date,
	`sessionStartTime` time,
	`sessionEndTime` time,
	`weekStartDate` date,
	`sharedStudentCount` int DEFAULT 1,
	`stringProvidedBy` enum('academy','customer'),
	`merchandiseSize` varchar(10),
	`quantity` int DEFAULT 1,
	`notes` text,
	`totalAmountCents` int NOT NULL,
	`paidAt` timestamp,
	`stripePaymentIntentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mental_coaching_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`content` text NOT NULL,
	`category` enum('mindset','focus','pressure','confidence','routine','general') DEFAULT 'general',
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mental_coaching_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `merchandise` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`type` enum('sweatshirt','tshirt','other') NOT NULL,
	`priceInCents` int NOT NULL,
	`description` text,
	`imageUrl` text,
	`availableSizes` text,
	`stockCount` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `merchandise_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`userId` int NOT NULL,
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'usd',
	`status` enum('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`stripeChargeId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`type` enum('private_lesson','clinic_105','junior_daily','junior_weekly','summer_camp_daily','summer_camp_weekly','after_camp','mental_coaching','tournament_attendance','stringing','merchandise') NOT NULL,
	`description` text,
	`priceInCents` int NOT NULL,
	`durationMinutes` int,
	`startTime` time,
	`endTime` time,
	`season` enum('fall','spring','summer','year_round') DEFAULT 'year_round',
	`isActive` boolean NOT NULL DEFAULT true,
	`maxParticipants` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedule_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int NOT NULL,
	`slotDate` date NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`maxParticipants` int NOT NULL DEFAULT 10,
	`currentParticipants` int NOT NULL DEFAULT 0,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schedule_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_broadcasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sentBy` int NOT NULL,
	`message` text NOT NULL,
	`recipientCount` int NOT NULL DEFAULT 0,
	`status` enum('draft','sent','failed') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_broadcasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournament_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentName` varchar(300) NOT NULL,
	`tournamentDate` date NOT NULL,
	`location` text,
	`estimatedHours` decimal(4,1) NOT NULL,
	`travelHours` decimal(4,1) DEFAULT '0',
	`estimatedExpensesCents` int DEFAULT 0,
	`status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tournament_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournament_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentBookingId` int NOT NULL,
	`userId` int NOT NULL,
	`bookingId` int,
	`shareAmountCents` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tournament_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `smsOptIn` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `smsOptInAt` timestamp;