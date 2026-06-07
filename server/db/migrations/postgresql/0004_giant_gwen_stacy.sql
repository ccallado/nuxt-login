CREATE TABLE "account" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" integer,
	"emailVerified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "unique_prov_provaccount" UNIQUE("provider","providerAccountId")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;