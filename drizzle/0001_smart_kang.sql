CREATE TABLE `importQuotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`ncm` varchar(12) NOT NULL,
	`description` text,
	`payload` json NOT NULL,
	`results` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `importQuotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `importReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`userId` int NOT NULL,
	`fileKey` text NOT NULL,
	`fileUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `importReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taxRates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ncm` varchar(12) NOT NULL,
	`description` text NOT NULL,
	`iiRate` double NOT NULL DEFAULT 0,
	`ipiRate` double NOT NULL DEFAULT 0,
	`source` varchar(120) NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taxRates_id` PRIMARY KEY(`id`),
	CONSTRAINT `taxRates_ncm_unique` UNIQUE(`ncm`)
);
--> statement-breakpoint
ALTER TABLE `importQuotes` ADD CONSTRAINT `importQuotes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `importReports` ADD CONSTRAINT `importReports_quoteId_importQuotes_id_fk` FOREIGN KEY (`quoteId`) REFERENCES `importQuotes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `importReports` ADD CONSTRAINT `importReports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;