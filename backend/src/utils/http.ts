import type { NextFunction, Request, RequestHandler, Response } from 'express';

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/** Express 4 compatible wrapper for async controllers. */
export const wrap =
  (
    fn: (req: Request, res: Response) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

export const ok = (res: Response, data: unknown, meta?: Record<string, unknown>) => {
  return res.json({ success: true, data, meta });
};

export const created = (res: Response, data: unknown) => {
  return res.status(201).json({ success: true, data });
};

export const noContent = (res: Response) => {
  return res.status(204).end();
};