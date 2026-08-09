import type { AICompletionOptions, AICompletionResult, AIProvider } from '../types';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

const MODEL_ALIAS: Record<string, string> = {
  'deepseek-chat': 'deepseek-chat',
  'deepseek-reasoner': 'deepseek-reasoner',
};

export class DeepSeekProvider implements AIProvider {
  readonly name = 'deepseek' as const;

  async complete(opts: AICompletionOptions): Promise<AICompletionResult> {
    const apiKey = env.deepseekApiKey;
    if (!apiKey) {
      throw ApiError.badRequest('DEEPSEEK_API_KEY is not configured');
    }

    const model = MODEL_ALIAS[opts.model ?? 'deepseek-chat'] ?? 'deepseek-chat';
    const messages = [
      ...(opts.system ? [{ role: 'system' as const, content: opts.system }] : []),
      ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch('https://api.deepseek.com/chat/completions', {
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
      throw ApiError.badRequest(`DeepSeek API error (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
      text: data.choices[0]?.message?.content ?? '',
      provider: 'deepseek',
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