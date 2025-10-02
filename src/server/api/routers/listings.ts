import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { eq, and, or, ilike, gte, lte, asc, desc, type SQL } from 'drizzle-orm';
import { listings, users, tradeInListings, purchases, listingStatusEnum, tradeInStatusEnum } from '~/server/db/schema';
import { nanoid } from 'nanoid';
import { redis } from '~/lib/redis';
import { sanitizeHtml } from '~/lib/utils';
import { computePerformanceScore } from '~/lib/utils'; // HOW: Import the centralized performance score utility for tier filtering.
import { viewsLimiter, listingsLimiter } from '~/lib/rate-limiter';
import { revalidatePath } from 'next/cache';
import { getImage } from '~/server/utils/image'; // HOW: Import getImage utility for resolving image paths.

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

const SearchCompanyListingsSchema = z.object({
  searchTerm: z.string().optional(),
  sortBy: z.enum(['price-low', 'price-high', 'newest', 'rating']).optional().default('newest'),
  filterCondition: z.string().optional().default('all'),
  perfTier: z.enum(['all', 'Huippusuoritus', 'Erinomainen', 'Hyvä', 'Perus']).optional().default('all'),
  gpuTier: z.enum(['all', 'RTX50', 'RTX40', 'RTX30', 'RTX20', 'GTX', 'RX9000', 'RX8000', 'RX7000', 'RX6000', 'RX5000', 'ARC']).optional().default('all'),
  cpuTier: z.enum(['all', 'IntelCore3', 'IntelCore5', 'IntelCore7', 'IntelCore9', 'IntelUltra5', 'IntelUltra7', 'IntelUltra9', 'Ryzen3', 'Ryzen5', 'Ryzen7', 'Ryzen9']).optional().default('all'),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  featuredOnly: z.boolean().optional(),
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

  searchCompanyListings: publicProcedure
    .input(SearchCompanyListingsSchema)
    .query(async ({ ctx, input }) => {
      const {
        searchTerm,
        sortBy,
        filterCondition,
        perfTier,
        gpuTier,
        cpuTier,
        priceMin,
        priceMax,
        featuredOnly,
      } = input;

      const whereClauses: (SQL<unknown> | undefined)[] = [eq(listings.status, 'ACTIVE')];

      if (featuredOnly) {
        whereClauses.push(eq(listings.isFeatured as any, true as any));
      }

      if (searchTerm) {
        whereClauses.push(
          or(
            ilike(listings.title, `%${searchTerm}%`),
            ilike(listings.cpu, `%${searchTerm}%`),
            ilike(listings.gpu, `%${searchTerm}%`)
          )
        );
      }

      if (filterCondition && filterCondition !== 'all') {
        whereClauses.push(eq(listings.condition, filterCondition as "Uusi" | "Kuin uusi" | "Hyvä" | "Tyydyttävä" | "Huono"));
      }

      if (priceMin) {
        whereClauses.push(gte(listings.basePrice, priceMin.toString()));
      }

      if (priceMax) {
        whereClauses.push(lte(listings.basePrice, priceMax.toString()));
      }

      // HOW: Define performance tier ranges and GPU/CPU tier patterns for filtering listings.
      // WHY: Enables advanced filtering by performance characteristics, improving user experience.
      const perfTierRanges = {
        'Huippusuoritus': { min: 85, max: 100 },
        'Erinomainen': { min: 70, max: 84 },
        'Hyvä': { min: 55, max: 69 },
        'Perus': { min: 0, max: 54 },
      };

      const gpuTierPatterns: Record<string, RegExp> = {
        'RTX50': /rtx\s*50[0-9]{2}/i,
        'RTX40': /rtx\s*40[0-9]{2}/i,
        'RTX30': /rtx\s*30[0-9]{2}/i,
        'RTX20': /rtx\s*20[0-9]{2}/i,
        'GTX': /gtx/i,
        'RX9000': /rx\s*9[0-9]{3}/i,
        'RX8000': /rx\s*8[0-9]{3}/i,
        'RX7000': /rx\s*7[0-9]{3}/i,
        'RX6000': /rx\s*6[0-9]{3}/i,
        'RX5000': /rx\s*5[0-9]{3}/i,
        'ARC': /arc/i,
      };

      const cpuTierPatterns: Record<string, RegExp> = {
        'IntelCore9': /i9/i,
        'IntelCore7': /i7/i,
        'IntelCore5': /i5/i,
        'IntelCore3': /i3/i,
        'IntelUltra9': /ultra\s*9/i,
        'IntelUltra7': /ultra\s*7/i,
        'IntelUltra5': /ultra\s*5/i,
        'Ryzen9': /ryzen\s*9/i,
        'Ryzen7': /ryzen\s*7/i,
        'Ryzen5': /ryzen\s*5/i,
        'Ryzen3': /ryzen\s*3/i,
      };

      const orderByClauses = [];
      switch (sortBy) {
        case 'price-low':
          orderByClauses.push(asc(listings.basePrice));
          break;
        case 'price-high':
          orderByClauses.push(desc(listings.basePrice));
          break;
        case 'newest':
          orderByClauses.push(desc(listings.createdAt));
          break;
        case 'rating':
          orderByClauses.push(desc(listings.createdAt));
          break;
        default:
          orderByClauses.push(desc(listings.createdAt));
          break;
      }

      let listingsData = await ctx.db.query.listings.findMany({
        where: and(...whereClauses.filter((c): c is SQL<unknown> => !!c)),
        orderBy: orderByClauses,
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

      // HOW: Apply in-memory filtering for CPU, GPU, and performance tiers.
      // WHY: Allows flexible filtering based on derived performance metrics and string patterns that are complex for direct SQL.
      if (perfTier && perfTier !== 'all') {
        const range = perfTierRanges[perfTier];
        if (range) {
          listingsData = listingsData.filter(l => {
            const score = computePerformanceScore({
              gpu: l.gpu ?? null,
              cpu: l.cpu ?? null,
              ram: l.ram ?? null,
              storage: l.storage ?? null,
            });
            return score >= range.min && score <= range.max;
          });
        }
      }

      if (gpuTier && gpuTier !== 'all') {
        const pattern = gpuTierPatterns[gpuTier];
        if (pattern) {
          listingsData = listingsData.filter(l => l.gpu && pattern.test(l.gpu));
        }
      }

      if (cpuTier && cpuTier !== 'all') {
        const pattern = cpuTierPatterns[cpuTier];
        if (pattern) {
          listingsData = listingsData.filter(l => l.cpu && pattern.test(l.cpu));
        }
      }

      return listingsData;
    }),

  // Get all active company listings
  getActiveCompanyListings: publicProcedure
    .use(async ({ ctx, next }) => {
      const ip = ctx.headers.get("x-forwarded-for") ?? "127.0.0.1";
      const { success } = await listingsLimiter.limit(ip);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again later.",
        });
      }
      return next();
    })
    .input(z.object({ 
      limit: z.number().optional(), 
      featuredOnly: z.boolean().optional(),
      sortBy: z.enum(['views', 'created']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional()
    }).optional())
    .query(async ({ ctx, input }) => {
      const onlyFeatured = input?.featuredOnly === true;
      const sortBy = input?.sortBy ?? 'created';
      const sortOrder = input?.sortOrder ?? 'desc';
      const cacheKey = `listings:${onlyFeatured ? 'featured' : 'active'}:${sortBy}:${sortOrder}`;
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
          orderBy: [
            sortBy === 'views'
              ? sortOrder === 'desc'
                ? desc(listings.views)
                : asc(listings.views)
              : sortOrder === 'desc'
                ? desc(listings.createdAt)
                : asc(listings.createdAt)
          ],
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
            views: true,
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

      // HOW: Revalidate relevant Next.js paths to ensure data freshness on the client.
      // WHY: Updates to listings, especially status, need to be immediately visible.
      revalidatePath('/admin');
      revalidatePath('/osta');
      revalidatePath(`/osta/${input.companyListingId}`);
      revalidatePath('/'); // For featured listings on homepage

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

      // HOW: Revalidate relevant Next.js paths to ensure data freshness on the client.
      // WHY: Updates to listings, especially price, name, or status, need to be immediately visible.
      revalidatePath('/admin');
      revalidatePath('/osta');
      revalidatePath(`/osta/${id}`);
      revalidatePath('/'); // For featured listings on homepage

      return updated[0];
    }),

  // Create a trade-in request (User submission)
  createTradeInSubmission: protectedProcedure
    .input(TradeInSubmissionSchema)
    .mutation(async ({ ctx, input }) => {
      const sanitizedDescription = input.description ? sanitizeHtml(input.description) : undefined;

      const tradeIn = await ctx.db.insert(tradeInListings).values({
        id: nanoid(),
        userId: ctx.userId,
        title: input.title,
        description: sanitizedDescription,
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
        views: true,
        images: true,
      },
      with: {
        seller: true,
      },
    });
    // HOW: Resolve image paths to public URLs on the server before sending to client.
    // WHY: Client components require absolute URLs for `next/image` component to function correctly.
    const listingsWithResolvedImages = await Promise.all(userListingsData.map(async (listing) => ({
      ...listing,
      images: await Promise.all((listing.images ?? []).map(async (imagePath: string) => await getImage(imagePath))),
    })));
    return listingsWithResolvedImages;
  }),

  // Employee/Admin: Get all company listings
  getAllCompanyListings: protectedProcedure.query(async ({ ctx }) => {
    // Verify role via DB sync (protectedProcedure keeps DB user synced)
    const staff = await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
    if (staff?.role !== 'EMPLOYEE' && staff?.role !== 'ADMIN') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Vain henkilöstö voi nähdä kaikki listaukset' });
    }

    const rows = await ctx.db.query.listings.findMany({
      columns: { id: true, title: true, status: true, basePrice: true, isFeatured: true, views: true, images: true },
      with: { seller: true },
    });
    // HOW: Resolve image paths to public URLs on the server before sending to client.
    // WHY: Client components require absolute URLs for `next/image` component to function correctly.
    const listingsWithResolvedImages = await Promise.all(rows.map(async (listing) => ({
      ...listing,
      images: await Promise.all((listing.images ?? []).map(async (imagePath: string) => await getImage(imagePath))),
    })));
    return listingsWithResolvedImages;
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
            views: true,
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
              views: true,
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

  incrementListingViews: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Use Redis to track view increments with a shorter expiry
      const ip = ctx.headers.get("x-forwarded-for") ?? "127.0.0.1";
      const viewKey = `views:${input.id}:${ip}`;
      
      // Check if this IP has already incremented this listing's views recently
      const existing = await redis.get(viewKey);
      if (existing && typeof existing === 'string') {
        return JSON.parse(existing); // Return cached result
      }

      // Apply rate limit only for new view increments
      const { success } = await viewsLimiter.limit(ip);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again later.",
        });
      }

      const listing = await ctx.db.query.listings.findFirst({
        where: eq(listings.id, input.id),
      });

      if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Listaus ei löytynyt' });
      }

      const updated = await ctx.db.update(listings)
        .set({ views: (parseInt(listing.views, 10) + 1).toString() })
        .where(eq(listings.id, input.id))
        .returning({
          id: listings.id,
          views: listings.views,
        });
      
      // Cache the result for 5 seconds to prevent duplicate increments
      await redis.set(viewKey, JSON.stringify(updated[0]), { ex: 5 });
      
      return updated[0];
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