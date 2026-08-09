import { NotificationModel } from '../models/Notification';

export const notificationService = {
  async list(userId: string, organizationId: string) {
    return NotificationModel.find({ userId, organizationId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
  },

  async unreadCount(userId: string) {
    return NotificationModel.countDocuments({ userId, read: false });
  },

  async markRead(userId: string, id: string) {
    await NotificationModel.updateOne({ _id: id, userId }, { $set: { read: true } }).exec();
    return { read: true };
  },

  async markAllRead(userId: string) {
    await NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } }).exec();
    return { read: true };
  },

  async create(userId: string, organizationId: string, input: {
    type?: 'info' | 'success' | 'warning' | 'error';
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }) {
    await NotificationModel.create({
      userId,
      organizationId,
      type: input.type ?? 'info',
      title: input.title,
      body: input.body,
      data: input.data,
    });
  },
};