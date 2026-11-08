CREATE TYPE "public"."auth_attempt_kind" AS ENUM('setup', 'password', 'second_factor');--> statement-breakpoint
CREATE TABLE "account" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"totp_secret_encrypted" text NOT NULL,
	"totp_last_used_step" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_single_row" CHECK ("account"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "auth_attempt" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" "auth_attempt_kind" NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_code" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_code_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_agent" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "session_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "setup_code" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_attempt_attempted_at_idx" ON "auth_attempt" USING btree ("attempted_at");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");