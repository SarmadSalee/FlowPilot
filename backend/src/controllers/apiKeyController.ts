import type { Request, Response } from 'express';
import { apiKeyService } from '../services/apiKeyService';
import { ok } from '../utils/http';

export const apiKeyController = {
  async create(req: Request, res: Response) {
    const result = await apiKeyService.create(String(req.org!._id), String(req.user!._id), req.body.name);
    return ok(res, result);
  },

  async list(req: Request, res: Response) {
    return ok(res, await apiKeyService.list(String(req.org!._id)));
  },

  async revoke(req: Request, res: Response) {
    return ok(res, await apiKeyService.revoke(String(req.org!._id), req.params.id));
  },
};