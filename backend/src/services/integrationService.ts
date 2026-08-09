import { Organization } from '../models/Organization';
import { ApiError } from '../utils/ApiError';
import { getCatalog, type IntegrationDefinition } from './integrationCatalog';

export interface IntegrationView extends IntegrationDefinition {
  connected: boolean;
  connectedAt?: Date | null;
  metadata?: Record<string, unknown>;
}

export const integrationService = {
  async list(organizationId: string): Promise<IntegrationView[]> {
    const org = await Organization.findById(organizationId).lean();
    if (!org) throw ApiError.notFound('Organization not found');

    const connectedMap = new Map(
      (org.connectedIntegrations ?? []).map((c) => [
        c.integrationKey,
        { connected: c.status === 'connected', connectedAt: c.connectedAt, metadata: c.metadata },
      ])
    );

    return getCatalog().map((def) => {
      const state = connectedMap.get(def.key);
      return {
        ...def,
        connected: state?.connected ?? false,
        connectedAt: state?.connectedAt,
        metadata: state?.metadata,
      };
    });
  },

  async connect(organizationId: string, key: string, credentials?: Record<string, unknown>) {
    const def = getCatalog().find((d) => d.key === key);
    if (!def) throw ApiError.notFound('Integration not found');

    const org = await Organization.findById(organizationId);
    if (!org) throw ApiError.notFound('Organization not found');

    const existing = org.connectedIntegrations.find((c) => c.integrationKey === key);
    if (existing) {
      existing.status = 'connected';
      existing.connectedAt = new Date();
      existing.metadata = { ...(existing.metadata ?? {}), ...(credentials ?? {}) };
    } else {
      org.connectedIntegrations.push({
        integrationKey: key,
        status: 'connected',
        connectedAt: new Date(),
        metadata: credentials ?? {},
      });
    }
    await org.save();
    return { key, connected: true, name: def.name };
  },

  async disconnect(organizationId: string, key: string) {
    const org = await Organization.findById(organizationId);
    if (!org) throw ApiError.notFound('Organization not found');
    const existing = org.connectedIntegrations.find((c) => c.integrationKey === key);
    if (existing) {
      existing.status = 'disconnected';
      existing.metadata = {};
    }
    await org.save();
    return { key, status: 'disconnected' };
  },
};