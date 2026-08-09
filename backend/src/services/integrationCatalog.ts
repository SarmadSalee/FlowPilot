import { Integration } from '../models/Integration';
import { constants } from '../config/constants';

export interface IntegrationDefinition {
  key: string;
  name: string;
  category: (typeof constants.integrationCategories)[number];
  description: string;
  icon: string;
  isMock: boolean;
  configSchema: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'select';
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
  }>;
  meta?: Record<string, unknown>;
}

export const INTEGRATION_CATALOG: IntegrationDefinition[] = [
  {
    key: 'gmail',
    name: 'Gmail',
    category: 'Communication',
    description: 'Send and receive emails, watch inboxes, and trigger workflows from new mail.',
    icon: 'mail',
    isMock: true,
    configSchema: [{ key: 'email', label: 'Gmail address', type: 'text', required: true }],
  },
  {
    key: 'slack',
    name: 'Slack',
    category: 'Communication',
    description: 'Post notifications and messages to channels. Trigger workflows from Slack activity.',
    icon: 'slack',
    isMock: true,
    configSchema: [
      { key: 'workspace', label: 'Workspace', type: 'text', required: true },
      { key: 'token', label: 'Bot token', type: 'password' },
    ],
    meta: { channels: ['#general', '#sales', '#support', '#marketing'] },
  },
  {
    key: 'google_sheets',
    name: 'Google Sheets',
    category: 'Productivity',
    description: 'Read, append, and update rows in Google Sheets spreadsheets.',
    icon: 'sheet',
    isMock: true,
    configSchema: [{ key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text' }],
  },
  {
    key: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    description: 'Create and update contacts, deals and companies in HubSpot CRM.',
    icon: 'hubspot',
    isMock: true,
    configSchema: [{ key: 'portalId', label: 'Portal ID', type: 'text' }],
    meta: { objects: ['Contact', 'Company', 'Deal'] },
  },
  {
    key: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    description: 'Sync leads, contacts and opportunities with Salesforce.',
    icon: 'cloud',
    isMock: true,
    configSchema: [{ key: 'instance', label: 'Instance URL', type: 'text' }],
    meta: { objects: ['Lead', 'Contact', 'Opportunity'] },
  },
  {
    key: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    description: 'Trigger on new customers, payments, and subscription events.',
    icon: 'credit-card',
    isMock: true,
    configSchema: [{ key: 'apiKey', label: 'Secret key', type: 'password' }],
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    category: 'Communication',
    description: 'Send and receive WhatsApp messages via the Business API.',
    icon: 'message-circle',
    isMock: true,
    configSchema: [{ key: 'phone', label: 'Business phone', type: 'text' }],
  },
  {
    key: 'webhook',
    name: 'Webhook',
    category: 'Productivity',
    description: 'Send and receive raw HTTP webhooks to any service.',
    icon: 'webhook',
    isMock: true,
    configSchema: [{ key: 'url', label: 'Default URL', type: 'text' }],
  },
  {
    key: 'openai',
    name: 'OpenAI',
    category: 'AI',
    description: 'Powerful LLM models for analysis, generation and classification.',
    icon: 'sparkles',
    isMock: true,
    configSchema: [{ key: 'apiKey', label: 'API key', type: 'password', required: true }],
    meta: { models: ['gpt-4o', 'gpt-4o-mini'] },
  },
  {
    key: 'anthropic',
    name: 'Anthropic',
    category: 'AI',
    description: 'Claude models for safe, high-quality AI generations.',
    icon: 'bot',
    isMock: true,
    configSchema: [{ key: 'apiKey', label: 'API key', type: 'password', required: true }],
    meta: { models: ['claude-3-5-sonnet', 'claude-3-5-haiku'] },
  },
  {
    key: 'deepseek',
    name: 'DeepSeek',
    category: 'AI',
    description: 'Cost-efficient open models for high-volume automation.',
    icon: 'atom',
    isMock: true,
    configSchema: [{ key: 'apiKey', label: 'API key', type: 'password', required: true }],
    meta: { models: ['deepseek-chat', 'deepseek-reasoner'] },
  },
  {
    key: 'notion',
    name: 'Notion',
    category: 'Productivity',
    description: 'Create database entries, pages and update Notion content.',
    icon: 'file-text',
    isMock: true,
    configSchema: [{ key: 'token', label: 'Integration token', type: 'password' }],
  },
];

/** Compare catalog to DB and insert missing integrations (idempotent). */
export async function getIntegrationsSeed(): Promise<void> {
  const existing = await Integration.find().lean();
  const existingKeys = new Set(existing.map((i) => i.key));
  const missing = INTEGRATION_CATALOG.filter((def) => !existingKeys.has(def.key));
  if (missing.length > 0) {
    await Integration.insertMany(
      missing.map((def) => ({
        key: def.key,
        name: def.name,
        category: def.category,
        description: def.description,
        enabled: true,
        isMock: def.isMock,
        configSchema: def.configSchema,
        meta: def.meta ?? {},
      }))
    );
  }
}

export function getCatalog(): IntegrationDefinition[] {
  return INTEGRATION_CATALOG;
}