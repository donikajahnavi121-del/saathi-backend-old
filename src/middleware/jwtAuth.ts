import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../services/token.service.js';
import { sendError } from '../utils/apiResponse.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Layer 2 Auth: Validates user JWT access token in Authorization: Bearer <token>
 */
export function requireJwtAuth(req: Request, res: Response, next: NextFunction): any {
  const authHeader = req.header('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(
      res,
      401,
      'UNAUTHORIZED',
      'auth.missing_token',
      'Authorization bearer token is required.'
    );
  }

  const token = authHeader.substring(7).trim();

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return sendError(
        res,
        401,
        'TOKEN_EXPIRED',
        'auth.token_expired',
        'Session expired. Please refresh your session.'
      );
    }
    return sendError(
      res,
      401,
      'INVALID_TOKEN',
      'auth.invalid_token',
      'Invalid authorization token.'
    );
  }
}
