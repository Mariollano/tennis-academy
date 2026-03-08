ALTER TABLE `bookings` ADD `coachNotes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `newsletterOptIn` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `newsletterOptInAt` timestamp;