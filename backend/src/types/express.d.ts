/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      org?: any;
      orgRole?: string;
      apiKeyAuth?: boolean;
    }
  }
}

export {};