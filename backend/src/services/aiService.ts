import { generateWorkflowFromDescription } from '../ai/workflowGenerator';
import { getProvider, hasApiKey, type AIProviderName } from '../ai';
import { ApiError } from '../utils/ApiError';

export const aiService = {
  async generateWorkflow(input: {
    description: string;
    goal?: string;
    tools?: string[];
    name?: string;
  }) {
    if (!input.description || input.description.trim().length < 10) {
      throw ApiError.badRequest('Describe the workflow you want to build (at least a few words).');
    }
    const generated = generateWorkflowFromDescription({
      description: input.description,
      goal: input.goal,
      tools: input.tools,
    });
    return {
      ...generated,
      name: input.name?.trim() || generated.name,
      provider: 'builtin',
    };
  },

  async generateText(input: {
    provider?: AIProviderName | 'auto';
    model?: string;
    prompt: string;
    system?: string;
    temperature?: number;
  }) {
    if (!input.prompt) throw ApiError.badRequest('Prompt is required');
    const provider = getProvider(input.provider ?? 'auto');
    return provider.complete({
      model: input.model,
      system: input.system,
      temperature: input.temperature,
      messages: [{ role: 'user', content: input.prompt }],
    });
  },

  async analyze(input: {
    provider?: AIProviderName | 'auto';
    model?: string;
    text: string;
    prompt?: string;
  }) {
    if (!input.text) throw ApiError.badRequest('Text to analyze is required');
    const defaultPrompt =
      'Analyze the following content and return a structured breakdown of its key points, sentiment, and suggested next actions.';
    const provider = getProvider(input.provider ?? 'auto');
    return provider.complete({
      model: input.model,
      messages: [
        { role: 'system', content: input.prompt ?? defaultPrompt },
        { role: 'user', content: input.text },
      ],
    });
  },
};

export function aiProviderStatus(): Array<{
  provider: AIProviderName;
  configured: boolean;
}> {
  return (['openai', 'anthropic', 'deepseek', 'mock'] as AIProviderName[]).map(
    (p) => ({ provider: p, configured: p === 'mock' || hasApiKey(p) })
  );
}