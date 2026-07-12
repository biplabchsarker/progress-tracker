import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/prisma';

function extractRefreshCookie(setCookieHeader: string | string[] | undefined): string {
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader ? [setCookieHeader] : [];
  const cookie = cookies.find((c) => c.startsWith('refresh_token='));
  if (!cookie) throw new Error('refresh_token cookie not set');
  return cookie.split(';')[0];
}

describe('auth integration', () => {
  const email = 'test-int-auth@example.com';

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('register → login → refresh → logout → refresh-after-logout is 401 (AC-11)', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'Password123', name: 'Integration User' });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.user.email).toBe(email);

    const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'Password123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeTruthy();
    const refreshCookie = extractRefreshCookie(loginRes.headers['set-cookie']);

    const refreshRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', refreshCookie);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeTruthy();

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshCookie)
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);
    expect(logoutRes.status).toBe(204);

    const refreshAfterLogout = await request(app).post('/api/v1/auth/refresh').set('Cookie', refreshCookie);
    expect(refreshAfterLogout.status).toBe(401);
  });

  it('rejects register with a weak password (no uppercase/number)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test-int-weak@example.com', password: 'weakpassword', name: 'Weak' });
    expect(res.status).toBe(400);
  });

  it('rejects an unauthenticated request to a protected route', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });
});
