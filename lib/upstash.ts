import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize the Upstash Redis client only if variables exist
export const redis = (redisUrl && redisToken) ? Redis.fromEnv() : null;

// Create a new ratelimiter, that allows 20 requests per 1 minute
export const ratelimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  // Optional: Add a prefix to the keys in Redis for easier management
  prefix: '@upstash/ratelimit:chat-api',
}) : null;
