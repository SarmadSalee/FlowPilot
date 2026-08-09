export interface GeneratedWorkflow {
  name: string;
  description: string;
  nodes: Array<{
    id: string;
    type: 'trigger' | 'ai' | 'action' | 'condition' | 'utility';
    key: string;
    label: string;
    position: { x: number; y: number };
    config: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    label?: string;
  }>;
}

interface BuildContext {
  description: string;
  goal?: string;
  tools?: string[];
}

let counter = 0;
const nid = () => `n_${Date.now().toString(36)}_${(counter++).toString(36)}`;
const eid = () => `e_${Date.now().toString(36)}_${(counter++).toString(36)}`;

function detectTrigger(desc: string): { key: string; label: string } {
  const lower = desc.toLowerCase();
  if (/(lead|sign[\s-]?up|inbound)/.test(lower) && !/\bon the phone\b/.test(lower)) {
    return { key: 'new_lead', label: 'New Lead' };
  }
  if (/(form|submission|submit)/.test(lower)) return { key: 'form_submitted', label: 'Form Submitted' };
  if (/(order|purchase|checkout)/.test(lower)) return { key: 'new_order', label: 'New Order' };
  if (/(customer)/.test(lower)) return { key: 'new_customer', label: 'New Customer' };
  if (/(email|inbox|received|message)/.test(lower)) return { key: 'new_email', label: 'New Email' };
  if (/(schedule|cron|daily|weekly|every )/.test(lower)) return { key: 'schedule', label: 'Schedule' };
  if (/(webhook)/.test(lower)) return { key: 'webhook', label: 'Webhook' };
  return { key: 'new_lead', label: 'New Lead' };
}

function detectAI(desc: string): { key: string; label: string } {
  const lower = desc.toLowerCase();
  if (/(score|qualif)/.test(lower)) return { key: 'ai_analyze', label: 'AI Analyze Lead' };
  if (/(classif|categor)/.test(lower)) return { key: 'ai_classify', label: 'AI Classify' };
  if (/(extract|parse|structure)/.test(lower)) return { key: 'ai_extract', label: 'AI Extract Data' };
  if (/(summar|transcript)/.test(lower)) return { key: 'ai_summarize', label: 'AI Summarize' };
  if (/(email|draft|reply|write|personaliz)/.test(lower)) return { key: 'ai_generate', label: 'AI Generate Text' };
  return { key: 'ai_analyze', label: 'AI Analyze' };
}

function buildPrompt(desc: string): string {
  return `Analyze the incoming data for: "${desc}". Return a concise structured result including a lead_score from 1-100.`;
}

type NodeSpec = GeneratedWorkflow['nodes'][number];

function actionSpec(
  key: string,
  label: string,
  config: Record<string, unknown> = {}
): { key: string; label: string; config: Record<string, unknown> } {
  return { key, label, config };
}

