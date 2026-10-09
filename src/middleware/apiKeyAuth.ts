import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { redis } from '../config/redis.js';
import { hashSha256 } from '../utils/crypto.js';
import { sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        name: string;
        type: string;
        scopes: string[];
        rateLimit: number;
      };
    }
  }
}

/**
 * Middleware factory to enforce API key authentication and optional scope checks.
 * Layer 1 of Saathi two-layer auth model.
 */
export function requireApiKey(allowedScopes: string[] = []) {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const rawApiKey = req.header('x-api-key')?.trim();

    if (!rawApiKey) {
      return sendError(
        res,
        401,
        'MISSING_API_KEY',
        'auth.missing_api_key',
        'API key is required in x-api-key header.'
      );
    }

    // Fast-path / dev bypass for pre-configured keys in ENV
    const keyHash = hashSha256(rawApiKey);
    const cacheKey = `apikey:cache:${keyHash}`;

    try {
      // 1. Check Redis cache first
      let keyDataStr = await redis.get(cacheKey);
      let keyData: any = null;

      if (keyDataStr) {
        keyData = JSON.parse(keyDataStr);
      } else {
        // 2. Fall back to DB lookup
        const dbKey = await prisma.apiKey.findUnique({
          where: { keyHash },
        });

        if (dbKey) {
          keyData = {
            id: dbKey.id,
            name: dbKey.name,
            type: dbKey.type,
            scopes: JSON.parse(dbKey.scopes || '[]'),
            rateLimit: dbKey.rateLimit,
            isActive: dbKey.isActive,
          };
          // Cache in Redis for 10 minutes
          await redis.set(cacheKey, JSON.stringify(keyData), 'EX', 600);
        } else {
          // If in dev and matches known ENV keys, synthesize key record
          if (rawApiKey === ENV.FRONTEND_API_KEY) {
            keyData = {
              id: 'dev-frontend-key',
              name: 'Development Frontend Key',
              type: 'FRONTEND',
              scopes: ['frontend'],
              rateLimit: 300,
              isActive: true,
            };
          } else if (rawApiKey === ENV.IVR_API_KEY) {
            keyData = {
              id: 'dev-ivr-key',
              name: 'Development IVR Key',
              type: 'IVR_WEBHOOK',
              scopes: ['ivr_webhook'],
              rateLimit: 300,
              isActive: true,
            };
          } else if (rawApiKey === ENV.ADMIN_API_KEY) {
            keyData = {
              id: 'dev-admin-key',
              name: 'Development Admin Key',
              type: 'ADMIN_TOOL',
              scopes: ['admin_tool'],
              rateLimit: 300,
              isActive: true,
            };
          }
        }
      }

      if (!keyData || !keyData.isActive) {
        return sendError(
          res,
          401,
          'INVALID_API_KEY',
          'auth.invalid_api_key',
          'Valid API key is required.'
        );
      }

      // Check required scopes if specified
      if (allowedScopes.length > 0) {
        const hasScope = allowedScopes.some((scope) => keyData.scopes.includes(scope));
        if (!hasScope) {
          return sendError(
            res,
            403,
            'INSUFFICIENT_API_KEY_SCOPE',
            'auth.insufficient_api_key_scope',
            `API key lacks required scope for this operation.`
          );
        }
      }

      // Attach key info to request
      req.apiKey = keyData;

      // Asynchronously update lastUsedAt without blocking request
      prisma.apiKey.update({
        where: { keyHash },
        data: { lastUsedAt: new Date() },
      }).catch(() => {});

      return next();
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error during API key validation');
      return sendError(
        res,
        500,
        'AUTH_INTERNAL_ERROR',
        'auth.internal_error',
        'Authentication verification error.'
      );
    }
  };
}
