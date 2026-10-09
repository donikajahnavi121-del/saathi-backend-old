import Redis from 'ioredis';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;
let isConnected = false;

// Simple in-memory fallback store if Redis is unavailable (e.g. in test or standalone dev)
class InMemoryRedisFallback {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiresAt = Date.now() + duration;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    return this.set(key, value, 'EX', seconds);
  }

  async del(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key : [key];
    let count = 0;
    for (const k of keys) {
      if (this.store.delete(k)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const num = (current ? parseInt(current, 10) : 0) + 1;
    const item = this.store.get(key);
    this.store.set(key, { value: num.toString(), expiresAt: item?.expiresAt });
    return num;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item || !item.expiresAt) return -1;
    const remaining = Math.round((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }
}

const memoryFallback = new InMemoryRedisFallback();

export function getRedisClient(): Redis | any {
  if (redisClient) {
    return redisClient;
  }

  try {
    const client = new Redis(ENV.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis reconnection failed after 3 attempts, using in-memory fallback');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });

    client.on('connect', () => {
      isConnected = true;
      logger.info('Connected to Redis');
    });

    client.on('error', (err) => {
      isConnected = false;
      logger.warn({ error: err.message }, 'Redis connection notice - fallback active if offline');
    });

    // Attempt initial async connect without crashing app if Redis is temporarily offline
    client.connect().catch((err) => {
      logger.warn({ error: err.message }, 'Could not immediately connect to Redis, in-memory cache ready');
    });

    redisClient = client;
    return redisClient;
  } catch (error: any) {
    logger.warn({ error: error.message }, 'Initializing in-memory Redis fallback');
    return memoryFallback;
  }
}

export const redis = getRedisClient();

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const res = await redis.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // Ignore if already closed
    }
  }
}
