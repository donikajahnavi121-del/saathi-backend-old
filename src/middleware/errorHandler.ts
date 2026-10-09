import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): any {
  // Handle AppError
  if (err instanceof AppError) {
    return sendError(
      res,
      err.statusCode,
      err.code,
      err.messageKey,
      err.message,
      err.details
    );
  }

  // Handle Zod Schema Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(
      res,
      422,
      'VALIDATION_ERROR',
      'validation.failed',
      'One or more input fields are invalid.',
      formattedErrors
    );
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    return sendError(
      res,
      400,
      'FILE_UPLOAD_ERROR',
      'upload.failed',
      err.message || 'Error uploading file.'
    );
  }

  // Handle unexpected internal errors
  logger.error(
    {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    },
    'Unhandled server error'
  );

  return sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    'common.server_error',
    'An unexpected error occurred. Please try again shortly.'
  );
}