/** Deterministic, demo-ready workflow generator from a natural language description. */
export function generateWorkflowFromDescription(
  ctx: BuildContext
): GeneratedWorkflow {
  const desc = ctx.description || '';
  const lower = desc.toLowerCase();

  const trigger = detectTrigger(desc);
  const ai = detectAI(desc);
  const wantsCondition = /(if|when|qualified|score|above|threshold|>=|on the other hand)/.test(lower);
  const wantsEmail = /(email|follow[\s-]?up|draft|personaliz)/.test(lower);
  const wantsTask = /(task|remind|todo)/.test(lower);
  const wantsCrm = /(crm|record|hubspot|salesforce)/.test(lower);
  const wantsNotify = /(notify|notification|slack|team)/.test(lower);

  const nodes: NodeSpec[] = [];
  const edges: GeneratedWorkflow['edges'] = [];

  const triggerNode: NodeSpec = {
    id: nid(), type: 'trigger', key: trigger.key, label: trigger.label,
    position: { x: 80, y: 260 },
    config: {},
  };
  const aiNode: NodeSpec = {
    id: nid(), type: 'ai', key: ai.key, label: ai.label,
    position: { x: 320, y: 260 },
    config: {
      provider: 'auto',
      model: 'auto',
      prompt: buildPrompt(desc),
      outputKey: 'ai_result',
      parseJson: true,
    },
  };

  nodes.push(triggerNode, aiNode);

  const buildTrueBranch = () => {
    const items: Array<{ key: string; label: string; config: Record<string, unknown> }> = [];
    if (wantsCrm) items.push(actionSpec('create_crm_record', 'Create CRM Record', { object: 'Contact', fields: {} }));
    if (wantsEmail) items.push(actionSpec('ai_generate', 'Generate Email', { instructions: `Write a personalized follow-up email for {{name}} at {{company}}`, tone: 'professional', outputKey: 'email_draft' }));
    if (wantsEmail) items.push(actionSpec('send_email', 'Send Email', { to: '{{email}}', subject: 'Following up', body: '{{email_draft}}', outputKey: 'email_sent' }));
    if (wantsTask) items.push(actionSpec('create_task', 'Create Follow-up Task', { title: 'Follow up with {{name}}', dueIn: 2 }));
    if (wantsNotify) items.push(actionSpec('send_notification', 'Notify Team', { channel: '#sales', message: 'New qualified lead: {{name}}' }));
    if (items.length === 0) items.push(actionSpec('send_email', 'Send Email', { to: '{{email}}', subject: 'Thank you', body: 'Thanks for getting in touch, {{name}}!' }));
    return items;
  };

  if (wantsCondition) {
    const condition: NodeSpec = {
      id: nid(), type: 'condition', key: 'lead_score', label: 'Lead Score >= 70',
      position: { x: 560, y: 260 },
      config: { field: 'ai_result.lead_score', operator: 'gte', threshold: 70, outputKey: 'qualified' },
    };
    nodes.push(condition);
    edges.push({ id: eid(), source: triggerNode.id, target: aiNode.id });
    edges.push({ id: eid(), source: aiNode.id, target: condition.id });

    const trueItems = buildTrueBranch();
    let lastTrue = condition.id;
    let x = 560;
    trueItems.forEach((item, i) => {
      const node: NodeSpec = {
        id: nid(), type: 'action', key: item.key, label: item.label,
        position: { x: x + 200, y: 80 + i * 130 },
        config: item.config,
      };
      nodes.push(node);
      edges.push({
        id: eid(), source: lastTrue, target: node.id,
        ...(lastTrue === condition.id ? { sourceHandle: 'true', targetHandle: 'true', label: 'YES' } : {}),
      });
      lastTrue = node.id;
      x += 200;
    });

    const nurture: { key: string; label: string; config: Record<string, unknown> } = wantsTask
      ? actionSpec('create_task', 'Add to Nurture', { title: 'Nurture lead {{name}}', dueIn: 5 })
      : actionSpec('send_notification', 'Add to Nurture', { channel: '#marketing', message: 'Add {{name}} to nurture list' });

    const falseNode: NodeSpec = {
      id: nid(), type: 'action', key: nurture.key, label: nurture.label,
      position: { x: 760, y: 620 },
      config: nurture.config,
    };
    nodes.push(falseNode);
    edges.push({ id: eid(), source: condition.id, target: falseNode.id, sourceHandle: 'false', targetHandle: 'false', label: 'NO' });
  } else {
    const items = buildTrueBranch().filter((i) => i.key !== 'create_crm_record' || wantsCrm);
    let cursor = aiNode.id;
    let x = 320;
    items.forEach((item) => {
      const node: NodeSpec = {
        id: nid(), type: 'action', key: item.key, label: item.label,
        position: { x: x + 200, y: 260 },
        config: item.config,
      };
      nodes.push(node);
      edges.push({ id: eid(), source: cursor, target: node.id });
      cursor = node.id;
      x += 200;
    });
  }

  return { name: niceName(desc), description: desc, nodes, edges };
}

function niceName(desc: string): string {
  const cleaned = desc
    .replace(/whenever|when|every time|i want to|please|for me|and|that|the/gi, ' ')
    .trim()
    .replace(/\.+$/, '');
  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 5);
  if (words.length === 0) return 'AI Workflow';
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}