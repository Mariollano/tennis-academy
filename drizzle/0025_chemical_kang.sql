ALTER TABLE `ai_membership_settings` ADD `stripeWebhookEndpointId` varchar(255);--> statement-breakpoint
ALTER TABLE `ai_membership_settings` ADD `stripeWebhookAccountId` varchar(255);--> statement-breakpoint
ALTER TABLE `ai_membership_settings` ADD `encryptedWebhookSecret` text;