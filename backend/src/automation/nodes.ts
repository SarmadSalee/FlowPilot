import type { NodeDefinition } from '../ai/types';

export const NODE_DEFINITIONS: NodeDefinition[] = [
  // TRIGGERS
  {
    id: 'new_lead', key: 'new_lead', label: 'New Lead', type: 'trigger',
    category: 'Triggers', description: 'Triggers when a new lead is captured.',
    icon: 'user-plus',
    configFields: []
  },
  {
    id: 'new_email', key: 'new_email', label: 'New Email', type: 'trigger',
    category: 'Triggers', description: 'Triggers when a new email arrives.',
    icon: 'mail',
    configFields: [
      { key: 'folder', label: 'Folder', type: 'select', options: [{ label: 'Inbox', value: 'inbox' }, { label: 'Labeled', value: 'label' }], defaultValue: 'inbox' }
    ]
  },
  {
    id: 'form_submitted', key: 'form_submitted', label: 'Form Submitted', type: 'trigger',
    category: 'Triggers', description: 'Triggers when a web form is submitted.',
    icon: 'clipboard-check',
    configFields: [
      { key: 'formId', label: 'Form ID', type: 'text', placeholder: 'contact-form', required: true }
    ]
  },
  {
    id: 'schedule', key: 'schedule', label: 'Schedule', type: 'trigger',
    category: 'Triggers', description: 'Triggers on a recurring schedule.',
    icon: 'calendar-clock',
    configFields: [
      { key: 'cron', label: 'Cron expression', type: 'text', placeholder: '0 9 * * 1-5', defaultValue: '0 9 * * 1-5', required: true }
    ]
  },
  {
    id: 'webhook', key: 'webhook', label: 'Webhook', type: 'trigger',
    category: 'Triggers', description: 'Triggers via an inbound webhook.',
    icon: 'webhook',
    configFields: [
      { key: 'secret', label: 'Secret', type: 'password', placeholder: 'webhook-secret' }
    ]
  },
  {
    id: 'new_customer', key: 'new_customer', label: 'New Customer', type: 'trigger',
    category: 'Triggers', description: 'Triggers when a new customer is created.',
    icon: 'building',
    configFields: [
      { key: 'source', label: 'Source', type: 'select', options: [{ label: 'Stripe', value: 'stripe' }, { label: 'CRM', value: 'crm' }], defaultValue: 'stripe' }
    ]
  },
  {
    id: 'new_order', key: 'new_order', label: 'New Order', type: 'trigger',
    category: 'Triggers', description: 'Triggers when a new order is placed.',
    icon: 'shopping-bag',
    configFields: []
  },

  // AI ACTIONS
  {
    id: 'ai_analyze', key: 'ai_analyze', label: 'AI Analyze', type: 'ai',
    category: 'AI', description: 'Analyzes input with AI and returns structured insights.',
    icon: 'sparkles',
    configFields: [
      { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Analyze the sales opportunity...', required: true },
      { key: 'model', label: 'Model', type: 'select', options: [
        { label: 'Auto', value: 'auto' }, { label: 'gpt-4o', value: 'gpt-4o' }, { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
        { label: 'claude-3-5-sonnet', value: 'claude-3-5-sonnet' }, { label: 'deepseek-chat', value: 'deepseek-chat' }
      ], defaultValue: 'auto' }
    ]
  },
  {
    id: 'ai_classify', key: 'ai_classify', label: 'AI Classify', type: 'ai',
    category: 'AI', description: 'Classifies incoming data into categories.',
    icon: 'tags',
    configFields: [
      { key: 'categories', label: 'Categories (comma separated)', type: 'text', placeholder: 'Sales, Support, Billing', required: true },
      { key: 'field', label: 'Input field', type: 'text', placeholder: 'body', defaultValue: 'body' }
    ]
  },
  {
    id: 'ai_extract', key: 'ai_extract', label: 'AI Extract Data', type: 'ai',
    category: 'AI', description: 'Extracts structured fields from unstructured text.',
    icon: 'scan-search',
    configFields: [
      { key: 'fields', label: 'Fields to extract', type: 'text', placeholder: 'name, email, company, budget', required: true }
    ]
  },
  {
    id: 'ai_summarize', key: 'ai_summarize', label: 'AI Summarize', type: 'ai',
    category: 'AI', description: 'Produces concise summaries of longer content.',
    icon: 'align-left',
    configFields: [
      { key: 'length', label: 'Length', type: 'select', options: [{ label: 'Short', value: 'short' }, { label: 'Medium', value: 'medium' }, { label: 'Detailed', value: 'detailed' }], defaultValue: 'medium' }
    ]
  },
  {
    id: 'ai_generate', key: 'ai_generate', label: 'AI Generate Text', type: 'ai',
    category: 'AI', description: 'Generates text such as emails, posts, or replies.',
    icon: 'pen-line',
    configFields: [
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Write a short, friendly follow-up email...', required: true },
      { key: 'tone', label: 'Tone', type: 'select', options: [{ label: 'Professional', value: 'professional' }, { label: 'Friendly', value: 'friendly' }, { label: 'Persuasive', value: 'persuasive' }], defaultValue: 'professional' }
    ]
  },
  {
    id: 'ai_agent', key: 'ai_agent', label: 'AI Agent', type: 'ai',
    category: 'AI', description: 'Delegates work to a configured AI agent.',
    icon: 'bot',
    configFields: [
      { key: 'agentId', label: 'Agent', type: 'select', options: [], required: true }
    ]
  },

  // ACTIONS
  {
    id: 'send_email', key: 'send_email', label: 'Send Email', type: 'action',
    category: 'Actions', description: 'Sends an email message.',
    icon: 'mail',
    configFields: [
      { key: 'to', label: 'To', type: 'text', placeholder: '{{email}}', required: true },
      { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Subject', required: true },
      { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Email body', required: true }
    ]
  },
  {
    id: 'send_notification', key: 'send_notification', label: 'Send Notification', type: 'action',
    category: 'Actions', description: 'Sends a Slack / push notification.',
    icon: 'bell-ring',
    configFields: [
      { key: 'channel', label: 'Channel', type: 'text', placeholder: '#sales', defaultValue: '#general' },
      { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Message to send', required: true }
    ]
  },
  {
    id: 'create_crm_record', key: 'create_crm_record', label: 'Create CRM Record', type: 'action',
    category: 'Actions', description: 'Creates a record in your CRM.',
    icon: 'database',
    configFields: [
      { key: 'object', label: 'Object', type: 'text', placeholder: 'Contact', defaultValue: 'Contact' },
      { key: 'fields', label: 'Fields (JSON)', type: 'json', placeholder: '{"firstname":"{{first_name}}"}', defaultValue: {} }
    ]
  },
  {
    id: 'update_crm', key: 'update_crm', label: 'Update CRM Record', type: 'action',
    category: 'Actions', description: 'Updates an existing CRM record.',
    icon: 'database',
    configFields: [
      { key: 'recordId', label: 'Record ID', type: 'text', placeholder: '{{crm_id}}', required: true },
      { key: 'fields', label: 'Fields (JSON)', type: 'json', placeholder: '{}', defaultValue: {} }
    ]
  },
  {
    id: 'create_task', key: 'create_task', label: 'Create Task', type: 'action',
    category: 'Actions', description: 'Creates a task for a team member.',
    icon: 'check-square',
    configFields: [
      { key: 'assignee', label: 'Assignee', type: 'text', placeholder: '{{owner}}' },
      { key: 'title', label: 'Task title', type: 'text', placeholder: 'Follow up with {{first_name}}', required: true },
      { key: 'dueIn', label: 'Due in (days)', type: 'number', defaultValue: 2 }
    ]
  },
  {
    id: 'send_webhook', key: 'send_webhook', label: 'Send Webhook', type: 'action',
    category: 'Actions', description: 'Sends an outbound HTTP webhook.',
    icon: 'webhook',
    configFields: [
      { key: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com/hook', required: true },
      { key: 'method', label: 'Method', type: 'select', options: [{ label: 'POST', value: 'POST' }, { label: 'GET', value: 'GET' }], defaultValue: 'POST' }
    ]
  },
  {
    id: 'add_to_sheet', key: 'add_to_sheet', label: 'Add to Google Sheet', type: 'action',
    category: 'Actions', description: 'Appends a row to a Google Sheet.',
    icon: 'sheet',
    configFields: [
      { key: 'sheetId', label: 'Sheet ID', type: 'text' },
      { key: 'row', label: 'Row values (comma separated)', type: 'text', placeholder: '{{first_name}},{{email}}', required: true }
    ]
  },

  // CONDITIONS
  {
    id: 'if_else', key: 'if_else', label: 'If / Else', type: 'condition',
    category: 'Conditions', description: 'Branches depending on a boolean value.',
    icon: 'git-branch',
    configFields: [
      { key: 'field', label: 'Field', type: 'text', placeholder: 'qualified', required: true },
      { key: 'isTrue', label: 'Evaluate as true when', type: 'select', options: [{ label: 'true / truthy', value: 'truthy' }, { label: 'false / falsy', value: 'falsy' }], defaultValue: 'truthy' }
    ]
  },
  {
    id: 'lead_score', key: 'lead_score', label: 'Lead Score', type: 'condition',
    category: 'Conditions', description: 'Checks whether a lead score is above a threshold.',
    icon: 'gauge',
    configFields: [
      { key: 'field', label: 'Score field', type: 'text', placeholder: 'score', defaultValue: 'lead_score' },
      { key: 'operator', label: 'Operator', type: 'select', options: [{ label: '>=', value: '>=' }, { label: '>', value: '>' }, { label: '<', value: '<' }, { label: '<=', value: '<=' }], defaultValue: '>=' },
      { key: 'threshold', label: 'Threshold', type: 'number', defaultValue: 70 }
    ]
  },
  {
    id: 'customer_type', key: 'customer_type', label: 'Customer Type', type: 'condition',
    category: 'Conditions', description: 'Routes based on customer type.',
    icon: 'users',
    configFields: [
      { key: 'field', label: 'Type field', type: 'text', placeholder: 'type', defaultValue: 'type' },
      { key: 'values', label: 'Matching values (comma separated)', type: 'text', placeholder: 'enterprise, smb', required: true }
    ]
  },
  {
    id: 'email_contains', key: 'email_contains', label: 'Email Contains', type: 'condition',
    category: 'Conditions', description: 'Routes when an email contains keywords.',
    icon: 'filter',
    configFields: [
      { key: 'field', label: 'Email field', type: 'text', placeholder: 'body', defaultValue: 'body' },
      { key: 'keywords', label: 'Keywords (comma separated)', type: 'text', placeholder: 'refund, complaint', required: true }
    ]
  },
  {
    id: 'field_exists', key: 'field_exists', label: 'Field Exists', type: 'condition',
    category: 'Conditions', description: 'Routes when a field exists and is non-empty.',
    icon: 'circle-check',
    configFields: [
      { key: 'field', label: 'Field', type: 'text', placeholder: 'company_size', required: true }
    ]
  },

  // UTILITIES
  {
    id: 'delay', key: 'delay', label: 'Delay', type: 'utility',
    category: 'Utilities', description: 'Pauses the workflow for a set duration.',
    icon: 'timer',
    configFields: [
      { key: 'seconds', label: 'Seconds', type: 'number', defaultValue: 60, required: true }
    ]
  },
  {
    id: 'formatter', key: 'formatter', label: 'Formatter', type: 'utility',
    category: 'Utilities', description: 'Formats dates, numbers and strings.',
    icon: 'wand-2',
    configFields: [
      { key: 'template', label: 'Template', type: 'textarea', placeholder: '{{first_name}} {{last_name}}', required: true }
    ]
  },
  {
    id: 'filter', key: 'filter', label: 'Filter', type: 'utility',
    category: 'Utilities', description: 'Drops payloads that do not match a condition.',
    icon: 'filter',
    configFields: [
      { key: 'field', label: 'Field', type: 'text', placeholder: 'email', required: true },
      { key: 'op', label: 'Op', type: 'select', options: [{ label: 'is not empty', value: 'not_empty' }, { label: 'equals', value: 'equals' }], defaultValue: 'not_empty' },
      { key: 'value', label: 'Value', type: 'text' }
    ]
  },
  {
    id: 'merge', key: 'merge', label: 'Merge', type: 'utility',
    category: 'Utilities', description: 'Merges multiple branches into one.',
    icon: 'git-merge',
    configFields: []
  },
];