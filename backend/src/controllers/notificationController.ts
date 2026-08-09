import type { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { ok } from '../utils/http';

export const notificationController = {
  async list(req: Request, res: Response) {
    return ok(res, await notificationService.list(String(req.user!._id), String(req.org!._id)));
  },

  async unreadCount(req: Request, res: Response) {
    return ok(res, await notificationService.unreadCount(String(req.user!._id)));
  },

  async markRead(req: Request, res: Response) {
    return ok(res, await notificationService.markRead(String(req.user!._id), req.params.id));
  },

  async markAllRead(req: Request, res: Response) {
    return ok(res, await notificationService.markAllRead(String(req.user!._id)));
  },
};