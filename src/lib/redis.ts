// HOW: Provide a single Upstash Redis HTTP client for serverless usage with low cold start overhead.
// WHY: We use Upstash for ephemeral data like caching, rate limiting, and deduplication across instances.
import { Redis } from "@upstash/redis";
import { env } from "~/env";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});
