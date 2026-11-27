CREATE TYPE "public"."sync_failure_reason" AS ENUM('provider_unavailable', 'provider_not_configured', 'unexpected');--> statement-breakpoint
ALTER TABLE "mailbox" ADD COLUMN "initial_sync_total" integer;--> statement-breakpoint
ALTER TABLE "mailbox" ADD COLUMN "last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "mailbox" ADD COLUMN "sync_failing_since" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "mailbox" ADD COLUMN "sync_failure_reason" "sync_failure_reason";