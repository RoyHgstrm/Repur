// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { pgTableCreator, timestamp, varchar, numeric, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/**
 * This is an example of how to use the `pgTableCreator` helper to create your own custom `pgTable`
 * wrapper. `pgTableCreator` will automatically add `createdAt` and `updatedAt` columns to all tables
 * and set `id` as a `varchar` with a default value of `createId()` from `nanoid`.
 */
export const createTable = pgTableCreator((name) => `repur2_${name}`);

// ENUMS
// Defines the possible statuses for a company listing.
export const listingStatusEnum = pgEnum("CompanyListingStatus", [
  "DRAFT",
  "ACTIVE",
  "SOLD",
  "ARCHIVED",
]);

// Defines the possible statuses for a trade-in listing.
export const tradeInStatusEnum = pgEnum("TradeInStatus", [
  "PENDING", // User submitted, awaiting review by employee
  "ACCEPTED", // Employee accepted the offer
  "REJECTED", // Employee rejected the offer
  "CONTACTED", // Employee has contacted the user
  "COMPLETED", // PC received and transaction finalized
]);

// TABLES
// User model
export const users = createTable("user", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("CUSTOMER").notNull(),
  phone: varchar("phone", { length: 255 }),
  address: varchar("address", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Listing model for PC sales (now company listings)
export const listings = createTable("listing", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 2048 }).notNull(),
  status: listingStatusEnum("status").default("DRAFT").notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  cpu: varchar("cpu", { length: 255 }).notNull(),
  gpu: varchar("gpu", { length: 255 }).notNull(),
  ram: varchar("ram", { length: 255 }).notNull(),
  storage: varchar("storage", { length: 255 }).notNull(),
  motherboard: varchar("motherboard", { length: 255 }), // Made optional
  powerSupply: varchar("power_supply", { length: 255 }).notNull(),
  caseModel: varchar("case_model", { length: 255 }), // Made optional
  basePrice: numeric("base_price").notNull(),
  views: numeric("views").default("0").notNull(),
  // Optional campaign discount fields
  discountAmount: numeric("discount_amount"),
  discountStart: timestamp("discount_start", { withTimezone: true }),
  discountEnd: timestamp("discount_end", { withTimezone: true }),
  condition: pgEnum("Condition", ["Uusi", "Kuin uusi", "Hyvä", "Tyydyttävä", "Huono"])("condition").notNull(),
  images: varchar("images", { length: 2048 }).array().default(sql`'{}'::text[]`).notNull(),
  sellerId: varchar("seller_id", { length: 255 }).references(() => users.id), // Company's internal seller (employee/admin)
  evaluatedById: varchar("evaluated_by_id", { length: 255 }).references(() => users.id), // Employee who evaluated this listing
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Trade-In Listings table (new table for user submissions)
export const tradeInListings = createTable("trade_in_listings", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: 'cascade' }).notNull(), // User who submitted the trade-in
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 2048 }),
  cpu: varchar("cpu", { length: 255 }).notNull(),
  gpu: varchar("gpu", { length: 255 }).notNull(),
  ram: varchar("ram", { length: 255 }).notNull(),
  storage: varchar("storage", { length: 255 }).notNull(),
  powerSupply: varchar("power_supply", { length: 255 }),
  caseModel: varchar("case_model", { length: 255 }),
  condition: pgEnum("TradeInCondition", ["Uusi", "Kuin uusi", "Hyvä", "Tyydyttävä", "Huono", "En tiedä"])("condition").notNull(),
  estimatedValue: numeric("estimated_value"), // Estimated value from the calculator
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 255 }),
  status: tradeInStatusEnum("status").default("PENDING").notNull(), // PENDING, ACCEPTED, REJECTED, CONTACTED, COMPLETED
  evaluatedById: varchar("evaluated_by_id", { length: 255 }).references(() => users.id), // Employee who evaluated this trade-in
  evaluationNotes: varchar("evaluation_notes", { length: 2048 }), // Added evaluation notes
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Purchase model for users buying PCs
export const purchases = createTable("purchase", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  companyListingId: varchar("company_listing_id", { length: 255 }).references(() => listings.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
  purchasePrice: numeric("purchase_price").notNull(),
  paymentMethod: varchar("payment_method", { length: 255 }).notNull(),
  shippingAddress: varchar("shipping_address", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("PROCESSING").notNull(), // e.g., 'PROCESSING', 'COMPLETED', 'CANCELLED'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Warranty model for purchased PCs
export const warranties = createTable("warranty", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  purchaseId: varchar("purchase_id", { length: 255 }).references(() => purchases.id, { onDelete: 'cascade' }).notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).defaultNow().notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 255 }).default("ACTIVE").notNull(), // e.g., 'ACTIVE', 'EXPIRED', 'CLAIMED'
  terms: varchar("terms", { length: 2048 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// RELATIONSHIPS
export const usersRelations = relations(users, ({ many }) => ({
  companyListings: many(listings, { relationName: 'seller' }),
  evaluatedCompanyListings: many(listings, { relationName: 'evaluatedBy' }),
  tradeInListings: many(tradeInListings, { relationName: 'user' }),
  evaluatedTradeIns: many(tradeInListings, { relationName: 'evaluatedBy' }),
  purchases: many(purchases, { relationName: 'buyer' }),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(users, { fields: [listings.sellerId], references: [users.id], relationName: 'seller' }),
  evaluatedBy: one(users, { fields: [listings.evaluatedById], references: [users.id], relationName: 'evaluatedBy' }),
  purchases: many(purchases, { relationName: 'listing' }),
}));

export const tradeInListingsRelations = relations(tradeInListings, ({ one }) => ({
  user: one(users, { fields: [tradeInListings.userId], references: [users.id], relationName: 'user' }),
  evaluatedBy: one(users, { fields: [tradeInListings.evaluatedById], references: [users.id], relationName: 'evaluatedBy' }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  companyListing: one(listings, { fields: [purchases.companyListingId], references: [listings.id], relationName: 'listing' }),
  buyer: one(users, { fields: [purchases.userId], references: [users.id], relationName: 'buyer' }),
  warranty: one(warranties, { fields: [purchases.id], references: [warranties.purchaseId] }),
}));

export const warrantyRelations = relations(warranties, ({ one }) => ({
  purchase: one(purchases, { fields: [warranties.purchaseId], references: [purchases.id] }),
}));
