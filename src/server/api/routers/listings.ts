import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { listings, users, tradeInListings, purchases, listingStatusEnum, tradeInStatusEnum } from '~/server/db/schema';
import { nanoid } from 'nanoid';
import { redis } from '~/lib/redis';

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

// Helper to accept HTML datetime-local (YYYY-MM-DDTHH:mm) and empty strings
const OptionalLocalDate = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  return val;
}, z.coerce.date()).optional();

// Update schema: allow partial updates, but require id
const UpdateCompanyListingSchema = z.object({
  id: z.string(),
  title: z.string().min(5).optional(),
  description: z.string().min(10).max(2048).optional(),
  cpu: z.string().optional(),
  gpu: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  motherboard: z.string().optional(),
  powerSupply: z.string().optional(),
  caseModel: z.string().optional(),
  basePrice: z.number().positive().optional(),
  discountAmount: z.number().min(0).optional(),
  discountStart: OptionalLocalDate,
  discountEnd: OptionalLocalDate,
  condition: z.enum(["Uusi", "Kuin uusi", "Hyvä", "Tyydyttävä"]).optional(),
  images: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
}).refine((data) => {
  if (data.discountStart && data.discountEnd) {
    return data.discountEnd > data.discountStart;
  }
  return true;
}, { message: 'discountEnd täytyy olla alkamisen jälkeen', path: ['discountEnd'] });

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

// Zod enum wrappers for Drizzle enums (required by tRPC input parsing)
const ListingStatusSchema = z.enum(listingStatusEnum.enumValues);
const TradeInStatusSchema = z.enum(tradeInStatusEnum.enumValues);

