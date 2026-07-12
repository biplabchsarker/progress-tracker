import { createHash } from 'crypto';
import { prisma } from '../../src/config/prisma';
import { redis } from '../../src/config/redis';
import { AppError } from '../../src/middleware/errorHandler';
import * as authService from '../../src/modules/auth/auth.service';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

describe('auth.service', () => {
  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { user: { email: { contains: 'test-auth-' } } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-auth-' } } });
    await prisma.$disconnect();
    redis.disconnect();
  });

  describe('register', () => {
    it('creates a user without leaking the password hash', async () => {
      const user = await authService.register('test-auth-register@example.com', 'Password123', 'Reg User');
      expect(user.email).toBe('test-auth-register@example.com');
      expect((user as { passwordHash?: string }).passwordHash).toBeUndefined();
    });

    it('rejects a duplicate email', async () => {
      await expect(
        authService.register('test-auth-register@example.com', 'Password123', 'Reg User'),
      ).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    const email = 'test-auth-login@example.com';

    beforeAll(async () => {
      await authService.register(email, 'CorrectPass1', 'Login User');
    });

    afterEach(async () => {
      await redis.del(`login_attempts:${email}`);
    });

    it('logs in with correct credentials and returns tokens', async () => {
      const result = await authService.login(email, 'CorrectPass1');
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user.email).toBe(email);
    });

    it('rejects an unknown email', async () => {
      await expect(authService.login('test-auth-nobody@example.com', 'whatever')).rejects.toThrow(AppError);
    });

    it('rejects a wrong password', async () => {
      await expect(authService.login(email, 'WrongPassword')).rejects.toThrow(AppError);
    });

    it('rejects a deactivated user', async () => {
      const inactiveEmail = 'test-auth-inactive@example.com';
      const user = await authService.register(inactiveEmail, 'Password123', 'Inactive User');
      await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

      await expect(authService.login(inactiveEmail, 'Password123')).rejects.toThrow(AppError);
    });

    it('locks the account after 5 failed attempts, and a correct login resets the counter', async () => {
      for (let i = 0; i < 5; i++) {
        await expect(authService.login(email, 'WrongPassword')).rejects.toThrow(AppError);
      }

      await expect(authService.login(email, 'CorrectPass1')).rejects.toMatchObject({ statusCode: 429 });

      await redis.del(`login_attempts:${email}`);
      await expect(authService.login(email, 'CorrectPass1')).resolves.toMatchObject({ user: { email } });
    });
  });

  describe('refresh and logout', () => {
    const email = 'test-auth-refresh@example.com';

    beforeAll(async () => {
      await authService.register(email, 'Password123', 'Refresh User');
    });

    it('issues a new access token for a valid refresh token', async () => {
      const { refreshToken } = await authService.login(email, 'Password123');
      const result = await authService.refresh(refreshToken);
      expect(result.accessToken).toBeTruthy();
    });

    it('rejects an unknown refresh token', async () => {
      await expect(authService.refresh('not-a-real-token')).rejects.toThrow(AppError);
    });

    it('rejects an expired refresh token and deletes it', async () => {
      const { refreshToken } = await authService.login(email, 'Password123');
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.update({ where: { tokenHash }, data: { expiresAt: new Date('2000-01-01') } });

      await expect(authService.refresh(refreshToken)).rejects.toThrow(AppError);
      const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
      expect(stored).toBeNull();
    });

    it('logout invalidates the refresh token — a subsequent refresh is rejected (AC-11)', async () => {
      const { refreshToken } = await authService.login(email, 'Password123');
      await authService.refresh(refreshToken);

      await authService.logout(refreshToken);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(AppError);
    });
  });
});
