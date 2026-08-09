import type { AICompletionOptions, AICompletionResult, AIProvider } from '../types';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

const MODEL_ALIAS: Record<string, string> = {
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
};

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const;

  async complete(opts: AICompletionOptions): Promise<AICompletionResult> {
    const apiKey = env.openaiApiKey;
    if (!apiKey) {
      throw ApiError.badRequest('OPENAI_API_KEY is not configured');
    }

    const model = MODEL_ALIAS[opts.model ?? 'gpt-4o-mini'] ?? 'gpt-4o-mini';
    const messages = [
      ...(opts.system ? [{ role: 'system' as const, content: opts.system }] : []),
      ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw ApiError.badRequest(`OpenAI API error (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
      text: data.choices[0]?.message?.content ?? '',
      provider: 'openai',
      model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      raw: data,
    };
  }
}