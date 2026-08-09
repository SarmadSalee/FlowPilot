export type AIProviderName = 'openai' | 'anthropic' | 'deepseek' | 'mock';

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  provider?: AIProviderName;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  system?: string;
  messages: AIChatMessage[];
}

export interface AICompletionResult {
  text: string;
  provider: AIProviderName;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  raw?: unknown;
}

export interface AIProvider {
  name: AIProviderName;
  complete(opts: AICompletionOptions): Promise<AICompletionResult>;
}

export interface WorkflowNodeSpec {
  id: string;
  key: string;
  label: string;
  type: 'trigger' | 'ai' | 'action' | 'condition' | 'utility';
  category: string;
  description: string;
  icon: string;
  configFields: NodeConfigField[];
}

export interface NodeConfigField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'password' | 'json';
  placeholder?: string;
  help?: string;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: unknown;
  required?: boolean;
}

export type NodeDefinition = WorkflowNodeSpec;