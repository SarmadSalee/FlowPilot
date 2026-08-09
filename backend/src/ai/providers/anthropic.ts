import type { AICompletionOptions, AICompletionResult, AIProvider } from '../types';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

const MODEL_ALIAS: Record<string, string> = {
  'claude-3-5-haiku': 'claude-3-haiku-20240307',
  'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
};

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const;

  async complete(opts: AICompletionOptions): Promise<AICompletionResult> {
    const apiKey = env.anthropicApiKey;
    if (!apiKey) {
      throw ApiError.badRequest('ANTHROPIC_API_KEY is not configured');
    }

    const model = MODEL_ALIAS[opts.model ?? 'claude-3-5-haiku'] ?? 'claude-3-5-haiku';
    const system = opts.system ?? 'You are a helpful assistant for FlowPilot, an AI automation platform.';
    const messages = opts.messages.filter((m) => m.role !== 'system').map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw ApiError.badRequest(`Anthropic API error (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    const text = data.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('');

    return {
      text,
      provider: 'anthropic',
      model,
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      raw: data,
    };
  }
}