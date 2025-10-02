// HOW: Global, stateless rate limiting with Upstash Redis tokens per IP + route.
// WHY: Protects webhook and checkout endpoints; Upstash is serverless, global, and pay-per-use.
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "~/lib/redis";

// Create separate limiters for different endpoints with different strategies
export const defaultLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(100, "10 s"), // 100 requests per 10 seconds
	analytics: true,
	prefix: "repur:rl:default",
});

export const viewsLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(50, "5 s"), // 50 requests per 5 seconds for views
	analytics: true,
	prefix: "repur:rl:views",
});

export const metricsLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(20, "5 s"), // 20 requests per 5 seconds for metrics
	analytics: true,
	prefix: "repur:rl:metrics",
});

export const listingsLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(30, "5 s"), // 30 requests per 5 seconds for listings
	analytics: true,
	prefix: "repur:rl:listings",
});

// Export the default limiter as the main limiter for backward compatibility
export const limiter = defaultLimiter;
