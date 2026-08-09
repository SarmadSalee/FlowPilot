export const constants = {
  organizationRoles: ['owner', 'admin', 'member', 'viewer'] as const,
  planTiers: ['free', 'pro', 'business'] as const,
  planLimits: {
    free: { workflows: 5, executionsPerMonth: 100, aiEnabled: false, teamSize: 1, maxAgents: 1 },
    pro: { workflows: Number.MAX_SAFE_INTEGER, executionsPerMonth: 10000, aiEnabled: true, teamSize: 10, maxAgents: 10 },
    business: { workflows: Number.MAX_SAFE_INTEGER, executionsPerMonth: 100000, aiEnabled: true, teamSize: Number.MAX_SAFE_INTEGER, maxAgents: 100 },
  },
  executionStatuses: ['success', 'failed', 'running', 'waiting'] as const,
  nodeTypes: {
    TRIGGER: ['new_lead', 'new_email', 'form_submitted', 'schedule', 'webhook', 'new_customer', 'new_order'],
    AI: ['ai_analyze', 'ai_classify', 'ai_extract', 'ai_summarize', 'ai_generate', 'ai_agent'],
    ACTION: ['send_email', 'send_notification', 'create_crm_record', 'update_crm', 'create_task', 'send_webhook', 'add_to_sheet'],
    CONDITION: ['if_else', 'lead_score', 'customer_type', 'email_contains', 'field_exists'],
    UTILITY: ['delay', 'formatter', 'filter', 'merge'],
  } as const,
  integrationCategories: ['Communication', 'CRM', 'Marketing', 'Payments', 'Productivity', 'AI', 'Database'] as const,
  aiModels: ['gpt-4o-mini', 'gpt-4o', 'claude-3-5-haiku', 'claude-3-5-sonnet', 'deepseek-chat', 'deepseek-reasoner'] as const,
} as const;

export type OrganizationRole = (typeof constants.organizationRoles)[number];
export type PlanTier = (typeof constants.planTiers)[number];
export type ExecutionStatus = (typeof constants.executionStatuses)[number];
export type NodeType = typeof constants.nodeTypes;