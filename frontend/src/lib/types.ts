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

/* ---------- Lead intelligence ---------- */

export type LeadIntent = "low" | "medium" | "high";
export type LeadQualification = "hot" | "warm" | "cold" | "qualified" | "unqualified";
export type LeadStage = "awareness" | "interest" | "consideration" | "evaluation" | "decision" | "customer";
export type LeadStatus = "new" | "contacted" | "qualified" | "unqualified" | "converted" | "lost" | "spam";

export interface Lead {
  _id: string;
  name: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  website?: string;
  revenue?: number;
  source?: string;
  leadType?: string;
  phone?: string;
  whatsapp?: string;
  score: number;
  icpScore: number;
  engagementScore: number;
  intentScore: number;
  grade: "A" | "B" | "C" | "D";
  intent: LeadIntent;
  qualification: LeadQualification;
  buyingStage: LeadStage;
  confidence: number;
  status: LeadStatus;
  tags: string[];
  customData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  unsubscribed?: boolean;
  firstSeenAt?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreFactor {
  label: string;
  delta: number;
  kind: "positive" | "negative" | "neutral";
  source?: string;
}

export interface LeadScore {
  _id: string;
  leadId: string;
  score: number;
  grade: "A" | "B" | "C" | "D";
  intent: LeadIntent;
  qualification: LeadQualification;
  buyingStage: LeadStage;
  confidence: number;
  icpMatch: number;
  engagement: number;
  buyingIntent: number;
  factors: ScoreFactor[];
  summary?: string;
  explanation?: string;
  recommendedAction?: {
    title: string;
    steps: string[];
    urgency: string;
  };
  provider: string;
  model: string;
  analyzedAt: string;
  createdAt: string;
}

export interface LeadAnalysis {
  _id: string;
  leadId: string;
  score: number;
  intent: LeadIntent;
  qualification: LeadQualification;
  buyingStage: LeadStage;
  confidence: number;
  reasons: string[];
  summary?: string;
  recommendedAction?: string;
  recommendedSteps: string[];
  source: string;
  provider: string;
  model: string;
  createdAt: string;
}

export interface LeadEvent {
  _id: string;
  leadId: string;
  type: string;
  channel?: string;
  payload?: Record<string, unknown>;
  scoreDelta?: number;
  detectedIntent?: string;
  processed?: boolean;
  processedAt?: string;
  createdAt: string;
}

export interface LeadScoreHistoryEntry {
  _id: string;
  leadId: string;
  score: number;
  previousScore: number;
  delta: number;
  reason?: string;
  source: string;
  eventType?: string;
  createdAt: string;
}

export interface LeadTimelineItem {
  kind: "score" | "event";
  id: string;
  at: string;
  score?: number;
  previousScore?: number;
  delta?: number;
  reason: string;
  source?: string;
  eventType?: string;
  type?: string;
  channel?: string;
  scoreDelta?: number;
  detectedIntent?: string;
}

export interface LeadListResult {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}

export interface LeadDetail {
  lead: Lead;
  score?: LeadScore | null;
  analyses: LeadAnalysis[];
  history: LeadScoreHistoryEntry[];
  events: LeadEvent[];
}

export interface RuleCondition {
  field: string;
  operator: "gte" | "gt" | "lte" | "lt" | "eq" | "contains" | "exists" | "truthy" | "in";
  value?: unknown;
}

export interface RuleAction {
  type:
    | "increase"
    | "decrease"
    | "set"
    | "set_intent"
    | "set_qualification"
    | "set_stage"
    | "notify"
    | "add_tag"
    | "remove_tag"
    | "trigger_workflow"
    | "stop"
    | "unsubscribe";
  value?: unknown;
  target?: string;
  metadata?: Record<string, unknown>;
}

export interface ScoringRule {
  _id: string;
  name: string;
  description?: string;
  trigger: "lead_created" | "lead_event" | "score_threshold" | "ai_analysis";
  eventType?: string;
  conditions: RuleCondition[];
  action: RuleAction;
  priority: number;
  enabled: boolean;
  source: "builtin" | "user" | "ai";
  createdAt: string;
  updatedAt: string;
}

export interface ICPProfile {
  _id: string;
  name: string;
  industries: string[];
  companySizeMin?: number;
  companySizeMax?: number;
  locations: string[];
  jobTitles: string[];
  minRevenue?: number;
  minEmployees?: number;
  technologies: string[];
  keywords: string[];
  customCriteria?: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
}

export interface LeadAnalytics {
  summary: {
    totalLeads: number;
    avgScore: number;
    avgIcpScore: number;
    hot: number;
    warm: number;
    cold: number;
    qualified: number;
    unqualified: number;
    highIntent: number;
    converted: number;
    scoreChanges24h: number;
    newLeads7d: number;
    positiveChanges7d: number;
  };
  distribution: { label: string; min: number; max: number; count: number }[];
  conversion: { label: string; min: number; max: number; total: number; converted: number; conversionRate: number }[];
  topSources: { source: string; count: number; avgScore: number }[];
  trending: {
    hottest: { leadId: string; name: string; company?: string; score: number; movement: number; changes: number }[];
    coldest: { leadId: string; name: string; company?: string; score: number; movement: number; changes: number }[];
  };
  trend: { date: string; newLeads: number; avgScore: number; scoreChanges: number }[];
}

export interface LeadStreamEvent {
  type: string;
  leadId?: string;
  leadName?: string;
  eventId?: string;
  score?: number;
  previousScore?: number;
  delta?: number;
  reason?: string;
  eventType?: string;
  at: string;
  lead?: Lead;
}

export interface LeadOutcome {
  leadId: string;
  score: number;
  previousScore: number;
  delta: number;
  intent?: LeadIntent;
  qualification?: LeadQualification;
  stage?: LeadStage;
  reasons: string[];
  matchedRules: string[];
  workflowsTriggered: string[];
  notificationsSent: string[];
}