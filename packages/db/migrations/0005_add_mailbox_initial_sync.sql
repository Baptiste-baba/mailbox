ALTER TABLE "mailbox" ADD COLUMN "initial_sync_page_token" text;--> statement-breakpoint
ALTER TABLE "mailbox" ADD COLUMN "initial_sync_completed_at" timestamp with time zone;