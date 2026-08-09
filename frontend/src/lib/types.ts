export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  avatarColor?: string;
  avatar?: string;
}

export interface Org {
  _id: string;
  name: string;
  slug: string;
  plan: string;
  billingEmail?: string;
}

export interface AuthData {
  token: string;
  user: User;
  org: Org;
}

export interface NodeConfigField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "boolean" | "password" | "json";
  placeholder?: string;
  help?: string;
  options?: { label: string; value: string }[];
  defaultValue?: unknown;
  required?: boolean;
}

export interface NodeDef {
  key: string;
  type: string;
  label: string;
  category: "Triggers" | "AI" | "Logic" | "Actions" | "Utilities";
  description: string;
  icon: string;
  configFields: NodeConfigField[];
}

export interface WorkflowNode {
  id: string;
  type: string;
  key: string;
  label: string;
  position: { x: number; y: number };
  enabled?: boolean;
  config?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
  label?: string;
}

export type WorkflowStatus = "draft" | "active" | "paused" | "archived";

export interface Workflow {
  _id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  lastRunAt?: string;
  runCount: number;
  successCount: number;
  failCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionStep {
  nodeId?: string;
  nodeKey?: string;
  label: string;
  status: "success" | "failed" | "running" | "waiting";
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  message?: string;
  error?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface Execution {
  _id: string;
  workflowId: string;
  name?: string;
  workflowName?: string;
  status: string;
  trigger?: string;
  triggerType?: string;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  steps: ExecutionStep[];
  error?: string;
  isTestRun?: boolean;
  createdAt: string;
}

export interface Agent {
  _id: string;
  name: string;
  description?: string;
  instructions: string;
  model: string;
  temperature: number;
  tools: { name: string; enabled: boolean }[];
  status: "active" | "inactive" | "error";
  executions: number;
  successCount: number;
  tokenUsage: number;
  avgResponseMs: number;
  createdAt: string;
}

export interface TemplateNode {
  id: string;
  type: "trigger" | "ai" | "action" | "condition" | "utility";
  key: string;
  label: string;
  position: { x: number; y: number };
  config?: Record<string, unknown>;
}

export interface Template {
  slug: string;
  _id: string;
  name: string;
  category: string;
  description?: string;
  icon: string;
  featured?: boolean;
  steps?: string[];
  nodes: TemplateNode[];
  edges: WorkflowEdge[];
  tags?: string[];
}

export interface Integration {
  key: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
  isMock: boolean;
  configSchema: Array<{
    key: string;
    label: string;
    type: "text" | "password" | "select";
    required?: boolean;
    options?: { label: string; value: string }[];
  }>;
  meta?: Record<string, unknown>;
  connected: boolean;
  connectedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiKey {
  _id: string;
  name: string;
  prefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalExecutions: number;
  successful: number;
  failed: number;
  tasksCompleted: number;
  aiTasks: number;
  stepsProcessed: number;
  tokenUsage: number;
  avgDurationMs: number;
  timeSavedHours: number;
  successRate: number;
  totalWorkflows: number;
  activeWorkflows: number;
}

export interface RecentRun {
  _id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  startedAt: string;
  durationMs: number;
  steps: number;
  isTestRun?: boolean;
}

export interface DaySeries {
  date: string;
  executions: number;
  success: number;
  failed: number;
  aiTasks: number;
  durationMs: number;
}

export interface WorkflowUsage {
  workflowId: string;
  name: string;
  total: number;
  successful: number;
  failed: number;
  avgDurationMs: number;
}

export interface Credits {
  plan: string;
  planLimit: number;
  used: number;
  remaining: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  recent: RecentRun[];
  timeSeries: DaySeries[];
  usedWorkflows: WorkflowUsage[];
  last24hExecutions: number;
  credits: Credits;
}

export interface API<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}