import { Workflow, type WorkflowNode, type WorkflowEdge } from '../models/Workflow';
import { Execution } from '../models/WorkflowExecution';
import { WorkflowEngine, EngineResult } from '../automation/engine';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export interface WorkflowInput {
  name: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

function sanitizeGraph(input: WorkflowInput): {
  name: string;
  description?: string;
  status?: WorkflowInput['status'];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
} {
  const nodes = (input.nodes ?? []).map((n) => ({
    ...n,
    position: { x: Number(n.position?.x ?? 0), y: Number(n.position?.y ?? 0) },
    enabled: n.enabled !== false,
  }));
  const edges = (input.edges ?? []).map((e) => ({
    ...e,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
  }));
  return { name: input.name, description: input.description, status: input.status, nodes, edges };
}

export const workflowService = {
  async list(organizationId: string, status?: string) {
    const query: Record<string, unknown> = { organizationId, isTemplate: false };
    if (status && status !== 'all') query.status = status;
    return Workflow.find(query)
      .sort({ updatedAt: -1 })
      .select('-nodes -edges')
      .limit(100)
      .lean();
  },

  async getById(organizationId: string, workflowId: string) {
    const wf = await Workflow.findOne({ _id: workflowId, organizationId }).lean();
    if (!wf) throw ApiError.notFound('Workflow not found');
    return wf;
  },

  async create(organizationId: string, userId: string, input: WorkflowInput) {
    const graph = sanitizeGraph(input);
    const wf = await Workflow.create({
      organizationId,
      createdBy: userId,
      name: graph.name || 'Untitled workflow',
      description: graph.description,
      status: graph.status ?? 'draft',
      nodes: graph.nodes,
      edges: graph.edges,
    });
    return wf.toObject();
  },

  async update(organizationId: string, workflowId: string, input: Partial<WorkflowInput>) {
    const graph = sanitizeGraph({ name: 'x', ...input } as WorkflowInput);
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.status !== undefined) patch.status = input.status;
    if (input.nodes !== undefined) patch.nodes = graph.nodes;
    if (input.edges !== undefined) patch.edges = graph.edges;

    const wf = await Workflow.findOneAndUpdate(
      { _id: workflowId, organizationId },
      { $set: patch },
      { new: true }
    ).lean();
    if (!wf) throw ApiError.notFound('Workflow not found');
    return wf;
  },

  async remove(organizationId: string, workflowId: string) {
    const wf = await Workflow.findOneAndDelete({ _id: workflowId, organizationId }).lean();
    if (!wf) throw ApiError.notFound('Workflow not found');
    await Execution.deleteMany({ workflowId }).exec();
    return wf;
  },

  async changeStatus(organizationId: string, workflowId: string, status: string) {
    const allowed = ['draft', 'active', 'paused', 'archived'];
    if (!allowed.includes(status)) throw ApiError.badRequest('Invalid status');
    const wf = await Workflow.findOneAndUpdate(
      { _id: workflowId, organizationId },
      { $set: { status } },
      { new: true }
    ).lean();
    if (!wf) throw ApiError.notFound('Workflow not found');
    return wf;
  },

  async run(
    organizationId: string,
    userId: string,
    workflowId: string,
    opts: { triggerData?: Record<string, unknown>; test?: boolean }
  ): Promise<EngineResult> {
    const wf = await Workflow.findOne({ _id: workflowId, organizationId }).lean();
    if (!wf) throw ApiError.notFound('Workflow not found');
    if (!wf.nodes?.some((n) => n.type === 'trigger')) {
      throw ApiError.badRequest('Workflow must contain a trigger node');
    }

    const triggerData = opts.triggerData ?? WorkflowEngine.buildTriggerData(wf.name);

    const engine = new WorkflowEngine({
      _id: wf._id,
      name: wf.name,
      nodes: wf.nodes ?? [],
      edges: wf.edges ?? [],
      organizationId,
    });

    return engine.run({
      workflowId,
      organizationId,
      userId,
      triggerData,
      isTestRun: Boolean(opts.test),
      simulate: env.demoToggle,
    });
  },
};