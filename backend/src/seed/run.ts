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
import { Lead } from '../models/Lead';
import { LeadScore } from '../models/LeadScore';
import { LeadScoreHistory } from '../models/LeadScoreHistory';
import { LeadEvent } from '../models/LeadEvent';
import { LeadAnalysis } from '../models/LeadAnalysis';
import { ICPProfile } from '../models/ICPProfile';
import { ScoringRule } from '../models/ScoringRule';
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

  // --- Lead intelligence demo data ------------------------------------------------
  await seedLeadIntelligence(org._id);

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

async function seedLeadIntelligence(orgId: unknown): Promise<void> {
  const existingLeads = await Lead.countDocuments({ organizationId: orgId });
  if (existingLeads > 0) return;

  const now = Date.now();
  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  const spec = [
    { name: 'Sarah Khan', email: 'sarah.khan@helio.io', company: 'Helio Health', jobTitle: 'VP Operations', industry: 'Healthcare', companySize: '50-200', location: 'US', revenue: 12000000, source: 'Website form', leadType: 'Inbound', phone: '+1 415 555 0101', whatsapp: '+1 415 555 0101', score: 87, icp: 92, eng: 81, intent: 90, status: 'qualified', buyingStage: 'decision', qualification: 'hot', grade: 'B', tags: ['pricing', 'demo'], createdAt: now - 6 * DAY },
    { name: 'John Smith', email: 'john@brightwave.ai', company: 'Brightwave', jobTitle: 'CTO', industry: 'SaaS', companySize: '10-50', location: 'UK', revenue: 3000000, source: 'LinkedIn', leadType: 'Inbound', score: 68, icp: 84, eng: 62, intent: 70, status: 'new', buyingStage: 'evaluation', qualification: 'warm', grade: 'C', tags: ['integration'], createdAt: now - 3 * DAY },
    { name: 'Ahmed Ali', email: 'ahmed@northwind.io', company: 'Northwind Labs', jobTitle: 'Head of Sales', industry: 'SaaS', companySize: '200-500', location: 'UAE', revenue: 25000000, source: 'WhatsApp', leadType: 'Inbound', score: 44, icp: 78, eng: 40, intent: 45, status: 'new', buyingStage: 'interest', qualification: 'qualified', grade: 'C', tags: [], createdAt: now - 2 * DAY },
    { name: 'Emily Park', email: 'emily@acme.io', company: 'Acme Corp', jobTitle: 'Marketing Director', industry: 'E-commerce', companySize: '500+', location: 'US', revenue: 50000000, source: 'Website form', leadType: 'Inbound', score: 31, icp: 55, eng: 22, intent: 25, status: 'unqualified', buyingStage: 'awareness', qualification: 'cold', grade: 'D', tags: [], createdAt: now - 4 * DAY },
    { name: 'Daniel Okafor', email: 'daniel@vantage.co', company: 'Vantage Group', jobTitle: 'Founder', industry: 'Fintech', companySize: '10-50', location: 'UK', revenue: 4000000, source: 'Referral', leadType: 'Inbound', score: 95, icp: 97, eng: 94, intent: 98, status: 'converted', buyingStage: 'customer', qualification: 'hot', grade: 'A', tags: ['meeting-booked'], createdAt: now - 10 * DAY },
    { name: 'Priya Sharma', email: 'priya@vantage.co', company: 'Northwind Labs', jobTitle: 'Growth Lead', industry: 'SaaS', companySize: '50-200', location: 'US', revenue: 8000000, source: 'Instagram', leadType: 'Inbound', score: 12, icp: 30, eng: 8, intent: 10, status: 'spam', buyingStage: 'awareness', qualification: 'unqualified', grade: 'D', tags: ['spam'], createdAt: now - 12 * HOUR },
    { name: 'Marco Rossi', email: 'marco@brightwave.ai', company: 'Brightwave', jobTitle: 'Procurement', industry: 'Manufacturing', companySize: '1000+', location: 'Germany', revenue: 90000000, source: 'Website form', leadType: 'Outbound', score: 58, icp: 61, eng: 52, intent: 55, status: 'contacted', buyingStage: 'consideration', qualification: 'qualified', grade: 'C', tags: ['nurture'], createdAt: now - 1 * DAY },
    { name: 'Aisha Malik', email: 'aisha@helio.io', company: 'Helio Health', jobTitle: 'Clinical Director', industry: 'Healthcare', companySize: '200-500', location: 'UAE', revenue: 30000000, source: 'Webinar', leadType: 'Inbound', score: 74, icp: 88, eng: 70, intent: 76, status: 'new', buyingStage: 'evaluation', qualification: 'warm', grade: 'B', tags: ['demo'], createdAt: now - 5 * HOUR },
    { name: 'Tom Becker', email: 'tom@northwind.io', company: 'Northwind Labs', jobTitle: 'Data Analyst', industry: 'SaaS', companySize: '10-50', location: 'US', revenue: 2000000, source: 'LinkedIn', leadType: 'Outbound', score: 18, icp: 22, eng: 15, intent: 20, status: 'lost', buyingStage: 'awareness', qualification: 'unqualified', grade: 'D', tags: ['competitor'], createdAt: now - 9 * DAY },
    { name: 'Fatima Noor', email: 'fatima@acme.io', company: 'Acme Corp', jobTitle: 'Sales VP', industry: 'E-commerce', companySize: '500+', location: 'US', revenue: 60000000, source: 'Website form', leadType: 'Inbound', score: 81, icp: 90, eng: 78, intent: 85, status: 'qualified', buyingStage: 'decision', qualification: 'hot', grade: 'B', tags: ['pricing', 'proposal'], createdAt: now - 36 * HOUR },
  ];

  const leads: Array<{ _id: unknown; name: string; score: number; qualification: string }> = [];
  for (const s of spec) {
    const lead = await Lead.create({
      organizationId: orgId,
      name: s.name,
      email: s.email,
      company: s.company,
      jobTitle: s.jobTitle,
      industry: s.industry,
      companySize: s.companySize,
      location: s.location,
      website: s.company ? `https://${s.company.toLowerCase().replace(/\s+/g, '')}.com` : undefined,
      revenue: s.revenue,
      source: s.source,
      leadType: s.leadType,
      phone: s.phone,
      whatsapp: s.whatsapp,
      score: s.score,
      icpScore: s.icp,
      engagementScore: s.eng,
      intentScore: s.intent,
      grade: s.grade,
      intent: s.intent >= 70 ? 'high' : s.intent >= 35 ? 'medium' : 'low',
      qualification: s.qualification,
      buyingStage: s.buyingStage,
      confidence: 0.85 + Math.random() * 0.14,
      status: s.status,
      tags: s.tags,
      firstSeenAt: new Date(s.createdAt),
      lastActivityAt: new Date(now - Math.floor(Math.random() * 6) * HOUR),
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(now - Math.floor(Math.random() * 6) * HOUR),
    });
    leads.push({ _id: lead._id, name: s.name, score: s.score, qualification: s.qualification });

    await LeadScore.create({
      organizationId: orgId,
      leadId: lead._id,
      score: s.score,
      grade: s.grade,
      intent: s.intent >= 70 ? 'high' : s.intent >= 35 ? 'medium' : 'low',
      qualification: s.qualification,
      buyingStage: s.buyingStage,
      confidence: 0.85 + Math.random() * 0.14,
      icpMatch: s.icp,
      engagement: s.eng,
      buyingIntent: s.intent,
      factors: [
        { label: s.intent >= 70 ? 'High buying intent detected' : 'Moderate engagement', delta: s.intent >= 70 ? 15 : 6, kind: 'positive', source: 'ai' },
        { label: `ICP fit ${s.icp}%`, delta: 10, kind: 'positive', source: 'icp' },
        { label: 'Engagement score baseline', delta: Math.round(s.eng * 0.3), kind: 'positive', source: 'event' },
      ],
      summary: `${s.name} scored ${s.score}/100 — ${s.qualification}.`,
      explanation: `${s.name} from ${s.company} shows ${s.intent >= 70 ? 'strong' : 'moderate'} intent with an ICP fit of ${s.icp}%.`,
      recommendedAction: {
        title: s.score >= 80 ? 'Contact immediately' : s.score >= 60 ? 'Send follow-up' : 'Add to nurture campaign',
        steps: s.score >= 80 ? ['Send personalized proposal', 'Offer a demo', 'Follow up within 15 minutes'] : s.score >= 60 ? ['Send pricing details', 'Schedule a discovery call'] : ['Add to nurture sequence', 'Re-engage in 7 days'],
        urgency: s.score >= 80 ? 'high' : s.score >= 60 ? 'medium' : 'low',
      },
      provider: 'mock',
      model: 'mock',
      analyzedAt: new Date(s.createdAt),
    });

    await LeadAnalysis.create({
      organizationId: orgId,
      leadId: lead._id,
      score: s.score,
      intent: s.intent >= 70 ? 'high' : s.intent >= 35 ? 'medium' : 'low',
      qualification: s.qualification,
      buyingStage: s.buyingStage,
      confidence: 0.85 + Math.random() * 0.14,
      reasons: [`ICP fit ${s.icp}%`, s.intent >= 70 ? 'Strong buying intent' : 'Moderate engagement', `${s.eng} engagement score`],
      summary: `${s.name} scored ${s.score}/100 — ${s.qualification}.`,
      recommendedAction: s.score >= 80 ? 'Contact immediately' : s.score >= 60 ? 'Send follow-up' : 'Add to nurture campaign',
      recommendedSteps: s.score >= 80 ? ['Send personalized proposal', 'Offer a demo', 'Follow up within 15 minutes'] : ['Send pricing details', 'Schedule a discovery call'],
      source: 'initial',
      provider: 'mock',
      model: 'mock',
      inputSnapshot: { name: s.name, company: s.company },
      createdAt: new Date(s.createdAt),
    });
  }

  // Score history + events for a few leads so timelines and the live feed look alive.
  const story = [
    { idx: 0, score: 87, history: [{ prev: 42, next: 48, reason: 'Email opened' }, { prev: 48, next: 63, reason: 'Pricing link clicked' }, { prev: 63, next: 82, reason: 'Pricing intent detected' }, { prev: 82, next: 87, reason: 'Asked about pricing' }], events: [{ type: 'email_opened' }, { type: 'link_clicked', payload: { text: 'Clicked the pricing page link' } }, { type: 'email_replied', payload: { text: "I'd like to see the pricing for the Business plan." } }] },
    { idx: 1, score: 68, history: [{ prev: 20, next: 35, reason: 'Website visited' }, { prev: 35, next: 51, reason: 'Clicked demo link' }, { prev: 51, next: 68, reason: 'Replied to campaign' }], events: [{ type: 'website_visited' }, { type: 'link_clicked', payload: { text: 'Clicked demo link' } }, { type: 'email_replied', payload: { text: 'Interested in seeing the demo for integrations.' } }] },
    { idx: 2, score: 44, history: [{ prev: 60, next: 51, reason: 'No response for 3 days' }, { prev: 51, next: 44, reason: 'No engagement' }], events: [{ type: 'no_engagement', payload: { text: 'No response for 3 days' } }] },
  ];

  for (const s of story) {
    const lead = leads[s.idx];
    s.history.forEach((h, i) => {
      const at = new Date(now - (s.history.length - i) * 3 * HOUR);
      LeadScoreHistory.create({
        organizationId: orgId,
        leadId: lead._id,
        score: h.next,
        previousScore: h.prev,
        delta: h.next - h.prev,
        reason: h.reason,
        source: 'event',
        eventType: s.events[i]?.type,
        createdAt: at,
        updatedAt: at,
      });
    });
    s.events.forEach((e, i) => {
      const at = new Date(now - (s.events.length - i) * 3 * HOUR);
      LeadEvent.create({
        organizationId: orgId,
        leadId: lead._id,
        type: e.type,
        channel: e.type.includes('email') ? 'email' : e.type.includes('whatsapp') ? 'whatsapp' : 'web',
        payload: e.payload ?? {},
        scoreDelta: 0,
        processed: true,
        processedAt: at,
        createdAt: at,
        updatedAt: at,
      });
    });
  }

  // ICP profile
  const icpCount = await ICPProfile.countDocuments({ organizationId: orgId });
  if (icpCount === 0) {
    await ICPProfile.create({
      organizationId: orgId,
      name: 'Default ICP',
      industries: ['SaaS', 'Healthcare', 'Fintech'],
      companySizeMin: 10,
      companySizeMax: 500,
      locations: ['US', 'UK', 'UAE'],
      jobTitles: ['CEO', 'Founder', 'CTO', 'Head of Sales', 'VP Operations'],
      minRevenue: 1000000,
      keywords: ['automation', 'ai', 'growth'],
      enabled: true,
    });
  }

  // Scoring rules (including one demonstrating the natural-language concept)
  const ruleCount = await ScoringRule.countDocuments({ organizationId: orgId });
  if (ruleCount === 0) {
    await ScoringRule.create([
      {
        organizationId: orgId,
        name: 'Pricing intent boost',
        description: 'Whenever a lead replies to an email and asks about pricing, increase their score by 25 and notify the sales team.',
        trigger: 'lead_event',
        eventType: 'email_replied',
        conditions: [{ field: 'score', operator: 'gte', value: 0 }],
        action: { type: 'increase', value: 25 },
        priority: 10,
        enabled: true,
        source: 'ai',
      },
      {
        organizationId: orgId,
        name: 'Demo request alert',
        description: 'When a lead requests a demo, notify the sales team immediately.',
        trigger: 'lead_event',
        eventType: 'demo_requested',
        conditions: [],
        action: { type: 'notify', target: 'sales_team' },
        priority: 20,
        enabled: true,
        source: 'user',
      },
      {
        organizationId: orgId,
        name: 'Hot lead threshold',
        description: 'When a lead score reaches 80, mark them as high intent.',
        trigger: 'score_threshold',
        conditions: [{ field: 'score', operator: 'gte', value: 80 }],
        action: { type: 'set_intent', value: 'high' },
        priority: 30,
        enabled: true,
        source: 'user',
      },
    ]);
  }

  console.log(`[seed] inserted ${leads.length} demo leads with intelligence`);
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
