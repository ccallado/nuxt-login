CREATE TABLE "sap_object_fields" (
	"object_name" text NOT NULL,
	"field_name" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "sap_object_fields_object_name_field_name_pk" PRIMARY KEY("object_name","field_name")
);
--> statement-breakpoint
CREATE TABLE "sap_objects_master" (
	"object_name" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sap_object_fields" ADD CONSTRAINT "sap_object_fields_object_name_sap_objects_master_object_name_fk" FOREIGN KEY ("object_name") REFERENCES "public"."sap_objects_master"("object_name") ON DELETE cascade ON UPDATE no action;