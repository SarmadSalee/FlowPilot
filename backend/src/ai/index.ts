import { registerProvider, resolveProvider, hasApiKey } from './providers';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { DeepSeekProvider } from './providers/deepseek';
import type { AIProvider, AIProviderName } from './types';

export * from './types';

let initialized = false;

function ensureProviders(): void {
  if (initialized) return;
  registerProvider('openai', OpenAIProvider);
  registerProvider('anthropic', AnthropicProvider);
  registerProvider('deepseek', DeepSeekProvider);
  initialized = true;
}

/** Returns a configured AI provider. 'auto' resolves via env.AI_DEFAULT_PROVIDER. */
export function getProvider(requested?: AIProviderName | 'auto'): AIProvider {
  ensureProviders();
  return resolveProvider(requested);
}

export { hasApiKey };