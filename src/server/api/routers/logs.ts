import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { logs } from "~/server/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";

export const logsRouter = createTRPCRouter({
  getRecentLogs: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(1000).default(100),
      offset: z.number().min(0).default(0),
      searchTerm: z.string().optional(),
      logLevel: z.enum(['info', 'warn', 'error']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      // Only ADMIN can view logs
      if (ctx.userRole !== "ADMIN") {
        throw new Error("Vain ylläpitäjä voi nähdä lokit.");
      }

      const limit = input?.limit ?? 100;
      const offset = input?.offset ?? 0;
      const searchTerm = input?.searchTerm?.toLowerCase();
      const logLevel = input?.logLevel;

      const whereClauses: any[] = [];

      if (searchTerm) {
        whereClauses.push(sql`lower(${logs.message}) LIKE ${'%' + searchTerm + '%'}`);
      }

      if (logLevel) {
        whereClauses.push(eq(logs.level, logLevel));
      }

      const recentLogs = await ctx.db.query.logs.findMany({
        where: whereClauses.length ? and(...whereClauses) : undefined,
        orderBy: desc(logs.timestamp),
        limit,
        offset,
      });

      return recentLogs;
    }),
});