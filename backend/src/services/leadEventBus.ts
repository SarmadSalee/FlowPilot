import { EventEmitter } from 'node:events';
import type { Response } from 'express';

/**
 * In-process real-time bus for lead intelligence events.
 * Each organization gets a namespaced channel. The /api/leads/stream SSE
 * endpoint subscribes here and also replays recent persisted events for
 * newly connected clients.
 */

export interface LeadStreamEvent {
  type: 'score_changed' | 'lead_created' | 'event_processed' | 'lead_updated' | 'intelligence_ready';
  organizationId: string;
  leadId: string;
  leadName?: string;
  score?: number;
  previousScore?: number;
  delta?: number;
  intent?: string;
  qualification?: string;
  eventType?: string;
  reason?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

const bus = new EventEmitter();
bus.setMaxListeners(0);

const channelFor = (orgId: string) => `lead:${orgId}`;

export const leadEventBus = {
  publish(evt: LeadStreamEvent): void {
    bus.emit(channelFor(evt.organizationId), evt);
  },

  subscribe(orgId: string, handler: (evt: LeadStreamEvent) => void): () => void {
    const ch = channelFor(orgId);
    bus.on(ch, handler);
    return () => bus.off(ch, handler);
  },
};

const HEARTBEAT_MS = 25_000;

/**
 * Attaches an SSE response for an org's live lead feed.
 * Returns a cleanup function for the caller's request lifecycle.
 */
export function attachLeadStream(res: Response, orgId: string, onEvent: (evt: LeadStreamEvent) => void): () => void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 3000\n\n');

  const off = leadEventBus.subscribe(orgId, (evt) => {
    try {
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
      onEvent(evt);
    } catch {
      // Connection dropped; unsubscribe below.
    }
  });

  const heartbeat = setInterval(() => {
    try {
      res.write(`: keepalive\n\n`);
    } catch {
      cleanup();
    }
  }, HEARTBEAT_MS);

  const cleanup = () => {
    clearInterval(heartbeat);
    off();
    try {
      res.end();
    } catch {
      // already closed
    }
  };

  res.on('close', cleanup);
  res.on('error', cleanup);
  return cleanup;
}