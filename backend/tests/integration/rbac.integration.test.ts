import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { env } from '../../src/config/env';
import type { JwtPayload } from '../../src/middleware/auth';

function tokenFor(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions);
}

describe('RBAC integration (AC-08: Member cannot call Admin/PM-only endpoints)', () => {
  let pmToken: string;
  let memberToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const pmUser = await prisma.user.create({
      data: { email: 'test-int-rbac-pm@example.com', name: 'RBAC PM', passwordHash: 'x', role: 'PM' },
    });
    const memberUser = await prisma.user.create({
      data: { email: 'test-int-rbac-member@example.com', name: 'RBAC Member', passwordHash: 'x', role: 'MEMBER' },
    });
    const adminUser = await prisma.user.create({
      data: { email: 'test-int-rbac-admin@example.com', name: 'RBAC Admin', passwordHash: 'x', role: 'ADMIN' },
    });

    pmToken = tokenFor({ sub: pmUser.id, email: pmUser.email, role: 'PM' });
    memberToken = tokenFor({ sub: memberUser.id, email: memberUser.email, role: 'MEMBER' });
    adminToken = tokenFor({ sub: adminUser.id, email: adminUser.email, role: 'ADMIN' });
  });

  afterAll(async () => {
    await prisma.project.deleteMany({ where: { name: { startsWith: 'RBAC Test' } } });
    await prisma.team.deleteMany({ where: { name: { startsWith: 'RBAC Test' } } });
    await prisma.client.deleteMany({ where: { name: { startsWith: 'RBAC Test' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-int-rbac-' } } });
    await prisma.$disconnect();
  });

  it('POST /clients: Member 403, PM 201', async () => {
    const memberRes = await request(app)
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'RBAC Test Client Reject' });
    expect(memberRes.status).toBe(403);

    const pmRes = await request(app)
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ name: 'RBAC Test Client Accept' });
    expect(pmRes.status).toBe(201);
  });

  it('POST /teams: Member 403, PM 201', async () => {
    const memberRes = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'RBAC Test Team Reject' });
    expect(memberRes.status).toBe(403);

    const pmRes = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ name: 'RBAC Test Team Accept' });
    expect(pmRes.status).toBe(201);
  });

  it('POST /projects: Member 403, PM 201', async () => {
    const memberRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'RBAC Test Project Reject', category: 'INTERNAL' });
    expect(memberRes.status).toBe(403);

    const pmRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ name: 'RBAC Test Project Accept', category: 'INTERNAL' });
    expect(pmRes.status).toBe(201);
  });

  it('GET /dashboard/admin: Member and PM 403, Admin 200', async () => {
    const memberRes = await request(app).get('/api/v1/dashboard/admin').set('Authorization', `Bearer ${memberToken}`);
    expect(memberRes.status).toBe(403);

    const pmRes = await request(app).get('/api/v1/dashboard/admin').set('Authorization', `Bearer ${pmToken}`);
    expect(pmRes.status).toBe(403);

    const adminRes = await request(app).get('/api/v1/dashboard/admin').set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.role).toBe('ADMIN');
  });

  it('GET /dashboard: role-aware for every role, no 403s', async () => {
    for (const token of [memberToken, pmToken, adminToken]) {
      const res = await request(app).get('/api/v1/dashboard').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }
  });
});
