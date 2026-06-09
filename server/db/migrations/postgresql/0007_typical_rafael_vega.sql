ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT ARRAY['user']::text[];