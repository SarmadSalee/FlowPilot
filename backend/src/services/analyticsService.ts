import { Execution } from '../models/WorkflowExecution';
import { Workflow } from '../models/Workflow';

const SAVED_MINUTES_PER_EXECUTION = 10;

function tokensOfStep(steps: Array<Record<string, any>> | undefined): number {
  let tokens = 0;
  for (const step of steps ?? []) {
    if (String(step.nodeKey ?? '').startsWith('ai_')) {
      const usage = step.output?.usage as { totalTokens?: number } | undefined;
      if (usage && typeof usage.totalTokens === 'number') tokens += usage.totalTokens;
    }
  }
  return tokens;
}

export const analyticsService = {
  async summary(organizationId: string) {
    const [workflows, executions] = await Promise.all([
      Workflow.find({ organizationId, isTemplate: false }).lean(),
      Execution.find({ organizationId }).lean(),
    ]);

    const total = executions.length;
    const successful = executions.filter((e) => e.status === 'success').length;
    const failed = executions.filter((e) => e.status === 'failed').length;
    const aiSteps = executions.reduce(
      (acc, e) => acc + (e.steps ?? []).filter((s) => String(s.nodeKey ?? '').startsWith('ai_')).length,
      0
    );
    const tasksCompleted = executions.reduce(
      (acc, e) => acc + (e.steps ?? []).filter((s) => s.nodeKey === 'create_task').length,
      0
    );
    const tokens = executions.reduce((acc, e) => acc + tokensOfStep(e.steps as unknown as Array<Record<string, any>>), 0);
    const stepsProcessed = executions.reduce((acc, e) => acc + (e.steps ?? []).length, 0);
    const avgDurationMs =
      total > 0 ? executions.reduce((acc, e) => acc + (e.durationMs ?? 0), 0) / total : 0;
    const timeSavedHours = Math.round((total * SAVED_MINUTES_PER_EXECUTION * 4) / 60);
    const successRate = total > 0 ? Math.round((successful / total) * 1000) / 10 : 100;

    return {
      totalExecutions: total,
      successful,
      failed,
      tasksCompleted,
      aiTasks: aiSteps,
      stepsProcessed,
      tokenUsage: tokens,
      avgDurationMs: Math.round(avgDurationMs),
      timeSavedHours,
      successRate,
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter((w) => w.status === 'active').length,
    };
  },

  async timeSeries(organizationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const rows = await Execution.aggregate([
      { $match: { organizationId, createdAt: { $gte: since } } },
      {
        $project: {
          status: 1,
          durationMs: 1,
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          aiSteps: {
            $size: { $filter: { input: '$steps', as: 's', cond: { $regexMatch: { input: '$$s.nodeKey', regex: '^ai_' } } } },
          },
        },
      },
      {
        $group: {
          _id: '$day',
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          aiTasks: { $sum: '$aiSteps' },
          durationMs: { $sum: { $ifNull: ['$durationMs', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byDate = new Map(rows.map((r) => [r._id as string, r]));
    const series = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const r = byDate.get(key);
      series.push({
        date: key,
        executions: r?.total ?? 0,
        success: r?.success ?? 0,
        failed: r?.failed ?? 0,
        aiTasks: r?.aiTasks ?? 0,
        durationMs: r?.durationMs ?? 0,
      });
    }
    return series;
  },

  async usedWorkflow(organizationId: string, limit = 6) {
    const rows = await Execution.aggregate([
      { $match: { organizationId } },
      {
        $group: {
          _id: '$workflowId',
          total: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          avgDurationMs: { $avg: { $ifNull: ['$durationMs', 0] } },
        },
      },
      { $sort: { total: -1 } },
      { $limit: limit },
    ]);

    const workflows = await Workflow.find({ _id: { $in: rows.map((r) => r._id) } })
      .select('name')
      .lean();
    const nameMap = new Map(workflows.map((w) => [String(w._id), w.name]));

    return rows.map((r) => ({
      workflowId: String(r._id),
      name: nameMap.get(String(r._id)) ?? 'Unknown workflow',
      total: r.total,
      successful: r.successful,
      failed: r.failed,
      avgDurationMs: Math.round(r.avgDurationMs),
    }));
  },

  async recentExecutions(organizationId: string, limit = 8) {
    const executions = await Execution.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const ids = [...new Set(executions.map((e) => String(e.workflowId)))];
    const workflows = ids.length
      ? await Workflow.find({ _id: { $in: ids } }).select('name').lean()
      : [];
    const nameMap = new Map(workflows.map((w) => [String(w._id), w.name]));

    return executions.map((e) => ({
      _id: String(e._id),
      workflowId: String(e.workflowId),
      workflowName: nameMap.get(String(e.workflowId)) ?? e.name,
      status: e.status,
      startedAt: e.startedAt,
      durationMs: e.durationMs,
      steps: (e.steps ?? []).length,
      isTestRun: e.isTestRun,
    }));
  },
};