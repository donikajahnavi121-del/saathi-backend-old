import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { checkRedisHealth } from '../config/redis.js';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'unhealthy';
  let redisStatus = 'unhealthy';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'healthy';
  } catch (error) {
    dbStatus = 'unhealthy';
  }

  try {
    const isRedisOk = await checkRedisHealth();
    redisStatus = isRedisOk ? 'healthy' : 'degraded';
  } catch {
    redisStatus = 'unhealthy';
  }

  const isHealthy = dbStatus === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

export default router;
