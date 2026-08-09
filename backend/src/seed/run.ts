import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Workflow } from '../models/Workflow';
import { Execution } from '../models/WorkflowExecution';
import { Agent } from '../models/AIAgent';
import { Template } from '../models/Template';
import { NotificationModel } from '../models/Notification';
import { ActivityLogModel } from '../models/ActivityLog';
import { getIntegrationsSeed } from '../services/integrationCatalog';

interface GraphNode {
  id: string;
  type: 'trigger' | 'ai' | 'action' | 'condition' | 'utility';
  key: string;
  label: string;
  position: { x: number; y: number };
  config?: Record<string, unknown>;
}

interface GraphEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  label?: string;
}

let n = 0;
function node(
  type: GraphNode['type'],
  key: string,
  label: string,
  x: number,
  y: number,
  config: Record<string, unknown> = {}
): GraphNode {
  n += 1;
  return { id: `n${n}`, type, key, label, position: { x, y }, config };
}

let edgeN = 0;
function edge(
  source: string,
  target: string,
  sourceHandle?: string,
  targetHandle?: string,
  label?: string
): GraphEdge {
  edgeN += 1;
  return { id: `e${edgeN}`, source, target, sourceHandle, targetHandle, label };
}

interface FlowDef {
  name: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  hasCondition?: boolean;
}

