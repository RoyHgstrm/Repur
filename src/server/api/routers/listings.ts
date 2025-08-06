import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { listings, users, tradeInListings, purchases, listingStatusEnum, tradeInStatusEnum } from '~/server/db/schema';
import { nanoid } from 'nanoid';

// Validation schemas
const CompanyListingSchema = z.object({
  title: z.string().min(5, "Otsikko on liian lyhyt"),
  description: z.string().min(10, "Kuvaus on liian lyhyt").max(2048, "Kuvaus on liian pitkä"),
  cpu: z.string(),
  gpu: z.string(),
  ram: z.string(),
  storage: z.string(),
  motherboard: z.string().optional(), // Now optional
  powerSupply: z.string(),
  caseModel: z.string().optional(),   // Now optional
  basePrice: z.number().positive("Hinnan täytyy olla positiivinen"),
  condition: z.enum(["Uusi", "Kuin uusi", "Hyvä", "Tyydyttävä"]),
  images: z.array(z.string()).optional(),
});

const TradeInSubmissionSchema = z.object({
  title: z.string().min(5, "Otsikko on liian lyhyt"),
  description: z.string().max(2048, "Kuvaus on liian pitkä").optional(), // Optional for user submission
  cpu: z.string().min(1, "Prosessori on pakollinen"),
  gpu: z.string().min(1, "Näytönohjain on pakollinen"),
  ram: z.string().min(1, "RAM on pakollinen"),
  storage: z.string().min(1, "Tallennustila on pakollinen"),
  powerSupply: z.string().optional(),
  caseModel: z.string().optional(),
  condition: z.enum(["Uusi", "Kuin uusi", "Hyvä", "Tyydyttävä", "Huono", "En tiedä"]),
  estimatedValue: z.number().optional(),
  contactEmail: z.string().email("Virheellinen sähköpostiosoite"),
  contactPhone: z.string().optional(),
});

const EvaluateTradeInSchema = z.object({
  tradeInListingId: z.string(),
  status: tradeInStatusEnum,
  estimatedValue: z.number().optional(),
  evaluationNotes: z.string().optional(),
});

const PurchaseSchema = z.object({
  companyListingId: z.string(), // Changed from listingId
  paymentMethod: z.string(),
  shippingAddress: z.string(),
});

