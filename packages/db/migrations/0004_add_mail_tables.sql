CREATE TYPE "public"."mail_provider" AS ENUM('gmail');--> statement-breakpoint
CREATE TYPE "public"."mailbox_status" AS ENUM('connected', 'reconnect_required');--> statement-breakpoint
CREATE TYPE "public"."palette_color" AS ENUM('navy', 'azur', 'ciel', 'glacier', 'slate');--> statement-breakpoint
CREATE TABLE "attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"content_id" text,
	CONSTRAINT "attachment_position_unique" UNIQUE("message_id","position")
);
--> statement-breakpoint
CREATE TABLE "folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mailbox_id" uuid NOT NULL,
	"provider_folder_id" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "folder_provider_id_unique" UNIQUE("mailbox_id","provider_folder_id")
);
--> statement-breakpoint
CREATE TABLE "mailbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "mail_provider" NOT NULL,
	"address" text NOT NULL,
	"name" text NOT NULL,
	"color" "palette_color" NOT NULL,
	"status" "mailbox_status" DEFAULT 'connected' NOT NULL,
	"refresh_token_encrypted" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mailbox_provider_address_unique" UNIQUE("provider","address")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"mailbox_id" uuid NOT NULL,
	"provider_message_id" text NOT NULL,
	"from_name" text NOT NULL,
	"from_address" text NOT NULL,
	"to_recipients" jsonb NOT NULL,
	"cc_recipients" jsonb NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"snippet" text NOT NULL,
	"body_text" text,
	"body_html" text,
	"unread" boolean NOT NULL,
	"in_inbox" boolean NOT NULL,
	CONSTRAINT "message_provider_id_unique" UNIQUE("mailbox_id","provider_message_id")
);
--> statement-breakpoint
CREATE TABLE "message_folder" (
	"message_id" uuid NOT NULL,
	"folder_id" uuid NOT NULL,
	CONSTRAINT "message_folder_pk" PRIMARY KEY("message_id","folder_id")
);
--> statement-breakpoint
CREATE TABLE "thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mailbox_id" uuid NOT NULL,
	"provider_thread_id" text NOT NULL,
	"subject" text NOT NULL,
	"sender_name" text NOT NULL,
	"sender_address" text NOT NULL,
	"snippet" text NOT NULL,
	"last_message_at" timestamp with time zone NOT NULL,
	"message_count" integer NOT NULL,
	"unread" boolean NOT NULL,
	"in_inbox" boolean NOT NULL,
	"has_attachments" boolean NOT NULL,
	CONSTRAINT "thread_provider_id_unique" UNIQUE("mailbox_id","provider_thread_id")
);
--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_mailbox_id_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_mailbox_id_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_folder" ADD CONSTRAINT "message_folder_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_folder" ADD CONSTRAINT "message_folder_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_mailbox_id_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_thread_idx" ON "message" USING btree ("thread_id","sent_at");--> statement-breakpoint
CREATE INDEX "message_folder_folder_idx" ON "message_folder" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "thread_recent_idx" ON "thread" USING btree ("last_message_at","id");--> statement-breakpoint
CREATE INDEX "thread_mailbox_recent_idx" ON "thread" USING btree ("mailbox_id","last_message_at","id");--> statement-breakpoint
CREATE INDEX "thread_inbox_idx" ON "thread" USING btree ("last_message_at","id") WHERE "thread"."in_inbox";--> statement-breakpoint
CREATE INDEX "thread_mailbox_inbox_idx" ON "thread" USING btree ("mailbox_id","last_message_at","id") WHERE "thread"."in_inbox";--> statement-breakpoint
CREATE INDEX "thread_unread_idx" ON "thread" USING btree ("last_message_at","id") WHERE "thread"."unread";--> statement-breakpoint
CREATE INDEX "thread_mailbox_unread_idx" ON "thread" USING btree ("mailbox_id","last_message_at","id") WHERE "thread"."unread";