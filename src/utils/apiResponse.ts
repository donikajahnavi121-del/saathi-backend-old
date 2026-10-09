import { Response } from 'express';

export interface ApiErrorPayload {
  code: string;
  messageKey: string;
  message: string;
  details?: any;
}

export interface ApiResponsePayload<T = any> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  meta?: any;
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public messageKey: string;
  public details?: any;

  constructor(statusCode: number, code: string, messageKey: string, message: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.messageKey = messageKey;
    this.details = details || null;
  }
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: any) {
  const payload: ApiResponsePayload<T> = {
    success: true,
    data,
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  messageKey: string,
  message: string,
  details: any = null
) {
  return res.status(statusCode).json({
    code,
    messageKey,
    message,
    details,
  });
}
