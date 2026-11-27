ALTER TABLE "mailbox" ADD COLUMN "initial_sync_started_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "mailbox" ADD COLUMN "sync_cursor" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "synced_at" timestamp with time zone DEFAULT now() NOT NULL;