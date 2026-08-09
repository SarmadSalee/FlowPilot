import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env';

let memoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  mongoose.connection.on('connected', () => {
    console.log('[db] MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB connection error:', err);
  });

  // Try the configured URI first (local Mongo or Atlas).
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    return;
  } catch {
    if (!env.demoToggle) {
      throw new Error(
        `Could not connect to MongoDB at ${env.mongoUri}. Start MongoDB or provide MONGODB_URI.`
      );
    }
    console.warn(
      '[db] MONGODB_URI not reachable — starting in-memory MongoDB for demo mode.'
    );
  }

  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}