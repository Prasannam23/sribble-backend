// redisClient.js
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL  ,
  token:'UPSTASH_REDIS_REST_TOKEN',
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

(async () => {
  await redisClient.connect();
  console.log('Redis connected');
})();

export default redisClient;
process.env.REDIS_URL