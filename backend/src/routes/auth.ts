import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { wrap } from '../utils/http';
import {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  changePasswordSchema,
  updateProfileSchema,
  updateCompanySchema,
} from '../validation/auth';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate(registerSchema), wrap(authController.register));
authRouter.post('/login', authRateLimiter, validate(loginSchema), wrap(authController.login));
authRouter.post('/logout', wrap(authController.logout));
authRouter.post('/forgot-password', authRateLimiter, validate(forgotSchema), wrap(authController.forgotPassword));
authRouter.post('/reset-password', authRateLimiter, validate(resetSchema), wrap(authController.resetPassword));
authRouter.get('/me', authenticate, wrap(authController.me));
authRouter.put('/me', authenticate, validate(updateProfileSchema), wrap(authController.updateProfile));
authRouter.post('/me/password', authenticate, validate(changePasswordSchema), wrap(authController.changePassword));
authRouter.put('/organization', authenticate, validate(updateCompanySchema), wrap(authController.updateCompany));