function buildFlows(): FlowDef[] {
  n = 0;
  edgeN = 0;
  // 1. AI Lead Qualification & Follow-up
  const qual = [
    node('trigger', 'new_lead', 'New Lead', 0, 220),
    node('ai', 'ai_analyze', 'AI Analyze Lead', 240, 220, {
      prompt: 'Analyze this lead and score it from 1-100 based on intent, budget and fit.',
      outputKey: 'ai_result',
      parseJson: true,
    }),
    node('condition', 'lead_score', 'Lead Score >= 70', 480, 220, {
      field: 'ai_result.lead_score',
      operator: 'gte',
      threshold: 70,
      outputKey: 'qualified',
    }),
    node('action', 'create_crm_record', 'Create CRM Record', 700, 60, { object: 'Contact' }),
    node('ai', 'ai_generate', 'Generate Email', 900, 180, {
      prompt: 'Write a short personalized follow-up email for {name} at {company}.',
      outputKey: 'email_draft',
      parseJson: false,
    }),
    node('action', 'send_email', 'Send Email', 1100, 300, {
      to: '{email}',
      subject: 'Quick question',
      body: '{email_draft}',
    }),
    node('action', 'create_task', 'Create Follow-up', 1250, 180, {
      title: 'Follow up with {name}',
      dueIn: 2,
    }),
    node('action', 'send_notification', 'Add to Nurture', 700, 620, {
      channel: '#marketing',
      message: 'Add {name} ({company}) to nurture list',
    }),
  ];
  const qualEdges = [
    edge('n1', 'n2'),
    edge('n2', 'n3'),
    edge('n3', 'n4', 'true', 'true', 'YES'),
    edge('n4', 'n5'),
    edge('n5', 'n6'),
    edge('n6', 'n7'),
    edge('n3', 'n8', 'false', 'false', 'NO'),
  ];

  // 2. Customer Support Assistant
  const support = [
    node('trigger', 'new_email', 'New Customer Email', 0, 220),
    node('ai', 'ai_classify', 'AI Classify Request', 260, 220, {
      categories: 'Support, Billing, Sales, Feedback',
      field: 'body',
      outputKey: 'category',
      parseJson: false,
    }),
    node('ai', 'ai_generate', 'Generate Response', 520, 220, {
      instructions: 'Write a helpful friendly reply for a {category} request from {name}.',
      outputKey: 'reply',
      parseJson: false,
    }),
    node('action', 'create_crm_record', 'Create Support Ticket', 780, 80, { object: 'Ticket' }),
    node('action', 'send_notification', 'Notify Team', 780, 260, { channel: '#support', message: 'New {category} request from {name}' }),
    node('action', 'send_email', 'Send Reply', 1040, 220, { to: '{email}', subject: 'Re: Your request', body: '{reply}' }),
  ];
  const supportEdges = [
    edge('n1', 'n2'),
    edge('n2', 'n3'),
    edge('n3', 'n4'),
    edge('n4', 'n5'),
    edge('n5', 'n6'),
  ];

  // 3. Sales Follow-up Emails
  const sales = [
    node('trigger', 'form_submitted', 'Form Submitted', 0, 220, { formId: 'contact-form' }),
    node('ai', 'ai_extract', 'AI Extract Form Data', 260, 220, {
      fields: 'name, email, company, interest',
      outputKey: 'form_data',
      parseJson: true,
    }),
    node('utility', 'delay', 'Wait 24 hours', 520, 220, { seconds: 86400 }),
    node('ai', 'ai_generate', 'Generate Email', 780, 220, {
      instructions: 'Write a warm follow-up for {name} who showed interest in {interest}.',
      outputKey: 'draft',
      parseJson: false,
    }),
    node('action', 'send_email', 'Send Email', 1040, 220, { to: '{email}', subject: 'Following up', body: '{draft}' }),
    node('action', 'create_task', 'Create Sales Task', 1300, 220, { title: 'Call {name} about {company}', dueIn: 1 }),
  ];
  const salesEdges = [
    edge('n1', 'n2'),
    edge('n2', 'n3'),
    edge('n3', 'n4'),
    edge('n4', 'n5'),
    edge('n5', 'n6'),
  ];

  // 4. Invoice Processing
  const invoice = [
    node('trigger', 'new_email', 'Invoice Email', 0, 220),
    node('ai', 'ai_extract', 'AI Extract Invoice', 260, 220, {
      fields: 'invoice_no, vendor, amount, due_date',
      outputKey: 'invoice',
      parseJson: true,
    }),
    node('condition', 'if_else', 'Invoice Has Vendor?', 520, 220, {
      field: 'invoice.vendor',
      isTrue: true,
      outputKey: 'valid_invoice',
    }),
    node('action', 'add_to_sheet', 'Save to Ledger', 780, 100, {
      row: '{invoice.invoice_no},{invoice.vendor},{invoice.amount}',
    }),
    node('action', 'send_notification', 'Notify Finance', 780, 260, { channel: '#finance', message: 'Invoice {invoice.invoice_no} for {invoice.amount} received' }),
    node('action', 'send_notification', 'Flag Review', 780, 420, { channel: '#finance', message: 'Invoice needs manual review' }),
  ];
  const invoiceEdges = [
    edge('n1', 'n2'),
    edge('n2', 'n3'),
    edge('n3', 'n4', 'true', 'true', 'YES'),
    edge('n4', 'n5'),
    edge('n3', 'n6', 'false', 'false', 'NO'),
  ];

  // 5. Meeting Summary
  const meeting = [
    node('trigger', 'webhook', 'Meeting Transcript', 0, 220),
    node('ai', 'ai_summarize', 'AI Summarize', 260, 220, { length: 'medium', outputKey: 'summary', parseJson: false }),
    node('ai', 'ai_extract', 'Extract Action Items', 520, 220, { fields: 'owner, task, due', outputKey: 'actions', parseJson: true }),
    node('action', 'send_notification', 'Send to Slack', 780, 220, { channel: '#meetings', message: '{summary}' }),
    node('action', 'add_to_sheet', 'Log to Tracker', 1040, 220, { row: 'Meeting summary' }),
  ];
  const meetingEdges = [
    edge('n1', 'n2'),
    edge('n2', 'n3'),
    edge('n3', 'n4'),
    edge('n4', 'n5'),
  ];

  return [
    { name: 'AI Lead Qualification & Follow-up', description: 'Analyzes every new lead with AI, scores it 1-100 and routes qualified leads to CRM, email generation and follow-up tasks. Unqualified leads go to the nurture list.', nodes: qual, edges: qualEdges, },
    { name: 'Customer Support Assistant', description: 'Reads every new customer email, classifies the request with AI, drafts a response, creates a support ticket and notifies the team.', nodes: support, edges: supportEdges },
    { name: 'Sales Follow-up Emails', description: 'Handles every website form submission, waits a day, then writes and sends a personalized follow-up email and creates a sales task.', nodes: sales, edges: salesEdges },
    { name: 'Invoice Processing', description: 'Detects invoice emails, extracts structured data with AI, validates, and saves valid invoices to the ledger; flags others for review.', nodes: invoice, edges: invoiceEdges },
    { name: 'Meeting Summary', description: 'Turns meeting transcripts into concise summaries, extracts action items and shares them to Slack and a tracking sheet.', nodes: meeting, edges: meetingEdges },
  ];
}

