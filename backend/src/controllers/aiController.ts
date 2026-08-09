import type { Request, Response } from 'express';
import { aiService, aiProviderStatus } from '../services/aiService';
import { workflowService } from '../services/workflowService';
import { ok } from '../utils/http';

export const aiController = {
  async generateWorkflow(req: Request, res: Response) {
    const result = await aiService.generateWorkflow({
      description: req.body.description,
      goal: req.body.goal,
      tools: req.body.tools,
      name: req.body.name,
    });
    return ok(res, result);
  },

  /** Takes the generated suggestion and persists it as a workflow. */
  async saveGeneratedWorkflow(req: Request, res: Response) {
    const wf = await workflowService.create(String(req.org!._id), String(req.user!._id), {
      name: req.body.name,
      description: req.body.description,
      nodes: req.body.nodes,
      edges: req.body.edges,
      status: 'draft',
    });
    return ok(res, wf);
  },

  async generateText(req: Request, res: Response) {
    const result = await aiService.generateText({
      provider: req.body.provider,
      model: req.body.model,
      prompt: req.body.prompt,
      system: req.body.system,
      temperature: req.body.temperature,
    });
    return ok(res, result);
  },

  async analyze(req: Request, res: Response) {
    const result = await aiService.analyze({
      provider: req.body.provider,
      model: req.body.model,
      text: req.body.text,
      prompt: req.body.prompt,
    });
    return ok(res, result);
  },

  async providerStatus(_req: Request, res: Response) {
    return ok(res, aiProviderStatus());
  },
};