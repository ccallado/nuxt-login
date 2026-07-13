ALTER TABLE "propiedades" RENAME COLUMN "user_id" TO "propietarioId";--> statement-breakpoint
ALTER TABLE "propiedades" DROP CONSTRAINT "propiedades_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "propiedades" ADD COLUMN "creadaPorId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "propiedades" ADD COLUMN "modificadoPorId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "propiedades" ADD CONSTRAINT "propiedades_propietarioId_users_id_fk" FOREIGN KEY ("propietarioId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propiedades" ADD CONSTRAINT "propiedades_creadaPorId_users_id_fk" FOREIGN KEY ("creadaPorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propiedades" ADD CONSTRAINT "propiedades_modificadoPorId_users_id_fk" FOREIGN KEY ("modificadoPorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;