export async function seedDemoData(): Promise<void> {
  const demoEmail = env.demoEmail;
  const demoPassword = env.demoPassword;

  // --- Org + user ---------------------------------------------------------
  let user = await User.findOne({ email: demoEmail }).lean();
  if (!user) {
    const password = await bcrypt.hash(demoPassword, 12);
    user = (await User.create({
      name: 'Sarmad',
      email: demoEmail,
      password,
      company: 'FlowPilot',
      avatarColor: 'indigo',
    })).toObject();
    console.log(`[seed] created demo user ${demoEmail}`);
  }

  let org = await Organization.findOne({ 'members.userId': user._id });
  if (!org) {
    org = await Organization.create({
      name: 'FlowPilot Labs',
      slug: `flowpilot-labs-${Math.random().toString(36).slice(2, 8)}`,
      plan: 'pro',
      members: [{ userId: user._id, role: 'owner', joinedAt: new Date() }],
      connectedIntegrations: [
        { integrationKey: 'gmail', status: 'connected', connectedAt: new Date() },
        { integrationKey: 'slack', status: 'connected', connectedAt: new Date() },
        { integrationKey: 'hubspot', status: 'connected', connectedAt: new Date() },
        { integrationKey: 'openai', status: 'connected', connectedAt: new Date() },
        { integrationKey: 'google_sheets', status: 'connected', connectedAt: new Date() },
      ],
    });
    console.log(`[seed] created demo org ${org.name}`);
  }

  // --- Workflows ----------------------------------------------------------------
  const flows = buildFlows();
  const workflows: Array<{ _id: unknown; name: string }> = [];

  for (const flow of flows) {
    let wf = await Workflow.findOne({ organizationId: org._id, name: flow.name });
    if (!wf) {
      wf = await Workflow.create({
        organizationId: org._id,
        createdBy: user._id,
        name: flow.name,
        description: flow.description,
        status: 'active',
        nodes: flow.nodes,
        edges: flow.edges,
      });
      console.log(`[seed] created workflow: ${flow.name}`);
    }
    workflows.push({ _id: wf._id, name: flow.name });
  }

  // --- Executions (30 days of realistic data) -----------------------------------
  const existingEx = await Execution.countDocuments({ organizationId: org._id });
  if (existingEx === 0) {
    console.log('[seed] generating demo executions...');
    await seedExecutions(org._id, user._id, workflows);
  }

  // --- Agents --------------------------------------------------------------------
  const agents = [
    defineAgent('Sales Agent', 'Qualifies and follows up on inbound sales leads.', 'You are a senior sales agent. Qualify leads based on budget, authority, need and timing. Recommend next steps with specific talking points.'),
    defineAgent('Support Agent', 'Resolves customer support requests.', 'You are a friendly support agent. Understand the issue, provide a clear step-by-step fix, escalate when needed, and keep the tone warm and concise.'),
    defineAgent('Lead Qualification Assistant', 'Scores and routes inbound leads.', 'You are a lead qualification assistant. Analyze incoming leads and determine quality based on company size, industry, location, budget and intent. Output a 1-100 score and a qualified boolean.'),
    defineAgent('Email Agent', 'Writes on-brand email drafts.', 'You are an email assistant. Write clear, on-brand emails that move the reader to action. Keep tone natural and adapt to the audience.'),
    defineAgent('Research Agent', 'Summarizes research on companies and markets.', 'You are a research analyst. Summarize key facts, risks and opportunities concisely with sources when available.'),
  ];

  for (const agent of agents) {
    const existing = await Agent.findOne({ organizationId: org._id, name: agent.name });
    if (!existing) {
      await Agent.create({
        organizationId: org._id,
        createdBy: user._id,
        ...agent,
        model: 'auto',
        temperature: 0.7,
        tools: [
          { name: 'web_search', enabled: false },
          { name: 'code_interpreter', enabled: false },
          { name: 'browser', enabled: false },
        ],
        memory: false,
        executionLimit: 1000,
        status: 'active',
      });
      console.log(`[seed] created agent: ${agent.name}`);
    }
  }

  // --- Templates -------------------------------------------------------------------
  await getIntegrationsSeed();
  await seedTemplates();

  // --- Notifications + Activity ----------------------------------------------------
  const notifCount = await NotificationModel.countDocuments({ organizationId: org._id });
  if (notifCount === 0) {
    await NotificationModel.create([
      { userId: user._id, organizationId: org._id, type: 'success', title: 'Lead qualified', body: 'Sarah Chen scored 87 and was added to your CRM pipeline.' },
      { userId: user._id, organizationId: org._id, type: 'info', title: 'New workflow published', body: 'AI Lead Qualification is now active.' },
      { userId: user._id, organizationId: org._id, type: 'success', title: 'Support ticket resolved', body: 'Ticket #1042 was auto-resolved by AI.' },
      { userId: user._id, organizationId: org._id, type: 'warning', title: 'Execution limit at 82%', body: 'Pro plan usage is trending up for this month.' },
    ]);
  }

  const actCount = await ActivityLogModel.countDocuments({ organizationId: org._id });
  if (actCount === 0) {
await ActivityLogModel.create([
      { organizationId: org._id, userId: user._id, actorName: 'Sarmad', action: 'create', resource: 'workflow', message: 'Created AI Lead Qualification & Follow-up' },
      { organizationId: org._id, userId: user._id, actorName: 'Sarmad', action: 'publish', resource: 'workflow', message: 'Enabled workflow "Customer Support Assistant"' },
      { organizationId: org._id, userId: user._id, actorName: 'Sarmad', action: 'connect', resource: 'integration', message: 'Connected Slack workspace' },
      { organizationId: org._id, userId: user._id, actorName: 'Sarmad', action: 'invite', resource: 'team', message: 'Invited a team member' },
    ]);
  }

console.log('[seed] done.');
  console.log(`  Demo login:  ${demoEmail}`);
  console.log(`  Password:    ${demoPassword}`);
}

