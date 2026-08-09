import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode = err instanceof ApiError ? err.statusCode : 500;
  let message = err instanceof ApiError ? err.message : 'Internal server error';
  let code = err instanceof ApiError ? err.code ?? 'ERROR' : 'INTERNAL';
  let details: unknown = err instanceof ApiError ? err.details : undefined;

  if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  }

  if (err && (err as { name?: string }).name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid resource identifier';
  }

  if (err && (err as { code?: number }).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE';
    message = 'Resource already exists';
  }

  if (env.isDev && statusCode === 500) {
    console.error('[error]', err);
  }

  if (res.headersSent) {
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message, details },
  });
};