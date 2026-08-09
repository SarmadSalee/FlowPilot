import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  orgId: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === 'string') {
    throw new Error('Invalid token');
  }
  return {
    userId: String(decoded.userId),
    orgId: String(decoded.orgId),
  };
}

export function signResetToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: '1h' });
}

export function verifyResetToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === 'string') {
    throw new Error('Invalid token');
  }
  return { userId: String(decoded.userId) };
}