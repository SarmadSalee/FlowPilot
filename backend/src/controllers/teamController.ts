import type { Request, Response } from 'express';
import { teamService } from '../services/teamService';
import { ok } from '../utils/http';

export const teamController = {
  async list(req: Request, res: Response) {
    return ok(res, await teamService.list(String(req.org!._id)));
  },

  async invite(req: Request, res: Response) {
    const result = await teamService.invite(String(req.org!._id), req.user!, req.body);
    return ok(res, result);
  },

  async removeMember(req: Request, res: Response) {
    const result = await teamService.removeMember(String(req.org!._id), req.user!, req.params.userId);
    return ok(res, result);
  },

  async changeRole(req: Request, res: Response) {
    const result = await teamService.changeRole(String(req.org!._id), req.user!, req.params.userId, req.body.role);
    return ok(res, result);
  },

  async acceptInvite(req: Request, res: Response) {
    const result = await teamService.acceptInvite(req.body.token, String(req.user!._id));
    return ok(res, result);
  },

  async activityLog(req: Request, res: Response) {
    return ok(res, await teamService.activityLog(String(req.org!._id)));
  },
};