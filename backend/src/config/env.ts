import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',
  port: Number(process.env.PORT ?? 5000),
  clientUrl: required('CLIENT_URL', 'http://localhost:5173'),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/flowpilot'),
  jwtSecret: required('JWT_SECRET', 'dev-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  openaiApiKey: process.env.OPENAI_API_KEY ?? undefined,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? undefined,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? undefined,
  aiDefaultProvider: process.env.AI_DEFAULT_PROVIDER ?? 'mock',
  aiAutoFallback: process.env.AI_AUTO_FALLBACK !== 'false',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? undefined,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? undefined,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),
  demoToggle: process.env.DEMO_MODE !== 'false',
  demoEmail: process.env.DEMO_EMAIL ?? 'demo@flowpilot.app',
  demoPassword: process.env.DEMO_PASSWORD ?? 'Demo1234!',
} as const;

export type Env = typeof env;