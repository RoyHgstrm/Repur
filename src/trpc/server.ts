import "server-only";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

export const api = (init?: { headers?: Headers }) =>
	appRouter.createCaller(() =>
		createTRPCContext({ headers: init?.headers ?? new Headers() }),
	);
