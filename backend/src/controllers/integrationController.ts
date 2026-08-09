import type { Request, Response } from 'express';
import { integrationService } from '../services/integrationService';
import { ok } from '../utils/http';

export const integrationController = {
  async list(req: Request, res: Response) {
    const integrations = await integrationService.list(String(req.org!._id));
    return ok(res, integrations);
  },

  async connect(req: Request, res: Response) {
    const result = await integrationService.connect(
      String(req.org!._id),
      req.params.key,
      req.body?.credentials
    );
    return ok(res, result);
  },

  async disconnect(req: Request, res: Response) {
    const result = await integrationService.disconnect(String(req.org!._id), req.params.key);
    return ok(res, result);
  },
};