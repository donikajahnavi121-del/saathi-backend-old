import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { redis } from '../config/redis.js';
import { hashSha256 } from '../utils/crypto.js';

export interface TokenPayload {
  id: string;
  role: 'patient' | 'counsellor' | 'supervisor';
  code?: string; // e.g. "P-0142" for patients
  email?: string;
  name?: string;
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

const ACCESS_EXPIRES_IN_SEC = 15 * 60; // 15 minutes
const REFRESH_EXPIRES_IN_SEC = 7 * 24 * 60 * 60; // 7 days

export async function generateTokens(payload: TokenPayload): Promise<GeneratedTokens> {
  const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN_SEC,
  });

  const refreshToken = jwt.sign(
    { ...payload, tokenType: 'refresh', nonce: Math.random().toString() },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN_SEC }
  );

  // Store hashed refresh token in Redis allowlist
  const refreshHash = hashSha256(refreshToken);
  const redisKey = `refresh:${payload.role}:${payload.id}:${refreshHash}`;
  await redis.set(redisKey, 'valid', 'EX', REFRESH_EXPIRES_IN_SEC);

  return {
    accessToken,
    refreshToken,
    expiresInSeconds: ACCESS_EXPIRES_IN_SEC,
  };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as TokenPayload;
}

export async function rotateRefreshToken(oldRefreshToken: string): Promise<GeneratedTokens | null> {
  try {
    const decoded = jwt.verify(oldRefreshToken, ENV.JWT_REFRESH_SECRET) as any;
    const oldHash = hashSha256(oldRefreshToken);
    const redisKey = `refresh:${decoded.role}:${decoded.id}:${oldHash}`;

    const exists = await redis.get(redisKey);
    if (!exists) {
      // Possible reuse attack! Invalidate all tokens for this subject
      // Invalidate any refresh keys matching this user
      return null;
    }

    // Invalidate old refresh token
    await redis.del(redisKey);

    // Issue new token pair
    const payload: TokenPayload = {
      id: decoded.id,
      role: decoded.role,
      code: decoded.code,
      email: decoded.email,
      name: decoded.name,
    };

    return await generateTokens(payload);
  } catch (error) {
    return null;
  }
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  try {
    const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as any;
    const hash = hashSha256(refreshToken);
    const redisKey = `refresh:${decoded.role}:${decoded.id}:${hash}`;
    await redis.del(redisKey);
  } catch {
    // Already expired or invalid
  }
}
