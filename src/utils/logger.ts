import pino from 'pino';
import { ENV } from '../config/env.js';

export const logger = pino({
  level: ENV.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-api-key"]',
      'req.headers["authorization"]',
      'headers.authorization',
      'headers["x-api-key"]',
      'password',
      'passwordHash',
      'pin',
      'pinHash',
      'otp',
      'phone',
      'phoneNumber',
      'phoneEncrypted',
      'notes',
      'notesEncrypted',
      'freeText',
      'freeTextEncrypted',
      'token',
      'accessToken',
      'refreshToken'
    ],
    censor: '[REDACTED_PII]',
  },
  transport:
    ENV.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
