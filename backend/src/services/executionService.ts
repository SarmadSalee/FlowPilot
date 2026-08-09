import { Execution } from '../models/WorkflowExecution';
import { Workflow } from '../models/Workflow';
import { ApiError } from '../utils/ApiError';

export const executionService = {
  async list(
    organizationId: string,
    query: { status?: string; workflowId?: string; page?: number; limit?: number }
  ) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 30)));
    const filter: Record<string, unknown> = { organizationId };
    if (query.status && query.status !== 'all') filter.status = query.status;
    if (query.workflowId) filter.workflowId = query.workflowId;

    const [executions, total] = await Promise.all([
      Execution.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Execution.countDocuments(filter),
    ]);

    // Map workflow names for display
    const workflowIds = [...new Set(executions.map((e) => String(e.workflowId)))];
    const workflows = await Workflow.find({ _id: { $in: workflowIds } }).select('name').lean();
    const nameMap = new Map(workflows.map((w) => [String(w._id), w.name]));

    const rows = executions.map((e) => ({
      _id: String(e._id),
      workflowId: String(e.workflowId),
      workflowName: nameMap.get(String(e.workflowId)) ?? e.name,
      status: e.status,
      startedAt: e.startedAt,
      completedAt: e.completedAt,
      durationMs: e.durationMs,
      isTestRun: e.isTestRun,
      trigger: e.trigger,
      stepCount: e.steps?.length ?? 0,
      createdAt: e.createdAt,
      error: e.error ?? undefined,
    }));

    return { executions: rows, total, page, limit };
  },

  async getById(organizationId: string, executionId: string) {
    const execution = await Execution.findOne({ _id: executionId, organizationId }).lean();
    if (!execution) throw ApiError.notFound('Execution not found');
    const workflow = await Workflow.findById(execution.workflowId).select('name nodes edges').lean();
    return {
      ...execution,
      _id: String(execution._id),
      workflowId: String(execution.workflowId),
      workflowName: workflow?.name ?? execution.name,
      workflowGraph: workflow ? { nodes: workflow.nodes, edges: workflow.edges } : undefined,
    };
  },

  async listByWorkflow(organizationId: string, workflowId: string, limit = 20) {
    return Execution.find({ organizationId, workflowId })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .select('_id status startedAt durationMs isTestRun createdAt')
      .lean();
  },

  async deleteManyForWorkflow(workflowId: string) {
    await Execution.deleteMany({ workflowId }).exec();
  },
};