import type { Request, Response } from 'express';
import { templateService } from '../services/templateService';
import { workflowService } from '../services/workflowService';
import { ok } from '../utils/http';

export const templateController = {
  async list(req: Request, res: Response) {
    const templates = await templateService.list(req.query.category ? String(req.query.category) : undefined);
    return ok(res, templates);
  },

  async getBySlug(req: Request, res: Response) {
    const template = await templateService.getBySlug(req.params.slug);
    return ok(res, template);
  },

  async useTemplate(req: Request, res: Response) {
    const template = await templateService.getBySlug(req.params.slug);
    const wf = await workflowService.create(String(req.org!._id), String(req.user!._id), {
      name: req.body.name ?? template.name,
      description: template.description ?? undefined,
      nodes: JSON.parse(JSON.stringify(template.nodes ?? [])),
      edges: JSON.parse(JSON.stringify(template.edges ?? [])),
      status: 'draft',
    });
    return ok(res, { workflow: wf });
  },
};