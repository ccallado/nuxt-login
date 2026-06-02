ALTER TABLE "users" ALTER COLUMN "avatar" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "nombre" SET DEFAULT 'vacío';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "modifiedAt" timestamp DEFAULT now() NOT NULL;