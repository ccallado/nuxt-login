CREATE TABLE "propiedades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calle" text NOT NULL,
	"número" text,
	"escalera" text,
	"planta" text,
	"letra" text,
	"descripción" text NOT NULL,
	"user_id" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"modifiedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "propiedades" ADD CONSTRAINT "propiedades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;