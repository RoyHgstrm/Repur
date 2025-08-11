import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { db } from '~/server/db';
import { warranties } from '~/server/db/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

const DateRangeSchema = z.object({ from: z.string().datetime().optional(), to: z.string().datetime().optional() }).optional();

export const warrantiesRouter = createTRPCRouter({
  // Admin/employee: list warranties, optional filters
  getAll: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      q: z.string().optional(),
      dateRange: DateRangeSchema,
      limit: z.number().min(1).max(200).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.userRole !== 'ADMIN' && ctx.userRole !== 'EMPLOYEE') {
        throw new Error('Vain henkilöstö voi nähdä takuut');
      }

      const where: any[] = [];
      if (input?.status) where.push(eq(warranties.status, input.status));
      if (input?.dateRange?.from) where.push(gte(warranties.startDate, new Date(input.dateRange.from)));
      if (input?.dateRange?.to) where.push(lte(warranties.startDate, new Date(input.dateRange.to)));

      const rows = await db.query.warranties.findMany({
        where: where.length ? and(...where) : undefined,
        orderBy: desc(warranties.startDate),
        limit: input?.limit ?? 100,
        with: {
          purchase: {
            with: {
              companyListing: true,
              buyer: true,
            },
          },
        },
      });

      const q = (input?.q ?? '').trim().toLowerCase();
      return q
        ? rows.filter((w) =>
            (w.purchase?.companyListing?.title ?? '').toLowerCase().includes(q) ||
            (w.purchase?.buyer?.email ?? '').toLowerCase().includes(q) ||
            (w.id ?? '').toLowerCase().includes(q) ||
            (w.purchaseId ?? '').toLowerCase().includes(q),
          )
        : rows;
    }),

  // Admin/employee: update warranty status or terms
  update: protectedProcedure
    .input(z.object({ id: z.string(), status: z.string().optional(), endDate: z.string().datetime().optional(), terms: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.userRole !== 'ADMIN' && ctx.userRole !== 'EMPLOYEE') {
        throw new Error('Vain henkilöstö voi päivittää takuun');
      }
      const updates: any = {};
      if (input.status) updates.status = input.status;
      if (input.endDate) updates.endDate = new Date(input.endDate);
      if (input.terms !== undefined) updates.terms = input.terms;
      await db.update(warranties).set(updates).where(eq(warranties.id, input.id));
      return { ok: true };
    }),
});


