import type { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate =
  (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(ApiError.badRequest('Validation failed', result.error.issues));
    }
    req[target] = result.data as never;
    return next();
  };