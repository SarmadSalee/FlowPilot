import { randomBytes } from 'node:crypto';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { ActivityLogModel } from '../models/ActivityLog';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

const VALID_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
type MemberRole = (typeof VALID_ROLES)[number];

function validRole(role: string): role is MemberRole {
  return (VALID_ROLES as readonly string[]).includes(role);
}

async function log(organizationId: string, user: { _id: unknown; name: string }, action: string, message: string) {
  await ActivityLogModel.create({
    organizationId,
    userId: String(user._id),
    actorName: user.name,
    action,
    resource: 'team',
    message,
  });
}

interface Actor {
  _id: unknown;
  name: string;
}

export const teamService = {
  async list(organizationId: string) {
    const org = await Organization.findById(organizationId).lean();
    if (!org) throw ApiError.notFound('Organization not found');

    const userIds = org.members.map((m) => m.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name email avatarColor avatar lastLoginAt')
      .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const members = org.members.map((m) => {
      const u = userMap.get(String(m.userId));
      return {
        userId: String(m.userId),
        name: u?.name ?? 'Unknown',
        email: u?.email ?? '',
        avatarColor: u?.avatarColor ?? 'indigo',
        avatar: u?.avatar ?? '',
        role: m.role,
        invitedAt: m.invitedAt,
        joinedAt: m.joinedAt,
        lastLoginAt: u?.lastLoginAt ?? undefined,
      };
    });

    return {
      members,
      invites: org.invites.map((i) => ({
        email: i.email,
        role: i.role,
        status: i.status,
        expiresAt: i.expiresAt,
        token: i.token,
      })),
    };
  },

  async invite(organizationId: string, actor: Actor, input: { email: string; role?: string }) {
    const role = input.role ?? 'member';
    if (!validRole(role)) throw ApiError.badRequest('Invalid role');

    const org = await Organization.findById(organizationId);
    if (!org) throw ApiError.notFound('Organization not found');

    const email = input.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser && org.members.some((m) => String(m.userId) === String(existingUser._id))) {
      throw ApiError.conflict('This user is already a member');
    }
    if (org.invites.some((i) => i.email === email && i.status === 'pending')) {
      throw ApiError.conflict('An invitation is already pending for this email');
    }

    const token = randomBytes(24).toString('hex');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (org.invites as any[]).push({
      email,
      role,
      invitedById: String(actor._id),
      status: 'pending',
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await org.save();

    await log(organizationId, actor, 'invite', `Invited ${email} to the team`);

    return {
      email,
      role,
      inviteUrl: `${env.clientUrl}/invite?token=${token}`,
    };
  },

  async removeMember(organizationId: string, actor: Actor, userId: string) {
    const org = await Organization.findById(organizationId);
    if (!org) throw ApiError.notFound('Organization not found');

    const member = org.members.find((m) => String(m.userId) === userId);
    if (!member) throw ApiError.notFound('Member not found');
    if (member.role === 'owner') throw ApiError.badRequest('Cannot remove the organization owner');

    org.set(
      'members',
      org.members.filter((m) => String(m.userId) !== userId)
    );
    await org.save();

    const target = await User.findById(userId).lean();
    await log(organizationId, actor, 'remove_member', `Removed ${target?.name ?? userId} from the team`);
    return { removed: true };
  },

  async changeRole(organizationId: string, actor: Actor, userId: string, role: string) {
    if (!validRole(role)) throw ApiError.badRequest('Invalid role');
    const org = await Organization.findById(organizationId);
    if (!org) throw ApiError.notFound('Organization not found');

    const member = org.members.find((m) => String(m.userId) === userId);
    if (!member) throw ApiError.notFound('Member not found');
    if (member.role === 'owner') throw ApiError.badRequest('Cannot change the owner role');

    member.role = role as MemberRole;
    await org.save();

    const target = await User.findById(userId).lean();
    await log(organizationId, actor, 'change_role', `Changed ${target?.name ?? userId}'s role to ${role}`);
    return { userId, role };
  },

  async acceptInvite(token: string, userId: string) {
    const org = await Organization.findOne({ 'invites.token': token });
    if (!org) throw ApiError.badRequest('Invitation is invalid or has expired');

    const invite = org.invites.find((i) => i.token === token);
    if (!invite || invite.status !== 'pending') throw ApiError.badRequest('Invitation is not pending');
    if (invite.expiresAt < new Date()) throw ApiError.badRequest('Invitation has expired');

    invite.status = 'accepted';
    org.members.push({ userId: userId, role: invite.role, joinedAt: new Date() });
    await org.save();
    return { organizationId: String(org._id), role: invite.role };
  },

  async activityLog(organizationId: string) {
    const rows = await ActivityLogModel.find({ organizationId }).sort({ createdAt: -1 }).limit(50).lean();
    return rows.map((r) => ({
      id: String(r._id),
      actorName: r.actorName,
      action: r.action,
      message: r.message,
      createdAt: r.createdAt,
    }));
  },
};