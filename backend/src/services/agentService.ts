import { Agent } from '../models/AIAgent';
import { ApiError } from '../utils/ApiError';

export interface AgentInput {
  name: string;
  description?: string;
  instructions: string;
  model?: string;
  temperature?: number;
  tools?: Array<{ name: string; enabled: boolean }>;
  knowledge?: string;
  memory?: boolean;
  executionLimit?: number;
  status?: 'active' | 'inactive' | 'error';
}

export const agentService = {
  async list(organizationId: string) {
    return Agent.find({ organizationId })
      .sort({ createdAt: -1 })
      .lean();
  },

  async listForOrg(organizationId: string) {
    return Agent.find({ organizationId }).sort({ createdAt: -1 }).select('_id name status').lean();
  },

  async getById(organizationId: string, id: string) {
    const agent = await Agent.findOne({ _id: id, organizationId }).lean();
    if (!agent) throw ApiError.notFound('Agent not found');
    return agent;
  },

  async create(organizationId: string, userId: string, input: AgentInput) {
    if (!input.name) throw ApiError.badRequest('Agent name is required');
    if (!input.instructions) throw ApiError.badRequest('System instructions are required');
    return Agent.create({
      organizationId,
      createdBy: userId,
      name: input.name,
      description: input.description,
      instructions: input.instructions,
      model: input.model ?? 'auto',
      temperature: input.temperature ?? 0.7,
      tools: input.tools ?? [],
      knowledge: input.knowledge,
      memory: input.memory ?? false,
      executionLimit: input.executionLimit ?? 1000,
      status: input.status ?? 'inactive',
    });
  },

  async update(organizationId: string, id: string, patch: Partial<AgentInput>) {
    const fields: Record<string, unknown> = {};
    if (patch.name !== undefined) fields.name = patch.name;
    if (patch.description !== undefined) fields.description = patch.description;
    if (patch.instructions !== undefined) fields.instructions = patch.instructions;
    if (patch.model !== undefined) fields.model = patch.model;
    if (patch.temperature !== undefined) fields.temperature = patch.temperature;
    if (patch.tools !== undefined) fields.tools = patch.tools;
    if (patch.knowledge !== undefined) fields.knowledge = patch.knowledge;
    if (patch.memory !== undefined) fields.memory = patch.memory;
    if (patch.executionLimit !== undefined) fields.executionLimit = patch.executionLimit;
    if (patch.status !== undefined) fields.status = patch.status;

    const agent = await Agent.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: fields },
      { new: true }
    ).lean();
    if (!agent) throw ApiError.notFound('Agent not found');
    return agent;
  },

  async remove(organizationId: string, id: string) {
    const agent = await Agent.findOneAndDelete({ _id: id, organizationId }).lean();
    if (!agent) throw ApiError.notFound('Agent not found');
    return agent;
  },

  async recordExecution(agentId: string, success: boolean, tokens: number, durationMs: number) {
    await Agent.updateOne(
      { _id: agentId },
      {
        $inc: {
          executions: 1,
          ...(success ? { successCount: 1 } : {}),
          tokenUsage: tokens,
        },
        $set: { status: success ? 'active' : 'error' },
      }
    ).exec();
    // Recompute avg response time cheaply using an approximate EMA.
    const agent = await Agent.findById(agentId);
    if (agent) {
      agent.avgResponseMs = agent.avgResponseMs
        ? Math.round(agent.avgResponseMs * 0.9 + durationMs * 0.1)
        : durationMs;
      await agent.save();
    }
  },
};