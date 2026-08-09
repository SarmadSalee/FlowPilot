import type { Request, Response } from 'express';
import { executionService } from '../services/executionService';
import { ok } from '../utils/http';

export const executionController = {
  async list(req: Request, res: Response) {
    const query = {
      status: String(req.query.status ?? 'all'),
      workflowId: req.query.workflowId ? String(req.query.workflowId) : undefined,
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 30),
    };
    const result = await executionService.list(String(req.org!._id), query);
    return ok(res, result.executions, { total: result.total, page: result.page, limit: result.limit });
  },

  async getById(req: Request, res: Response) {
    const execution = await executionService.getById(String(req.org!._id), req.params.id);
    return ok(res, execution);
  },
};