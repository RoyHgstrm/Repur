// HOW: Global, stateless rate limiting with Upstash Redis tokens per IP + route.
// WHY: Protects webhook and checkout endpoints; Upstash is serverless, global, and pay-per-use.
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "~/lib/redis";

export const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
  analytics: true,
  prefix: "repur:rl",
});

