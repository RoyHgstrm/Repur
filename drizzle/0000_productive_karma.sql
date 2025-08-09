CREATE TYPE "public"."CompanyListingStatus" AS ENUM('DRAFT', 'ACTIVE', 'SOLD', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."TradeInStatus" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CONTACTED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "repur2_listing" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(2048) NOT NULL,
	"status" "CompanyListingStatus" DEFAULT 'DRAFT' NOT NULL,
	"cpu" varchar(255) NOT NULL,
	"gpu" varchar(255) NOT NULL,
	"ram" varchar(255) NOT NULL,
	"storage" varchar(255) NOT NULL,
	"motherboard" varchar(255),
	"power_supply" varchar(255) NOT NULL,
	"case_model" varchar(255),
	"base_price" numeric NOT NULL,
	"discount_amount" numeric,
	"discount_start" timestamp with time zone,
	"discount_end" timestamp with time zone,
	"condition" "Condition" NOT NULL,
	"images" varchar(2048)[] DEFAULT '{}'::text[] NOT NULL,
	"seller_id" varchar(255),
	"evaluated_by_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repur2_purchase" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_listing_id" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"purchase_price" numeric NOT NULL,
	"payment_method" varchar(255) NOT NULL,
	"shipping_address" varchar(255) NOT NULL,
	"status" varchar(255) DEFAULT 'PROCESSING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repur2_trade_in_listings" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(2048),
	"cpu" varchar(255) NOT NULL,
	"gpu" varchar(255) NOT NULL,
	"ram" varchar(255) NOT NULL,
	"storage" varchar(255) NOT NULL,
	"power_supply" varchar(255),
	"case_model" varchar(255),
	"condition" "TradeInCondition" NOT NULL,
	"estimated_value" numeric,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(255),
	"status" "TradeInStatus" DEFAULT 'PENDING' NOT NULL,
	"evaluated_by_id" varchar(255),
	"evaluation_notes" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repur2_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"role" varchar(50) DEFAULT 'CUSTOMER' NOT NULL,
	"phone" varchar(255),
	"address" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repur2_user_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "repur2_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "repur2_warranty" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"purchase_id" varchar(255) NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" varchar(255) DEFAULT 'ACTIVE' NOT NULL,
	"terms" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repur2_listing" ADD CONSTRAINT "repur2_listing_seller_id_repur2_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."repur2_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repur2_listing" ADD CONSTRAINT "repur2_listing_evaluated_by_id_repur2_user_id_fk" FOREIGN KEY ("evaluated_by_id") REFERENCES "public"."repur2_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repur2_purchase" ADD CONSTRAINT "repur2_purchase_company_listing_id_repur2_listing_id_fk" FOREIGN KEY ("company_listing_id") REFERENCES "public"."repur2_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repur2_purchase" ADD CONSTRAINT "repur2_purchase_user_id_repur2_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."repur2_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repur2_trade_in_listings" ADD CONSTRAINT "repur2_trade_in_listings_user_id_repur2_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."repur2_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repur2_trade_in_listings" ADD CONSTRAINT "repur2_trade_in_listings_evaluated_by_id_repur2_user_id_fk" FOREIGN KEY ("evaluated_by_id") REFERENCES "public"."repur2_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repur2_warranty" ADD CONSTRAINT "repur2_warranty_purchase_id_repur2_purchase_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."repur2_purchase"("id") ON DELETE cascade ON UPDATE no action;