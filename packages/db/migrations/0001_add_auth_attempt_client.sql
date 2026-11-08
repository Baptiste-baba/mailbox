-- Failed attempts are short-lived and tell no device: forgotten, so that every row has a client.
DELETE FROM "auth_attempt";--> statement-breakpoint
ALTER TABLE "auth_attempt" ADD COLUMN "client" text NOT NULL;
