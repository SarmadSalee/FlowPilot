import { connectDB } from './config/db';
import { env } from './config/env';
import { createApp, bootstrapIntegrations, autoSeedDemoData } from './app';

async function main() {
  await connectDB();
  await bootstrapIntegrations().catch((err) =>
    console.error('[bootstrap] failed to seed integrations:', err)
  );
  await autoSeedDemoData();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[flowpilot] API listening on http://localhost:${env.port}`);
    console.log(`[flowpilot] environment=${env.nodeEnv} demoMode=${env.demoToggle}`);
  });
}

main().catch((err) => {
  console.error('[flowpilot] failed to start:', err);
  process.exit(1);
});