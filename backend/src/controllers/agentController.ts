import type { Request, Response } from 'express';
import { agentService } from '../services/agentService';
import { aiService } from '../services/aiService';
import { ok } from '../utils/http';

export const agentController = {
  async list(req: Request, res: Response) {
    return ok(res, await agentService.list(String(req.org!._id)));
  },

  async listForOrg(req: Request, res: Response) {
    return ok(res, await agentService.listForOrg(String(req.org!._id)));
  },

  async getById(req: Request, res: Response) {
    return ok(res, await agentService.getById(String(req.org!._id), req.params.id));
  },

  async create(req: Request, res: Response) {
    const agent = await agentService.create(String(req.org!._id), String(req.user!._id), req.body);
    await agentService.recordExecution(String(agent._id), true, 0, 0);
    return ok(res, agent);
  },

  async update(req: Request, res: Response) {
    return ok(res, await agentService.update(String(req.org!._id), req.params.id, req.body));
  },

  async remove(req: Request, res: Response) {
    await agentService.remove(String(req.org!._id), req.params.id);
    return ok(res, { message: 'Agent deleted' });
  },

  /** Run a test invocation of the agent. */
  async run(req: Request, res: Response) {
    const agent = await agentService.getById(String(req.org!._id), req.params.id);
    const start = Date.now();
    const result = await aiService.generateText({
      provider: 'auto',
      model: agent.model === 'auto' ? undefined : agent.model,
      system: agent.instructions,
      temperature: agent.temperature,
      prompt: String(req.body?.message ?? ''),
    });
    const duration = Date.now() - start;
    await agentService.recordExecution(String(agent._id), true, result.usage.totalTokens ?? 0, duration);
    return ok(res, { ...result, durationMs: duration });
  },
};