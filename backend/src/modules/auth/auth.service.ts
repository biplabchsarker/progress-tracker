import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../../config/prisma';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import type { JwtPayload } from '../../middleware/auth';

const BCRYPT_ROUNDS = 12;
const LOGIN_ATTEMPT_PREFIX = 'login_attempts:';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

function generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

export async function register(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return user;
}

export async function login(email: string, password: string) {
  const lockKey = `${LOGIN_ATTEMPT_PREFIX}${email}`;
  const attempts = await redis.get(lockKey);
  if (attempts && parseInt(attempts) >= MAX_LOGIN_ATTEMPTS) {
    throw new AppError(429, 'ACCOUNT_LOCKED', 'Too many failed login attempts. Try again in 15 minutes.');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !validPassword) {
    await redis.multi()
      .incr(lockKey)
      .expire(lockKey, LOCKOUT_SECONDS)
      .exec();
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_INACTIVE', 'Your account has been deactivated');
  }

  await redis.del(lockKey);

  const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const rawRefresh = generateRefreshToken();
  const tokenHash = hashToken(rawRefresh);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return {
    accessToken,
    refreshToken: rawRefresh,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function refresh(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      await prisma.refreshToken.delete({ where: { tokenHash } });
    }
    throw new AppError(401, 'REFRESH_TOKEN_INVALID', 'Refresh token is invalid or expired');
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || !user.isActive) {
    throw new AppError(401, 'REFRESH_TOKEN_INVALID', 'Refresh token is invalid or expired');
  }

  const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);

  return { accessToken };
}

export async function logout(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}
