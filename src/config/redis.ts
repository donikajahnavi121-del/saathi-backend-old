import Redis from 'ioredis';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

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

  async call(command: string, ...args: any[]): Promise<any> {
    const cmd = command.toLowerCase();
    if (cmd === 'get') return this.get(args[0]);
    if (cmd === 'set') return this.set(args[0], args[1], args[2], args[3]);
    if (cmd === 'del') return this.del(args[0]);
    if (cmd === 'incr') return this.incr(args[0]);
    if (cmd === 'expire') return this.expire(args[0], args[1]);
    if (cmd === 'ttl') return this.ttl(args[0]);
    if (cmd === 'ping') return 'PONG';
    return null;
  }
}

const memoryStore = new InMemoryRedisFallback();
let isRealRedisReady = false;
let realClient: Redis | null = null;

try {
  realClient = new Redis(ENV.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    retryStrategy(times) {
      // Retry every 5 seconds silently without throwing uncaught exceptions
      return 5000;
    },
    lazyConnect: true,
  });

  realClient.on('connect', () => {
    isRealRedisReady = true;
    logger.info('Connected to Redis');
  });

  realClient.on('ready', () => {
    isRealRedisReady = true;
  });

  realClient.on('error', () => {
    isRealRedisReady = false;
    // Suppress unhandled error event so it never crashes node process
  });

  realClient.on('close', () => {
    isRealRedisReady = false;
  });

  realClient.connect().catch(() => {
    isRealRedisReady = false;
  });
} catch {
  isRealRedisReady = false;
}

// Resilient Proxy that never crashes if Redis is offline
export const redis: any = {
  async get(key: string): Promise<string | null> {
    if (isRealRedisReady && realClient) {
      try {
        return await realClient.get(key);
      } catch {
        return memoryStore.get(key);
      }
    }
    return memoryStore.get(key);
  },

  async set(key: string, value: string, mode?: string, duration?: number): Promise<any> {
    if (isRealRedisReady && realClient) {
      try {
        if (mode && duration) {
          return await (realClient as any).set(key, value, mode, duration);
        }
        return await realClient.set(key, value);
      } catch {
        return memoryStore.set(key, value, mode, duration);
      }
    }
    return memoryStore.set(key, value, mode, duration);
  },

  async setex(key: string, seconds: number, value: string): Promise<any> {
    if (isRealRedisReady && realClient) {
      try {
        return await realClient.setex(key, seconds, value);
      } catch {
        return memoryStore.setex(key, seconds, value);
      }
    }
    return memoryStore.setex(key, seconds, value);
  },

  async del(key: string | string[]): Promise<number> {
    if (isRealRedisReady && realClient) {
      try {
        return await realClient.del(Array.isArray(key) ? key : [key]);
      } catch {
        return memoryStore.del(key);
      }
    }
    return memoryStore.del(key);
  },

  async incr(key: string): Promise<number> {
    if (isRealRedisReady && realClient) {
      try {
        return await realClient.incr(key);
      } catch {
        return memoryStore.incr(key);
      }
    }
    return memoryStore.incr(key);
  },

  async expire(key: string, seconds: number): Promise<number> {
    if (isRealRedisReady && realClient) {
      try {
        return await realClient.expire(key, seconds);
      } catch {
        return memoryStore.expire(key, seconds);
      }
    }
    return memoryStore.expire(key, seconds);
  },

  async ttl(key: string): Promise<number> {
    if (isRealRedisReady && realClient) {
      try {
        return await realClient.ttl(key);
      } catch {
        return memoryStore.ttl(key);
      }
    }
    return memoryStore.ttl(key);
  },

  async ping(): Promise<string> {
    if (isRealRedisReady && realClient) {
      try {
        return await realClient.ping();
      } catch {
        return 'PONG';
      }
    }
    return 'PONG';
  },

  async quit(): Promise<any> {
    if (realClient) {
      try {
        await realClient.quit();
      } catch {}
    }
    return memoryStore.quit();
  },

  async call(command: string, ...args: any[]): Promise<any> {
    if (isRealRedisReady && realClient) {
      try {
        return await (realClient as any).call(command, ...args);
      } catch {
        return memoryStore.call(command, ...args);
      }
    }
    return memoryStore.call(command, ...args);
  },
};

export async function checkRedisHealth(): Promise<boolean> {
  return isRealRedisReady;
}

export async function disconnectRedis(): Promise<void> {
  if (realClient) {
    try {
      await realClient.quit();
    } catch {}
  }
}
