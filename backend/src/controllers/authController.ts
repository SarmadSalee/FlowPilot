import type { Request, Response } from 'express';
import { authService } from '../services/authService';
import { created, noContent, ok } from '../utils/http';

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    return created(res, result);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body.email, req.body.password);
    return ok(res, result);
  },

  async me(req: Request, res: Response) {
    const result = await authService.getMe(String(req.user!._id));
    return ok(res, result);
  },

  async logout(_req: Request, res: Response) {
    // With stateless JWTs the client discards the token.
    return noContent(res);
  },

  async forgotPassword(_req: Request, res: Response) {
    const result = await authService.forgotPassword(_req.body.email);
    return ok(res, result);
  },

  async resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body.token, req.body.password);
    return ok(res, { message: 'Password updated. You can now sign in.' });
  },

  async changePassword(req: Request, res: Response) {
    await authService.changePassword(
      String(req.user!._id),
      req.body.currentPassword,
      req.body.newPassword
    );
    return ok(res, { message: 'Password changed' });
  },

  async updateProfile(req: Request, res: Response) {
    const result = await authService.updateProfile(String(req.user!._id), req.body);
    return ok(res, result);
  },

  async updateCompany(req: Request, res: Response) {
    const result = await authService.updateCompany(String(req.org!._id), req.body);
    return ok(res, result);
  },
};