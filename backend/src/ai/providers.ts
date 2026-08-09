import type {
  AICompletionOptions,
  AICompletionResult,
  AIProvider,
  AIProviderName,
} from './types';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

interface ProviderCtor {
  new (): AIProvider;
}

const registry = new Map<AIProviderName, ProviderCtor>();

export function registerProvider(name: AIProviderName, ctor: ProviderCtor): void {
  registry.set(name, ctor);
}

export function hasApiKey(provider: AIProviderName): boolean {
  switch (provider) {
    case 'openai':
      return Boolean(env.openaiApiKey);
    case 'anthropic':
      return Boolean(env.anthropicApiKey);
    case 'deepseek':
      return Boolean(env.deepseekApiKey);
    case 'mock':
      return true;
    default:
      return false;
  }
}

export function resolveProvider(
  requested?: AIProviderName | 'auto'
): AIProvider {
  const name = (requested && requested !== 'auto' ? requested : env.aiDefaultProvider) as AIProviderName;

  if (name === 'mock' || (!hasApiKey(name) && env.aiAutoFallback)) {
    return new MockProvider();
  }

  const ctor = registry.get(name);
  if (!ctor) {
    throw ApiError.badRequest(`Unknown AI provider: ${name}`);
  }
  return new ctor();
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

const MOCK_RESPONSES: Array<[RegExp, string]> = [
  [/score|qualif|lead/i, '{"lead_score": 87, "qualified": true, "reasoning": "Clear buying intent, strong budget signal, matches ICP, active project timeline."}'],
  [/classif|support|ticket|complaint|refund/i, 'category: support\nconfidence: 0.94\nsummary: "Customer reports a billing discrepancy and requests a refund."'],
  [/summar/i, 'Summary: The message discusses an outstanding invoice and a requested follow-up meeting to finalize the agreement. Key points: (1) pending payment, (2) proposed next call on Thursday, (3) contact expects a contract draft.'],
  [/email|follow[- ]?up/i, 'Subject: Following up on our conversation\n\nHi {{first_name}},\n\nI wanted to follow up on our recent conversation and see if you have any questions about how FlowPilot could help your team automate manual workflows.\n\nWould you be available for a quick 15-minute call this week?\n\nBest regards,\nThe FlowPilot Team'],
  [/extract|parse/i, '{"name": "Sarah Chen", "email": "sarah.chen@acme.io", "company": "Acme Corp", "budget": 25000, "role": "VP Operations", "country": "US"}'],
  [/lead|opportunity/i, 'Opportunity analysis:\n- Intent: High (viewed pricing, requested a demo)\n- Fit: Strong (matches ICP)\n- Priority: P1\n- Next best action: Book a demo within 24 hours'],
];

export class MockProvider implements AIProvider {
  readonly name: AIProviderName = 'mock';

  async complete(opts: AICompletionOptions): Promise<AICompletionResult> {
    const prompt = opts.messages.map((m) => m.content).join('\n');
    const combined = `${opts.system ?? ''}\n${prompt}`;

    let text = MOCK_RESPONSES.find(([re]) => re.test(combined))?.[1];
    if (!text) {
      text = `[demo] Processed request with model ${opts.model ?? 'mock'}. This is a simulated AI response so the product works without external API keys.\nInput preview: ${combined.slice(0, 220)}`;
    }

    // Simulate latency
    await new Promise((r) => setTimeout(r, 350));

    return {
      text,
      provider: 'mock',
      model: opts.model ?? 'mock',
      usage: {
        promptTokens: estimateTokens(combined),
        completionTokens: estimateTokens(text),
        totalTokens: estimateTokens(combined) + estimateTokens(text),
      },
    };
  }
}