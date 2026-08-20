import { Execution, type ExecutionStep } from '../models/WorkflowExecution';
import { Workflow, type WorkflowNode, type WorkflowEdge } from '../models/Workflow';
import { getProvider } from '../ai';
import { ApiError } from '../utils/ApiError';
import { NODE_DEFINITIONS } from './nodes';

interface ExecuteOptions {
  workflowId: string;
  organizationId: string;
  userId: string;
  triggerData?: Record<string, unknown>;
  isTestRun?: boolean;
  /** When true every external call is simulated; requires no API keys. */
  simulate: boolean;
}

export interface EngineResult {
  executionId: string;
  status: 'success' | 'failed';
  steps: ExecutionStep[];
  durationMs: number;
  output: Record<string, unknown>;
  usage?: { tokens: number };
}

type Data = Record<string, unknown>;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function getPath(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    if (typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    if (typeof acc === 'string') {
      try {
        const parsed = JSON.parse(acc) as unknown;
        return (parsed as Record<string, unknown>)[key];
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, obj);
}

function resolveTemplate(template: string, data: Data): string {
  let out = template;
  let guard = 0;
  while (out.includes('{{') && guard++ < 5) {
    const before = out;
    out = out.replace(/\{\{([^}]+)\}\}/g, (_m, key: string) => {
      const v = getPath(data, key.trim());
      if (v === undefined || v === null) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    });
    if (out === before) break;
  }
  return out;
}

function extractJson(text: string): string {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) {
    return text.slice(first, last + 1);
  }
  return text;
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && !isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v);
  return undefined;
}

const sleepWhile = async (ms: number, simulate: boolean) => {
  await sleep(simulate ? Math.min(ms, 600) : Math.min(ms, 150));
};

interface StepResult {
  output: Data;
  message: string;
  durationMs: number;
}

export class WorkflowEngine {
  private readonly nodes: Map<string, WorkflowNode>;
  private readonly edges: WorkflowEdge[];
  private readonly workflowName: string;

  constructor(workflow: {
    _id?: unknown;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    organizationId: unknown;
  }) {
    this.workflowName = workflow.name;
    this.edges = workflow.edges ?? [];
    this.nodes = new Map(
      (workflow.nodes ?? []).filter((n) => n).map((n) => [n.id, n])
    );
  }

  private labelFor(node: WorkflowNode): string {
    const def = NODE_DEFINITIONS.find((d) => d.key === node.key);
    return def?.label ?? node.label ?? node.key;
  }

  static buildTriggerData(_workflowName: string): Data {
    const names = ['Sarah Chen', 'Marcus Webb', 'Emily Park', 'Daniel Okafor', 'Priya Sharma'];
    const companies = ['Acme Corp', 'Brightwave', 'Northwind Labs', 'Helio Health', 'Vantage Group'];
    const emails = ['sarah@acme.io', 'marcus@brightwave.ai', 'emily@northwind.io', 'daniel@helio.io', 'priya@vantage.co'];
    const i = Math.floor(Math.random() * names.length);
    return {
      name: names[i],
      company: companies[i],
      email: emails[i],
      budget: [15000, 28000, 45000, 9000, 62000][i],
      source: 'Website form',
      industry: ['SaaS', 'Healthcare', 'E-commerce', 'Fintech', 'Logistics'][i],
      created_at: new Date().toISOString(),
    };
  }

