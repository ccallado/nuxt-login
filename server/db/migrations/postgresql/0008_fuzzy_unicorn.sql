CREATE TABLE "master_roles" (
	"name" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"authorizations" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_to_roles" (
	"user_id" integer NOT NULL,
	"role_name" text NOT NULL,
	CONSTRAINT "users_to_roles_user_id_role_name_pk" PRIMARY KEY("user_id","role_name")
);
--> statement-breakpoint
ALTER TABLE "users_to_roles" ADD CONSTRAINT "users_to_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_roles" ADD CONSTRAINT "users_to_roles_role_name_master_roles_name_fk" FOREIGN KEY ("role_name") REFERENCES "public"."master_roles"("name") ON DELETE cascade ON UPDATE no action;