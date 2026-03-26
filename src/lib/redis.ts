import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  client.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  client.on('connect', () => {
    console.log('Redis connected');
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function get<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.error('Redis get error:', err);
    return null;
  }
}

export async function set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch (err) {
    console.error('Redis set error:', err);
  }
}

export async function del(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('Redis del error:', err);
  }
}

export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  const cached = await get<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetchFn();
  await set(key, fresh, ttlSeconds);
  return fresh;
}