/**
 * CLI entrypoint: `npm run seed`.
 * Connects to Mongo (falling back to in-memory), seeds, then disconnects.
 */
export async function runSeed(): Promise<void> {
  console.log('[seed] connecting to Mongo...');
  await connectDB();
  await seedDemoData();
  await disconnectDB();
}

function defineAgent(name: string, description: string, instructions: string) {
  return { name, description, instructions };
}

async function seedExecutions(
  orgId: unknown,
  userId: unknown,
  workflows: Array<{ _id: unknown; name: string }>
): Promise<void> {
  const now = Date.now();
  const docs = [];

  const nameBank = ['Sarah Chen', 'Marcus Webb', 'Emily Park', 'Daniel Okafor', 'Priya Sharma'];
  const companyBank = ['Acme Corp', 'Brightwave', 'Northwind Labs', 'Helio Health', 'Vantage Group'];
  const emailBank = ['sarah@acme.io', 'marcus@brightwave.ai', 'emily@northwind.io', 'daniel@helio.io', 'priya@vantage.co'];
  const channels = ['#sales', '#support', '#marketing', '#finance', '#meetings'];

  for (const wf of workflows) {
    const isQual = wf.name.includes('Qualification');
    const isSupport = wf.name.includes('Support');
    const isSales = wf.name.includes('Sales');
    const isInvoice = wf.name.includes('Invoice');
    const baseExecutions = isQual ? 420 : isSupport ? 260 : isSales ? 300 : isInvoice ? 120 : 80;
    const qualRate = 0.94;

    for (let i = 0; i < baseExecutions; i++) {
      const dayOffset = Math.floor(Math.random() * 30);
      const created = new Date(now - dayOffset * 86400000 - Math.floor(Math.random() * 86400000));
      const success = Math.random() < qualRate;
      const durationMs = 900 + Math.floor(Math.random() * 4200);

      const idx = Math.floor(Math.random() * nameBank.length);
      const triggerData = {
        name: nameBank[idx],
        company: companyBank[idx],
        email: emailBank[idx],
        budget: [15000, 28000, 45000, 9000, 62000][Math.floor(Math.random() * 5)],
        source: Math.random() < 0.6 ? 'Website form' : 'LinkedIn',
      };

      let steps = [];
      if (isQual) {
        const score = 40 + Math.floor(Math.random() * 60);
        const qualified = score >= 70;
        steps = [
          stepLog('n1', 'new_lead', 'New Lead', 'success', created, 40, null, 'Trigger received: New Lead'),
          stepLog('n2', 'ai_analyze', 'AI Analyze Lead', 'success', new Date(created.getTime() + 700), 800 + Math.floor(Math.random() * 800), JSON.stringify({ lead_score: score, qualified })),
          stepLog('n3', 'lead_score', 'Lead Score >= 70', 'success', new Date(created.getTime() + 900), 80, JSON.stringify({ passed: qualified })),
        ];
        if (qualified) {
          steps.push(stepLog('n4', 'create_crm_record', 'Create CRM Record', 'success', new Date(created.getTime() + 1200), 140));
          steps.push(stepLog('n5', 'ai_generate', 'Generate Email', 'success', new Date(created.getTime() + 1500), 900, 'Draft: follow-up email'));
          steps.push(stepLog('n6', 'send_email', 'Send Email', 'success', new Date(created.getTime() + 1800), 300));
          steps.push(stepLog('n7', 'create_task', 'Create Follow-up', 'success', new Date(created.getTime() + 2100), 120));
        } else {
          steps.push(stepLog('n8', 'send_notification', 'Add to Nurture', 'success', new Date(created.getTime() + 1200), 100, 'Nurture list'));
        }
      } else if (isSupport) {
        const category = ['Support', 'Billing', 'Sales', 'Feedback'][Math.floor(Math.random() * 4)];
        steps = [
          stepLog('n1', 'new_email', 'New Customer Email', 'success', created, 35, null, 'New email from customer'),
          stepLog('n2', 'ai_classify', 'AI Classify Request', 'success', new Date(created.getTime() + 500), 620, category),
          stepLog('n3', 'ai_generate', 'Generate Response', 'success', new Date(created.getTime() + 1000), 900, 'Reply draft'),
          stepLog('n4', 'create_crm_record', 'Create Support Ticket', 'success', new Date(created.getTime() + 1300), 150),
          stepLog('n5', 'send_notification', 'Notify Team', 'success', new Date(created.getTime() + 1600), 100, channels[1]),
          stepLog('n6', 'send_email', 'Send Reply', 'success', new Date(created.getTime() + 2000), 280),
        ];
      } else if (isSales) {
        steps = [
          stepLog('n1', 'form_submitted', 'Form Submitted', 'success', created, 35, null, 'New form submission'),
          stepLog('n2', 'ai_extract', 'AI Extract Data', 'success', new Date(created.getTime() + 600), 400, 'Parsed form'),
          stepLog('n3', 'delay', 'Wait 1 Hour', 'waiting', new Date(created.getTime() + 800), 600, 'Delayed'),
          stepLog('n4', 'ai_generate', 'AI Generate Text', 'success', new Date(created.getTime() + 1400), 800, 'Draft'),
          stepLog('n5', 'send_email', 'Send Email', 'success', new Date(created.getTime() + 1700), 300),
          stepLog('n6', 'create_task', 'Create Sales Task', 'success', new Date(created.getTime() + 2000), 120),
        ];
      } else if (isInvoice) {
        steps = [
          stepLog('n1', 'new_email', 'Invoice Email', 'success', created, 35, null, 'Invoice email received'),
          stepLog('n2', 'ai_extract', 'AI Extract Invoice', 'success', new Date(created.getTime() + 500), 380, 'invoice fields'),
          stepLog('n3', 'if_else', 'Has Vendor?', 'success', new Date(created.getTime() + 700), 60, 'true'),
          stepLog('n4', 'add_to_sheet', 'Save to Ledger', 'success', new Date(created.getTime() + 1000), 140),
          stepLog('n5', 'send_notification', 'Notify Finance', 'success', new Date(created.getTime() + 1300), 100),
        ];
      } else {
        steps = [
          stepLog('n1', 'webhook', 'Meeting Transcript', 'success', created, 35, null, 'Transcript received via webhook'),
          stepLog('n2', 'ai_summarize', 'AI Summarize', 'success', new Date(created.getTime() + 900), 800, 'summary'),
          stepLog('n3', 'ai_extract', 'Extract Actions', 'success', new Date(created.getTime() + 1400), 500, 'actions'),
          stepLog('n4', 'send_notification', 'Send to Slack', 'success', new Date(created.getTime() + 1700), 100),
          stepLog('n5', 'add_to_sheet', 'Log to Tracker', 'success', new Date(created.getTime() + 1900), 120),
        ];
      }

      if (!success && steps.length > 3) {
        const target = Math.min(steps.length - 1, 3 + Math.floor(Math.random() * 2));
        steps[target] = { ...steps[target], status: 'failed', error: 'Connection timeout after 8 retries' };
        steps = steps.slice(0, target + 1);
      }
      const startedAt = steps[0]?.startedAt ?? created;
      const lastStep = steps[steps.length - 1];
      const completedAt = lastStep?.startedAt ?? new Date(created.getTime() + 3000);

docs.push({
        organizationId: orgId,
        workflowId: wf._id,
        triggeredBy: userId,
        name: wf.name,
        status: success ? 'success' : 'failed',
        startedAt,
        completedAt,
        durationMs,
        steps,
        triggerData,
        isTestRun: Math.random() < 0.05,
        createdAt: created,
      });
    }
  }

  await Execution.insertMany(docs);
  console.log(`[seed] inserted ${docs.length} executions`);
}

