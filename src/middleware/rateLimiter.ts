import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis.js';
import { sendError } from '../utils/apiResponse.js';
import { Request, Response } from 'express';

// Strict Rate Limiter for Authentication & OTP routes (5 requests / min per IP + phone)
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)),
    prefix: 'rl:auth:',
  }),
  keyGenerator: (req: Request) => {
    const phone = req.body?.phone || req.body?.phoneNumber || '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${ip}:${phone}`;
  },
  handler: (req: Request, res: Response) => {
    sendError(
      res,
      429,
      'TOO_MANY_REQUESTS',
      'auth.rate_limit_exceeded',
      'Too many authentication attempts. Please try again after a minute.'
    );
  },
});

// General API Rate Limiter (120 requests / min per API Key / IP)
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)),
    prefix: 'rl:general:',
  }),
  keyGenerator: (req: Request) => {
    return req.apiKey?.id || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    sendError(
      res,
      429,
      'RATE_LIMIT_EXCEEDED',
      'common.rate_limit_exceeded',
      'Rate limit exceeded. Please slow down.'
    );
  },
});
