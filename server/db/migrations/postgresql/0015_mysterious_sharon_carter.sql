CREATE TABLE "navigation_menu" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "navigation_menu_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"label" text NOT NULL,
	"icon" text,
	"to" text,
	"obj_req" text,
	"act_req" text,
	"var_req" text,
	"parent_id" integer,
	"is_group_two" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