function stepLog(
  nodeId: string,
  nodeKey: string,
  label: string,
  status: 'success' | 'failed' | 'running' | 'waiting',
  startedAt: Date,
  durationMs: number,
  message?: string | null,
  maybeError?: string
) {
  return {
    nodeId,
    nodeKey,
    label,
    status,
    startedAt,
    completedAt: new Date(startedAt.getTime() + durationMs),
    durationMs,
    message: message ?? maybeError ?? undefined,
    error: status === 'failed' ? maybeError ?? 'Execution failed' : undefined,
  };
}

async function seedTemplates(): Promise<void> {
  const existing = await Template.countDocuments();
  if (existing > 0) return;

  const leadQual = buildFlows()[0];
  const support = buildFlows()[1];
  const invoice = buildFlows()[3];
  const meeting = buildFlows()[4];

  const templates = [
    {
      slug: 'ai-lead-qualification',
      name: 'AI Lead Qualification',
      category: 'Sales',
      description: 'New Lead ? AI Analysis ? Lead Score ? CRM. Automatically qualifies every inbound lead and routes it to the right pipeline.',
      icon: 'sparkles',
      featured: true,
      steps: ['New Lead', 'AI Analysis', 'Lead Score', 'CRM'],
      tags: ['sales', 'ai', 'crm'],
      nodes: leadQual.nodes.slice(0, 5).map((nd) => ({ ...nd })),
      edges: leadQual.edges.slice(0, 3),
    },
    {
      slug: 'ai-email-follow-up',
      name: 'AI Email Follow-up',
      category: 'Sales',
      description: 'Automatically drafts and sends a personalized follow-up email whenever a new lead arrives.',
      icon: 'mail',
      featured: true,
      steps: ['New Lead', 'AI Generate Email', 'Send Email', 'Schedule Follow-up'],
      tags: ['sales', 'email'],
      nodes: leadQual.nodes.filter((nd) => ['n1', 'n5', 'n6', 'n7'].includes(nd.id)).map((nd) => ({ ...nd })),
      edges: [
        { id: 't1', source: 'n1', target: 'n5' },
        { id: 't2', source: 'n5', target: 'n6' },
        { id: 't3', source: 'n6', target: 'n7' },
      ],
    },
    {
      slug: 'customer-support-assistant',
      name: 'Customer Support Assistant',
      category: 'Customer Support',
      description: 'Classify incoming support emails with AI, draft responses, create tickets and notify the team.',
      icon: 'headset',
      featured: true,
      steps: ['New Email', 'AI Classification', 'AI Response', 'Support Ticket'],
      tags: ['support', 'ai'],
      nodes: support.nodes.map((nd) => ({ ...nd })),
      edges: support.edges.map((ed) => ({ ...ed })),
    },
    {
      slug: 'invoice-processing',
      name: 'Invoice Processing',
      category: 'Operations',
      description: 'Extract structured data from invoice emails, validate and save to your ledger automatically.',
      icon: 'file-check',
      featured: true,
      steps: ['Invoice Email', 'AI Extract', 'Validate', 'Save'],
      tags: ['operations', 'finance'],
      nodes: invoice.nodes.map((nd) => ({ ...nd })),
      edges: invoice.edges.map((ed) => ({ ...ed })),
    },
    {
      slug: 'meeting-summary',
      name: 'Meeting Summary',
      category: 'Operations',
      description: 'Turn meeting transcripts into summaries, extract action items and share them to Slack.',
      icon: 'clipboard',
      featured: false,
      steps: ['Transcript', 'AI Summary', 'Extract Tasks', 'Send to Slack'],
      tags: ['operations', 'ai'],
      nodes: meeting.nodes.map((nd) => ({ ...nd })),
      edges: meeting.edges.map((ed) => ({ ...ed })),
    },
  ];

  await Template.insertMany(templates);
  console.log(`[seed] created ${templates.length} templates`);
}
