import type { RequestHandler } from 'express';
import { Types } from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';
import { ApiKeyModel } from '../models/ApiKey';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import crypto from 'node:crypto';

/**
 * Requires a valid JWT access token. Attaches user, org and org role to req.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing bearer token');
    }
    const token = header.slice(7);
    const payload = verifyToken(token);

    const [user, org] = await Promise.all([
      User.findById(payload.userId).lean(),
      Organization.findById(payload.orgId).lean(),
    ]);

    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }
    if (!org) {
      throw ApiError.unauthorized('Organization not found');
    }

    const member = org.members.find(
      (m) => m.userId.toString() === user._id.toString()
    );

    if (!member) {
      throw ApiError.forbidden('You do not belong to this organization');
    }

    req.user = user;
    req.org = org;
    req.orgRole = member.role;
    return next();
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
};

/**
 * Allows authentication via JWT or FlowPilot API key (fp_live_... or fp_test_...).
 * Used for programmatic workflow triggers.
 */
export const authenticateOrApiKey: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header) {
      throw ApiError.unauthorized('Missing credentials');
    }

    if (header.startsWith('Bearer ')) {
      const token = header.slice(7);
      const payload = verifyToken(token);
      const [user, org] = await Promise.all([
        User.findById(payload.userId).lean(),
        Organization.findById(payload.orgId).lean(),
      ]);
      if (!user || !org) {
        throw ApiError.unauthorized('Invalid credentials');
      }
      const member = org.members.find(
        (m) => m.userId.toString() === user._id.toString()
      );
      if (!member) {
        throw ApiError.forbidden('Not a member of this organization');
      }
      req.user = user;
      req.org = org;
      req.orgRole = member.role;
      return next();
    }

    if (header.startsWith('ApiKey ')) {
      const key = header.slice(7).trim();
      const hash = crypto.createHash('sha256').update(key).digest('hex');
      const record = await ApiKeyModel.findOne({
        keyHash: hash,
        revokedAt: null,
      }).exec();
      if (!record) {
        throw ApiError.unauthorized('Invalid API key');
      }
      const org = await Organization.findById(record.organizationId).lean();
      if (!org) {
        throw ApiError.unauthorized('Organization not found');
      }
      record.lastUsedAt = new Date();
      record.useCount = (record.useCount ?? 0) + 1;
      await record.save();
      req.org = org;
      req.orgRole = 'admin';
      req.apiKeyAuth = true;
      req.user = await User.findById(record.createdBy).lean();
      return next();
    }

    throw ApiError.unauthorized('Unsupported authorization scheme');
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    return next(ApiError.unauthorized('Invalid credentials'));
  }
};

/**
 * Allows a request with an optional bearer token (public-ish routes like health).
 */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next();
    }
    const token = header.slice(7);
    const payload = verifyToken(token);
    const [user, org] = await Promise.all([
      User.findById(payload.userId).lean(),
      Organization.findById(payload.orgId).lean(),
    ]);
    if (user && org) {
      req.user = user;
      req.org = org;
    }
    return next();
  } catch {
    return next();
  }
};

/** Require a given role (or above) for an organization-scoped request. */
export const requireRole =
  (...roles: Array<'owner' | 'admin' | 'member' | 'viewer'>): RequestHandler =>
  (req, _res, next) => {
    if (!req.orgRole) {
      return next(ApiError.unauthorized());
    }
    const role = req.orgRole as 'owner' | 'admin' | 'member' | 'viewer';
    if (!roles.includes(role)) {
      return next(ApiError.forbidden('You do not have permission for this action'));
    }
    return next();
  };

export const ensureValidObjectId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid id format');
  }
  return new Types.ObjectId(id);
};