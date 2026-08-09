import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  company: z.string().max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  company: z.string().max(120).optional(),
  avatarColor: z.enum(['indigo', 'violet', 'sky', 'emerald', 'rose', 'amber', 'cyan', 'graphite']).optional(),
  avatar: z
    .string()
    .max(800_000, 'Image too large')
    .refine((v) => v === '' || v.startsWith('data:image/'), {
      message: 'Invalid image data',
    })
    .optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  website: z.string().max(200).optional(),
  industry: z.string().max(100).optional(),
});