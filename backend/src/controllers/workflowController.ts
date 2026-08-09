import type { Request, Response } from 'express';
import { workflowService } from '../services/workflowService';
import { ok } from '../utils/http';

function orgId(req: Request): string {
  return String(req.org!._id);
}

export const workflowController = {
  async list(req: Request, res: Response) {
    const items = await workflowService.list(orgId(req), String(req.query.status ?? 'all'));
    return ok(res, items);
  },

  async getById(req: Request, res: Response) {
    const wf = await workflowService.getById(orgId(req), req.params.id);
    return ok(res, wf);
  },

  async create(req: Request, res: Response) {
    const wf = await workflowService.create(orgId(req), String(req.user!._id), req.body);
    return ok(res, wf);
  },

  async update(req: Request, res: Response) {
    const wf = await workflowService.update(orgId(req), req.params.id, req.body);
    return ok(res, wf);
  },

  async remove(req: Request, res: Response) {
    await workflowService.remove(orgId(req), req.params.id);
    return ok(res, { message: 'Workflow deleted' });
  },

  async changeStatus(req: Request, res: Response) {
    const wf = await workflowService.changeStatus(orgId(req), req.params.id, req.body.status);
    return ok(res, wf);
  },

  async run(req: Request, res: Response) {
    const result = await workflowService.run(orgId(req), String(req.user!._id), req.params.id, {
      triggerData: req.body?.triggerData,
      test: false,
    });
    return ok(res, result);
  },

  async test(req: Request, res: Response) {
    const result = await workflowService.run(orgId(req), String(req.user!._id), req.params.id, {
      triggerData: req.body?.triggerData,
      test: true,
    });
    return ok(res, result);
  },
};