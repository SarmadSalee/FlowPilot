import crypto from 'node:crypto';
import { ApiKeyModel } from '../models/ApiKey';
import { ApiError } from '../utils/ApiError';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export const apiKeyService = {
  async create(organizationId: string, userId: string, name: string) {
    if (!name) throw ApiError.badRequest('Key name is required.');
    const key = `fp_live_${crypto.randomBytes(24).toString('hex')}`;
    const record = await ApiKeyModel.create({
      organizationId,
      createdBy: userId,
      name: name.trim(),
      keyHash: hashKey(key),
      prefix: key.slice(0, 12),
    });
    return {
      id: String(record._id),
      name,
      key,
      createdAt: record.createdAt,
    };
  },

  async list(organizationId: string) {
    const records = await ApiKeyModel.find({ organizationId, revokedAt: null })
      .sort({ createdAt: -1 })
      .lean();
    return records.map((r) => ({
      id: String(r._id),
      name: r.name,
      prefix: r.prefix,
      createdAt: r.createdAt,
      lastUsedAt: r.lastUsedAt,
      useCount: r.useCount ?? 0,
    }));
  },

  async revoke(organizationId: string, id: string) {
    const record = await ApiKeyModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: { revokedAt: new Date() } },
      { new: true }
    ).lean();
    if (!record) throw ApiError.notFound('API key not found');
    return { id, revoked: true };
  },
};