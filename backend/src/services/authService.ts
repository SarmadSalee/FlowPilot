import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { ApiError } from '../utils/ApiError';
import { signToken, signResetToken, verifyResetToken } from '../utils/jwt';
import { env } from '../config/env';

export interface AuthUserResult {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    company?: string;
    avatarColor: string;
    avatar: string;
    isVerified: boolean;
  };
  org: {
    _id: string;
    name: string;
    slug: string;
    plan: string;
    role: string;
    membersCount: number;
  };
}

function buildAuthResult(user: unknown, org: unknown, role: string): AuthUserResult {
  const u = user as Record<string, any>;
  const o = org as Record<string, any>;
  const token = signToken({ userId: String(u._id), orgId: String(o._id) });
  return {
    token,
    user: {
      _id: String(u._id),
      name: u.name,
      email: u.email,
      company: u.company,
      avatarColor: u.avatarColor,
      avatar: u.avatar ?? '',
      isVerified: u.isVerified,
    },
    org: {
      _id: String(o._id),
      name: o.name,
      slug: o.slug,
      plan: o.plan,
      role,
      membersCount: o.members?.length ?? 0,
    },
  };
}

export const authService = {
  async register(input: {
    name: string;
    email: string;
    password: string;
    company?: string;
  }): Promise<AuthUserResult> {
    const email = input.email.toLowerCase().trim();
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const slug = `${slugify(input.company ?? input.name)}-${nanoid(6).toLowerCase()}`;

    const user = await User.create({
      name: input.name.trim(),
      email,
      password: passwordHash,
      company: input.company?.trim(),
    });

    const org = await Organization.create({
      name: input.company?.trim() || `${input.name.trim()}'s workspace`,
      slug,
      plan: 'free',
      members: [{ userId: user._id, role: 'owner', joinedAt: new Date() }],
    });

    return buildAuthResult(user, org, 'owner');
  },

  async login(email: string, password: string): Promise<AuthUserResult> {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password').exec();
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const org = await Organization.findOne({ 'members.userId': user._id }).exec();
    if (!org) {
      throw ApiError.forbidden('No organization found for this account');
    }
    const member = org.members.find((m) => String(m.userId) === String(user._id));

    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } }).exec();

    return buildAuthResult(user.toObject(), org.toObject(), member?.role ?? 'member');
  },

  async getMe(userId: string): Promise<AuthUserResult> {
    const user = await User.findById(userId).lean();
    if (!user) throw ApiError.notFound('User not found');
    const org = await Organization.findOne({ 'members.userId': user._id }).lean();
    if (!org) throw ApiError.notFound('Organization not found');
    const member = org.members.find((m) => String(m.userId) === String(user._id));
    return buildAuthResult(user, org, member?.role ?? 'member');
  },

  async forgotPassword(email: string): Promise<{ resetToken: string; resetLink: string }> {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    // Always respond the same to avoid user enumeration in production; return token for demo.
    if (!user) {
      throw ApiError.notFound('No account found with that email');
    }
    const resetToken = signResetToken(String(user._id));
    return {
      resetToken,
      resetLink: `${env.clientUrl}/reset-password?token=${resetToken}`,
    };
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const payload = verifyResetToken(token);
    const hash = await bcrypt.hash(password, 12);
    await User.updateOne({ _id: payload.userId }, { $set: { password: hash } }).exec();
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password').exec();
    if (!user) throw ApiError.notFound('User not found');
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw ApiError.badRequest('Current password is incorrect');
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
  },

  async updateProfile(
    userId: string,
    input: { name?: string; company?: string; avatarColor?: string; avatar?: string }
  ): Promise<{ user: Record<string, unknown> }> {
    const patch: Record<string, unknown> = {};
    if (input.name) patch.name = input.name.trim();
    if (input.company !== undefined) patch.company = input.company?.trim();
    if (input.avatarColor) patch.avatarColor = input.avatarColor;
    if (input.avatar !== undefined) patch.avatar = input.avatar;

    const user = await User.findByIdAndUpdate(userId, { $set: patch }, { new: true }).lean();
    if (!user) throw ApiError.notFound('User not found');
    return { user: this.safeUser(user) };
  },

  async updateCompany(
    orgId: string,
    input: { name?: string; website?: string; industry?: string }
  ): Promise<{ org: Record<string, unknown> }> {
    const patch: Record<string, unknown> = {};
    if (input.name) patch.name = input.name.trim();
    if (input.website !== undefined) patch.website = input.website?.trim();
    if (input.industry !== undefined) patch.industry = input.industry?.trim();
    const org = await Organization.findByIdAndUpdate(orgId, { $set: patch }, { new: true }).lean();
    if (!org) throw ApiError.notFound('Organization not found');
    return { org: { _id: String(org._id), name: org.name, slug: org.slug, plan: org.plan, website: org.website, industry: org.industry } };
  },

  safeUser(user: Record<string, any>): Record<string, unknown> {    return {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      company: user.company,
      avatarColor: user.avatarColor,
      avatar: user.avatar ?? '',
      isVerified: user.isVerified,
    };
  },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'workspace';
}