  async run(opts: ExecuteOptions): Promise<EngineResult> {
    const startedAt = new Date();
    const steps: ExecutionStep[] = [];
    const context: Data = {
      ...(opts.triggerData ?? {}),
    };
    const usage = { tokens: 0 };

    const triggers = [...this.nodes.values()].filter((n) => n.type === 'trigger');
    if (triggers.length === 0) {
      throw ApiError.badRequest('Workflow must contain a trigger node');
    }
    const trigger = triggers[0];

    // Trigger step
    steps.push({
      ...this.step(trigger, 'success', startedAt),
      completedAt: new Date(startedAt.getTime() + 35),
      message: `Trigger received: ${this.labelFor(trigger)}`,
      output: { ...(opts.triggerData ?? {}) },
    });

    // Seed a condition value used for branching of condition nodes
    const queue: WorkflowNode[] = [];
    const visited = new Set<string>([trigger.id]);

    const enqueue = (edges: WorkflowEdge[]) => {
      for (const edge of edges) {
        const target = this.nodes.get(edge.target);
        if (target && !visited.has(target.id)) {
          visited.add(target.id);
          queue.push(target);
        }
      }
    };
    enqueue(this.edges.filter((e) => e.source === trigger.id));

    let failed = false;

    while (queue.length > 0) {
      const node = queue.shift()!;
      const stepStarted = new Date();

      // Disabled nodes are skipped but pass execution through to downstream nodes.
      if (node.enabled === false) {
        steps.push({
          ...this.step(node, 'success', stepStarted),
          completedAt: new Date(stepStarted.getTime() + 5),
          durationMs: 5,
          message: `Node disabled — skipped`,
          output: {},
        });
        enqueue(this.nextEdges(node, context));
        continue;
      }

      steps.push(this.step(node, 'running', stepStarted));

      let result: StepResult;
      try {
        result = await this.executeNode(node, context, opts, stepStarted, usage);
      } catch (err) {
        steps[steps.length - 1] = {
          ...steps[steps.length - 1],
          status: 'failed',
          completedAt: new Date(),
          durationMs: Date.now() - stepStarted.getTime(),
          error: err instanceof Error ? err.message : String(err),
        };
        failed = true;
        break;
      }

      const step = steps[steps.length - 1];
      step.status = 'success';
      step.completedAt = new Date();
      step.durationMs = result.durationMs;
      step.output = result.output;
      step.message = result.message;

      enqueue(this.nextEdges(node, context));
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const status: 'success' | 'failed' = failed ? 'failed' : 'success';

    const execution = await Execution.create({
      organizationId: opts.organizationId,
      workflowId: opts.workflowId,
      triggeredBy: opts.userId,
      name: this.workflowName,
      status,
      startedAt,
      completedAt,
      durationMs,
      steps,
      trigger: trigger.key,
      triggerData: opts.triggerData ?? {},
      isTestRun: Boolean(opts.isTestRun),
    });

    await Workflow.updateOne(
      { _id: opts.workflowId },
      {
        $inc: { runCount: 1, ...(status === 'success' ? { successCount: 1 } : { failCount: 1 }) },
        $set: { lastRunAt: new Date() },
      }
    ).exec();

    return {
      executionId: String(execution._id),
      status,
      steps,
      durationMs,
      output: context,
      usage,
    };
  }

  private step(node: WorkflowNode, status: ExecutionStep['status'], at: Date): ExecutionStep {
    return { nodeId: node.id, nodeKey: node.key, label: this.labelFor(node), status, startedAt: at, durationMs: 0 };
  }

  private nextEdges(node: WorkflowNode, context: Data): WorkflowEdge[] {
    const edges = this.edges.filter((e) => e.source === node.id);
    if (node.type !== 'condition') return edges;
    const truthy = Boolean(context[node.id]);
    // Condition nodes have two handles: 'true' and 'false'
    return edges.filter((e) => {
      if (e.sourceHandle === 'true') return truthy;
      if (e.sourceHandle === 'false') return !truthy;
      return true;
    });
  }

  private async executeNode(
    node: WorkflowNode,
    context: Data,
    opts: ExecuteOptions,
    startedAt: Date,
    usage: { tokens: number }
  ): Promise<StepResult> {
    const cfg = (node.config ?? {}) as Record<string, unknown>;
    const nodeStarted = startedAt.getTime();

    const during = async (
      fn: () => Promise<{ output: Data; message: string }>
    ): Promise<StepResult> => {
      const r = await fn();
      return { output: r.output, message: r.message, durationMs: Date.now() - nodeStarted };
    };

    switch (node.type) {
      case 'trigger':
        return during(async () => ({ output: context, message: `${node.label} triggered` }));

      case 'ai': {
        const promptTpl = String(cfg.prompt ?? `Analyze the following data and return a structured response.\n${JSON.stringify(context)}`);
        const prompt = resolveTemplate(promptTpl, context);
        const parseJson = Boolean(cfg.parseJson);
        const providerName = opts.simulate ? 'mock' : (String(cfg.provider ?? 'auto') as never);

        const provider = getProvider(providerName);
        await sleepWhile(opts.simulate ? 700 : 300, opts.simulate);

        const res = await provider.complete({
          messages: [{ role: 'user', content: prompt }],
          model: String(cfg.model ?? 'auto'),
          temperature: Number(cfg.temperature ?? 0.7),
          system: 'You are FlowPilot, an AI automation engine. Return precise, structured JSON when requested.',
        });

        usage.tokens += res.usage.totalTokens ?? 0;

        let parsed: unknown = res.text;
        if (parseJson) {
          try {
            parsed = JSON.parse(extractJson(res.text));
          } catch {
            parsed = res.text;
          }
        }

        const outKey = String(cfg.outputKey ?? 'ai_result');
        context[outKey] = parsed;

        return {
          ...await during(async () => ({
            output: { result: res.text, parsed, usage: res.usage },
            message: `${this.labelFor(node)} completed`,
          })),
        };
      }

      case 'condition': {
        const field = String(cfg.field ?? 'lead_score');
        const operator = String(cfg.operator ?? 'gte');
        const threshold = cfg.threshold ?? 0;
        const actual = getPath(context, field);

        let passed = false;
        const num = toNumber(actual);
        const thr = toNumber(threshold);
        switch (operator) {
          case 'gt': passed = num !== undefined && thr !== undefined && num > thr; break;
          case 'gte': passed = num !== undefined && thr !== undefined && num >= thr; break;
          case 'lt': passed = num !== undefined && thr !== undefined && num < thr; break;
          case 'lte': passed = num !== undefined && thr !== undefined && num <= thr; break;
          case 'eq': passed = String(actual) === String(threshold); break;
          case 'contains': passed = String(actual ?? '').toLowerCase().includes(String(threshold ?? '').toLowerCase()); break;
          case 'exists': passed = actual !== undefined && actual !== null && String(actual) !== ''; break;
          case 'truthy': passed = Boolean(actual); break;
          default: passed = Boolean(actual);
        }

        const branchKey = String(cfg.outputKey ?? node.id);
        context[branchKey] = passed;
        context[node.id] = passed;

        return during(async () => ({
          output: { field, operator, threshold, actual, passed, branch: passed ? 'true' : 'false' },
          message: `${this.labelFor(node)}: ${passed ? 'TRUE' : 'FALSE'}`,
        }));
      }

      case 'utility': {
        if (node.key === 'delay') {
          const seconds = Number(cfg.seconds ?? 0);
          await sleepWhile(Math.min(seconds || 1, 3) * 1000, opts.simulate);
        }
        return during(async () => {
          let output: unknown = { ...context };
          let message = `${this.labelFor(node)} applied`;
          if (node.key === 'formatter') {
            const tpl = String(cfg.template ?? '');
            output = resolveTemplate(tpl, context);
            message = 'Formatted: ' + String(output);
          }
          if (node.key === 'filter') {
            const field = String(cfg.field ?? '');
            const present = getPath(context, field) !== undefined && getPath(context, field) !== '';
            output = { ...context, filtered_out: !present };
            message = present ? 'Payload passed filter' : 'Payload filtered out';
          }
          return { output: { output }, message };
        });
      }

      case 'action': {
        await sleepWhile(opts.simulate ? 500 : 200, opts.simulate);
        return during(async () => {
          // Scoring actions modify the lead intelligence context.
          if (node.key === 'update_lead_score') {
            const mode = String(cfg.mode ?? 'increase');
            const value = Number(cfg.value ?? 0);
            const current = Number(context.score ?? 0);
            const next = mode === 'set' ? value : mode === 'decrease' ? current - value : current + value;
            context.score = Math.max(0, Math.min(100, Math.round(next)));
            context.lead_score = context.score;
            return { output: { score: context.score }, message: `Lead score ${mode}d to ${context.score}` };
          }
          if (node.key === 'set_lead_intent') {
            context.intent = String(cfg.value ?? 'high');
            return { output: { intent: context.intent }, message: `Intent set to ${context.intent}` };
          }
          if (node.key === 'set_lead_qualification') {
            context.qualification = String(cfg.value ?? 'qualified');
            return { output: { qualification: context.qualification }, message: `Qualification set to ${context.qualification}` };
          }
          if (node.key === 'notify_sales') {
            const result = { channel: String(cfg.channel ?? '#sales'), status: 'sent' };
            const outKey = String(cfg.outputKey ?? 'sales_notified');
            context[outKey] = result;
            return { output: result, message: 'Sales team notified' };
          }
          const result = this.simulateAction(node, cfg);
          const outKey = String(cfg.outputKey ?? 'action_result');
          context[outKey] = result.output;
          return result;
        });
      }

      default:
        return during(async () => ({ output: {}, message: `${this.labelFor(node)} completed` }));
    }
  }

  private simulateAction(node: WorkflowNode, cfg: Record<string, unknown>): { output: Data; message: string } {
    const map: Record<string, [string, Data]> = {
      send_email: ['Email sent to ' + String(cfg.to ?? 'recipient'), { to: cfg.to, status: 'delivered', messageId: 'fp-mail-' + Math.random().toString(36).slice(2, 10) }],
      send_notification: ['Notification sent to ' + String(cfg.channel ?? '#general'), { channel: cfg.channel, status: 'sent' }],
      create_crm_record: ['CRM record created', { object: cfg.object, id: 'crm-' + Math.random().toString(36).slice(2, 10), status: 'created' }],
      update_crm: ['CRM record updated', { id: cfg.recordId, status: 'updated' }],
      create_task: ['Task created', { title: cfg.title, status: 'open' }],
      send_webhook: ['Webhook delivered', { url: cfg.url, status: '2xx' }],
      add_to_sheet: ['Row appended to Google Sheet', { status: 'appended', rows: 1 }],
      _default: ['Action completed', { status: 'ok' }],
    };
    const hit = map[node.key] ?? map._default;
    return { output: hit[1], message: hit[0] };
  }
}