export const listingsRouter = createTRPCRouter({
  // Create a new company listing (for employees/admins)
  createCompanyListing: protectedProcedure
    .input(CompanyListingSchema)
    .mutation(async ({ ctx, input }) => {
      // Role check
      const user = await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
      if (user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Vain työntekijät ja ylläpitäjät voivat luoda listauksia' });
      }

      const listing = await ctx.db.insert(listings).values({
        id: nanoid(),
        ...input,
        basePrice: input.basePrice.toString(), // Ensure numeric is stored as string
        sellerId: ctx.userId,
        status: 'ACTIVE', // Company listings are active by default once posted
      }).returning();

      return listing[0];
    }),

  // Get all active company listings
  getActiveCompanyListings: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const listingsData = await ctx.db.query.listings.findMany({
        where: eq(listings.status, 'ACTIVE'),
        limit: input?.limit,
        with: {
          seller: true,
        },
      });
      return listingsData;
    }),

  // Employee: Evaluate and activate a company listing
  evaluateCompanyListing: protectedProcedure
    .input(z.object({ 
      companyListingId: z.string(), // Changed from listingId
      status: listingStatusEnum, // Changed from z.enum(['ACTIVE', 'ARCHIVED'])
      basePrice: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
      if (user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN', 
          message: 'Vain työntekijät voivat arvioida listauksia' 
        });
      }

      const updatedListing = await ctx.db.update(listings)
        .set({
          status: input.status as typeof listingStatusEnum.enumValues[number],
          ...(input.basePrice !== undefined && { basePrice: input.basePrice.toString() }),
          evaluatedById: ctx.userId,
        })
        .where(eq(listings.id, input.companyListingId))
        .returning();

      return updatedListing[0];
    }),

  // Create a trade-in request (User submission)
  createTradeInSubmission: protectedProcedure
    .input(TradeInSubmissionSchema)
    .mutation(async ({ ctx, input }) => {
      const tradeIn = await ctx.db.insert(tradeInListings).values({
        id: nanoid(),
        userId: ctx.userId,
        title: input.title,
        description: input.description,
        cpu: input.cpu,
        gpu: input.gpu,
        ram: input.ram,
        storage: input.storage,
        powerSupply: input.powerSupply,
        caseModel: input.caseModel,
        condition: input.condition,
        estimatedValue: input.estimatedValue ? input.estimatedValue.toString() : undefined,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: 'PENDING',
      }).returning();
      return tradeIn[0];
    }),

  // Employee: Get all pending trade-in listings
  getPendingTradeInListings: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
      if (user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Vain työntekijät ja ylläpitäjät voivat tarkastella trade-in-pyyntöjä' });
      }

      const tradeInsData = await ctx.db.query.tradeInListings.findMany({
        where: eq(tradeInListings.status, 'PENDING'),
        with: {
          user: true,
        },
      });
      return tradeInsData;
    }),

  // Employee: Evaluate a trade-in listing
  evaluateTradeIn: protectedProcedure
    .input(EvaluateTradeInSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
      if (user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN', 
          message: 'Vain työntekijät voivat arvioida trade-in-pyyntöjä' 
        });
      }

      const updatedTradeIn = await ctx.db.update(tradeInListings)
        .set({
          status: input.status as typeof tradeInStatusEnum.enumValues[number],
          estimatedValue: input.estimatedValue ? input.estimatedValue.toString() : undefined,
          evaluationNotes: input.evaluationNotes,
          evaluatedById: ctx.userId,
        })
        .where(eq(tradeInListings.id, input.tradeInListingId))
        .returning();

      return updatedTradeIn[0];
    }),

  // Create a purchase
  createPurchase: protectedProcedure
    .input(PurchaseSchema)
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.query.listings.findFirst({
        where: and(
          eq(listings.id, input.companyListingId),
          eq(listings.status, 'ACTIVE')
        ),
      });

      if (!listing) {
        throw new TRPCError({ 
          code: 'NOT_FOUND', 
          message: 'Listaus ei ole saatavilla' 
        });
      }

      const purchase = await ctx.db.insert(purchases).values({
        id: nanoid(),
        companyListingId: input.companyListingId, // Changed from listingId
        userId: ctx.userId,
        purchasePrice: listing.basePrice,
        paymentMethod: input.paymentMethod,
        shippingAddress: input.shippingAddress,
      }).returning();

      await ctx.db.update(listings)
        .set({ status: 'SOLD' })
        .where(eq(listings.id, input.companyListingId));

      return purchase[0];
    }),

  // Get user's company listings
  getUserCompanyListings: protectedProcedure.query(async ({ ctx }) => {
    const userListingsData = await ctx.db.query.listings.findMany({
      where: eq(listings.sellerId, ctx.userId),
      columns: {
        id: true,
        title: true,
        status: true,
        basePrice: true,
      },
      with: {
        seller: true,
      },
    });
    return userListingsData;
  }),

  // Get a single company listing by ID
  getCompanyListingById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const listing = await ctx.db.query.listings.findFirst({
        where: eq(listings.id, input.id),
        with: {
          seller: true,
          evaluatedBy: true,
        },
      });

      if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Listaus ei löytynyt' });
      }

      return listing;
    }),

  // Employee: Mark trade-in as 'Contacted'
  markTradeInContacted: protectedProcedure
    .input(z.object({ tradeInListingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
      if (user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Vain työntekijät voivat päivittää trade-in-tilanteita' });
      }
      
      const updatedTradeIn = await ctx.db.update(tradeInListings)
        .set({ status: 'CONTACTED' })
        .where(eq(tradeInListings.id, input.tradeInListingId))
        .returning();
      return updatedTradeIn[0];
    }),
});