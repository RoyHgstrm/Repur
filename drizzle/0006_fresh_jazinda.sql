CREATE TABLE "repur2_log" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"level" varchar(50) NOT NULL,
	"message" varchar(2048) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