const EvaluateTradeInSchema = z.object({
  tradeInListingId: z.string(),
  status: TradeInStatusSchema,
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

      const newListing = {
        id: nanoid(),
        ...input,
        basePrice: input.basePrice.toString(), // Ensure numeric is stored as string
        sellerId: ctx.userId,
        status: 'ACTIVE' as const, // Company listings are active by default once posted
      };

      const listing = await ctx.db.insert(listings).values(newListing).returning({
        id: listings.id,
        title: listings.title,
        description: listings.description,
        status: listings.status,
        basePrice: listings.basePrice,
        sellerId: listings.sellerId,
        createdAt: listings.createdAt,
        updatedAt: listings.updatedAt,
      });

      // Invalidate cache
      await redis.del('listings:active');

      return listing[0];
    }),

  // Get all active company listings
  getActiveCompanyListings: publicProcedure
    .input(z.object({ limit: z.number().optional(), featuredOnly: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const onlyFeatured = input?.featuredOnly === true;
      const cacheKey = onlyFeatured ? 'listings:featured' : 'listings:active';
      // HOW: Use shorter TTLs to reduce staleness in hero section; featured updates are important for landing page.
      // WHY: We want fast loads (cache) but also quick convergence to fresh data when items sell or change.
      const ttlSeconds = onlyFeatured ? 120 : 300; // 2 min for featured, 5 min for general active
      const cachedListings = await redis.get(cacheKey);

      if (cachedListings) {
        if (typeof cachedListings === 'string') {
          try {
            return JSON.parse(cachedListings as string);
          } catch {
            // fallthrough to return as-is if not valid JSON
          }
        }
        return cachedListings as unknown as any[];
      }

      try {
        const listingsData = await ctx.db.query.listings.findMany({
          where: (onlyFeatured
            ? and(eq(listings.status, 'ACTIVE'), eq(listings.isFeatured as any, true as any))
            : eq(listings.status, 'ACTIVE')) as any,
          limit: input?.limit,
          // Try with discount fields first
          columns: {
            id: true,
            title: true,
            description: true,
            status: true,
            isFeatured: true,
            cpu: true,
            gpu: true,
            ram: true,
            storage: true,
            motherboard: true,
            powerSupply: true,
            caseModel: true,
            basePrice: true,
            discountAmount: true,
            discountStart: true,
            discountEnd: true,
            condition: true,
            images: true,
            sellerId: true,
            evaluatedById: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            seller: true,
          },
        });

        await redis.set(cacheKey, listingsData, { ex: ttlSeconds });

        return listingsData;
      } catch (err) {
        const message = String((err as any)?.message ?? err);
        if (/is_featured/i.test(message) || /column\s+\"is_featured\"/i.test(message)) {
          // DB not migrated with is_featured yet
          if (onlyFeatured) {
            await redis.set(cacheKey, [], { ex: ttlSeconds });
            return [] as any[];
          }
          const listingsData = await ctx.db.query.listings.findMany({
            where: eq(listings.status, 'ACTIVE'),
            limit: input?.limit,
            columns: {
              id: true,
              title: true,
              description: true,
              status: true,
              cpu: true,
              gpu: true,
              ram: true,
              storage: true,
              motherboard: true,
              powerSupply: true,
              caseModel: true,
              basePrice: true,
              discountAmount: true,
              discountStart: true,
              discountEnd: true,
              condition: true,
              images: true,
              sellerId: true,
              evaluatedById: true,
              createdAt: true,
              updatedAt: true,
            },
            with: { seller: true },
          });
          await redis.set(cacheKey, listingsData, { ex: ttlSeconds });
          return listingsData;
        }
        if (/discount_/i.test(message) || /column\s+"discount/i.test(message)) {
          // Retry without discount fields (remote DB not migrated yet)
          const listingsData = await ctx.db.query.listings.findMany({
            where: (onlyFeatured
              ? and(eq(listings.status, 'ACTIVE'), eq(listings.isFeatured as any, true as any))
              : eq(listings.status, 'ACTIVE')) as any,
            limit: input?.limit,
            columns: {
              id: true,
              title: true,
              description: true,
              status: true,
              isFeatured: true,
              cpu: true,
              gpu: true,
              ram: true,
              storage: true,
              motherboard: true,
              powerSupply: true,
              caseModel: true,
              basePrice: true,
              condition: true,
              images: true,
              sellerId: true,
              evaluatedById: true,
              createdAt: true,
              updatedAt: true,
            },
            with: { seller: true },
          });

          await redis.set(cacheKey, listingsData, { ex: ttlSeconds });

          return listingsData;
        }
        throw err;
      }
    }),

  // Employee: Evaluate and activate a company listing
  evaluateCompanyListing: protectedProcedure
    .input(z.object({ 
      companyListingId: z.string(),
      status: ListingStatusSchema,
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
        .returning({
          id: listings.id,
          title: listings.title,
          status: listings.status,
          basePrice: listings.basePrice,
          evaluatedById: listings.evaluatedById,
          updatedAt: listings.updatedAt,
        });

      // Invalidate caches for both active and featured sets to avoid stale hero
      await redis.del('listings:active');
      await redis.del('listings:featured');
      await redis.del(`listing:${input.companyListingId}`);

      return updatedListing[0];
    }),

  // Employee/Admin: Update company listing fields
  updateCompanyListing: protectedProcedure
    .input(UpdateCompanyListingSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
      if (user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Vain työntekijät ja ylläpitäjät voivat muokata listauksia' });
      }

      const { id, basePrice, discountAmount, discountStart, discountEnd, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest };
      if (basePrice !== undefined) updateData.basePrice = basePrice.toString();
      if (discountAmount !== undefined) updateData.discountAmount = discountAmount.toString();
      if (discountStart !== undefined) updateData.discountStart = discountStart; // already Date via z.coerce
      if (discountEnd !== undefined) updateData.discountEnd = discountEnd;     // already Date via z.coerce

      // If nothing to update, return current row (no-op) to avoid "No values to set"
      if (Object.keys(updateData).length === 0) {
        const current = await ctx.db.query.listings.findFirst({
          where: eq(listings.id, id),
          columns: {
            id: true, title: true, description: true, status: true, basePrice: true, cpu: true, gpu: true,
            ram: true, storage: true, motherboard: true, powerSupply: true, caseModel: true,
            condition: true, images: true, updatedAt: true,
          },
        });
        if (!current) throw new TRPCError({ code: 'NOT_FOUND', message: 'Listaus ei löytynyt' });
        return current;
      }

      const updated = await ctx.db.update(listings)
        .set(updateData)
        .where(eq(listings.id, id))
        .returning({
          id: listings.id,
          title: listings.title,
          description: listings.description,
          status: listings.status,
          basePrice: listings.basePrice,
          cpu: listings.cpu,
          gpu: listings.gpu,
          ram: listings.ram,
          storage: listings.storage,
          motherboard: listings.motherboard,
          powerSupply: listings.powerSupply,
          caseModel: listings.caseModel,
          condition: listings.condition,
          images: listings.images,
          updatedAt: listings.updatedAt,
        })
        .catch(async (err: unknown) => {
          const message = String((err as any)?.message ?? err);
          const triedDiscountFields =
            updateData.discountAmount !== undefined ||
            updateData.discountStart !== undefined ||
            updateData.discountEnd !== undefined;
          if (triedDiscountFields && /discount_/i.test(message)) {
            // Retry without discount fields (likely migration not applied yet)
            delete (updateData as any).discountAmount;
            delete (updateData as any).discountStart;
            delete (updateData as any).discountEnd;
            if (Object.keys(updateData).length === 0) {
              // Nothing else to update → return current row as no-op
              const current = await ctx.db.query.listings.findFirst({
                where: eq(listings.id, id),
                columns: {
                  id: true, title: true, description: true, status: true, basePrice: true, cpu: true, gpu: true,
                  ram: true, storage: true, motherboard: true, powerSupply: true, caseModel: true,
                  condition: true, images: true, updatedAt: true,
                },
              });
              if (!current) throw new TRPCError({ code: 'NOT_FOUND', message: 'Listaus ei löytynyt' });
              return [current];
            }
            return await ctx.db
              .update(listings)
              .set(updateData)
              .where(eq(listings.id, id))
              .returning({
                id: listings.id,
                title: listings.title,
                description: listings.description,
                status: listings.status,
                basePrice: listings.basePrice,
                cpu: listings.cpu,
                gpu: listings.gpu,
                ram: listings.ram,
                storage: listings.storage,
                motherboard: listings.motherboard,
                powerSupply: listings.powerSupply,
                caseModel: listings.caseModel,
                condition: listings.condition,
                images: listings.images,
                updatedAt: listings.updatedAt,
              });
          }
          throw err;
        });

      if (!updated[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Listaus ei löytynyt' });
      }

      // Invalidate cache
      await redis.del('listings:active');
      await redis.del('listings:featured');
      await redis.del(`listing:${id}`);

      return updated[0];
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

  // Employee/Admin: Get trade-in listings with optional status filter
  getTradeInListings: protectedProcedure
    .input(z.object({ status: TradeInStatusSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
      if (user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Vain työntekijät ja ylläpitäjät voivat tarkastella trade-in-pyyntöjä' });
      }

      const rows = await ctx.db.query.tradeInListings.findMany({
        ...(input?.status ? { where: eq(tradeInListings.status, input.status) } : {} as any),
        with: { user: true },
      });
      return rows;
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

      // Invalidate caches for both active and featured sets to avoid stale hero
      await redis.del('listings:active');
      await redis.del('listings:featured');
      await redis.del(`listing:${input.companyListingId}`);

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
        isFeatured: true,
        basePrice: true,
      },
      with: {
        seller: true,
      },
    });
    return userListingsData;
  }),

  // Employee/Admin: Get all company listings
  getAllCompanyListings: protectedProcedure.query(async ({ ctx }) => {
    // Verify role via DB sync (protectedProcedure keeps DB user synced)
    const staff = await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
    if (staff?.role !== 'EMPLOYEE' && staff?.role !== 'ADMIN') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Vain henkilöstö voi nähdä kaikki listaukset' });
    }

    const rows = await ctx.db.query.listings.findMany({
      columns: { id: true, title: true, status: true, basePrice: true, isFeatured: true },
      with: { seller: true },
    });
    return rows;
  }),

  // Get a single company listing by ID
  getCompanyListingById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const cacheKey = `listing:${input.id}`;
      const cachedListing = await redis.get(cacheKey);

      if (cachedListing) {
        if (typeof cachedListing === 'string') {
          try {
            return JSON.parse(cachedListing as string);
          } catch {
            // return as-is if not JSON
          }
        }
        return cachedListing as unknown as any;
      }

      try {
        const listing = await ctx.db.query.listings.findFirst({
          where: eq(listings.id, input.id),
          columns: {
            id: true,
            title: true,
            description: true,
            status: true,
            cpu: true,
            gpu: true,
            ram: true,
            storage: true,
            motherboard: true,
            powerSupply: true,
            caseModel: true,
            basePrice: true,
            discountAmount: true,
            discountStart: true,
            discountEnd: true,
            condition: true,
            images: true,
            sellerId: true,
            evaluatedById: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            seller: true,
            evaluatedBy: true,
          },
        });
        if (!listing) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Listaus ei löytynyt' });
        }

        await redis.set(cacheKey, listing, { ex: 3600 }); // Cache for 1 hour

        return listing;
      } catch (err) {
        const message = String((err as any)?.message ?? err);
        if (/discount_/i.test(message) || /column\s+"discount/i.test(message)) {
          const listing = await ctx.db.query.listings.findFirst({
            where: eq(listings.id, input.id),
            columns: {
              id: true,
              title: true,
              description: true,
              status: true,
              cpu: true,
              gpu: true,
              ram: true,
              storage: true,
              motherboard: true,
              powerSupply: true,
              caseModel: true,
              basePrice: true,
              condition: true,
              images: true,
              sellerId: true,
              evaluatedById: true,
              createdAt: true,
              updatedAt: true,
            },
            with: { seller: true, evaluatedBy: true },
          });
          if (!listing) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Listaus ei löytynyt' });
          }

          await redis.set(cacheKey, listing, { ex: 3600 }); // Cache for 1 hour

          return listing;
        }
        throw err;
      }
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