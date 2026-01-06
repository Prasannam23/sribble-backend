import dotenv from "dotenv";
dotenv.config();
import { Redis } from '@upstash/redis';

// Read Upstash config from environment variables
const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

// Validate presence of required config and fail fast with a clear error
if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  // Don't log the token. Provide clear instructions instead.
  throw new Error(
    'Upstash Redis configuration missing. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment or .env file.'
  );
}

console.log('Upstash Redis URL detected. Initializing client...');

const redisClient = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
});

export default redisClient;
