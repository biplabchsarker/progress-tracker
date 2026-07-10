import { prisma } from '../../src/config/prisma';
import { AppError } from '../../src/middleware/errorHandler';
import * as usersService from '../../src/modules/users/users.service';
import type { JwtPayload } from '../../src/middleware/auth';

describe('users.service', () => {
  let admin: JwtPayload;
  let memberA: JwtPayload;
  let memberB: JwtPayload;

  beforeAll(async () => {
    const adminUser = await prisma.user.create({
      data: { email: 'test-users-admin@example.com', name: 'Test Admin', passwordHash: 'x', role: 'ADMIN' },
    });
    const memberAUser = await prisma.user.create({
      data: { email: 'test-users-a@example.com', name: 'Member A', passwordHash: 'x', role: 'MEMBER' },
    });
    const memberBUser = await prisma.user.create({
      data: { email: 'test-users-b@example.com', name: 'Member B', passwordHash: 'x', role: 'MEMBER' },
    });

    admin = { sub: adminUser.id, email: adminUser.email, role: 'ADMIN' };
    memberA = { sub: memberAUser.id, email: memberAUser.email, role: 'MEMBER' };
    memberB = { sub: memberBUser.id, email: memberBUser.email, role: 'MEMBER' };
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'test-users-' } } });
    await prisma.$disconnect();
  });

  it('filters the user list by role', async () => {
    const admins = await usersService.list({ role: 'ADMIN' });
    expect(admins.every((u) => u.role === 'ADMIN')).toBe(true);
    expect(admins.some((u) => u.email === 'test-users-admin@example.com')).toBe(true);
  });

  it('lets a user fetch their own profile but not someone else\'s', async () => {
    await expect(usersService.getById(memberA, memberA.sub)).resolves.toMatchObject({ id: memberA.sub });
    await expect(usersService.getById(memberA, memberB.sub)).rejects.toThrow(AppError);
  });

  it('lets Admin or PM fetch any profile', async () => {
    await expect(usersService.getById(admin, memberB.sub)).resolves.toMatchObject({ id: memberB.sub });
  });

  it('updates role and active status via the admin path', async () => {
    const updated = await usersService.updateAsAdmin(memberA.sub, { role: 'PM', isActive: false });
    expect(updated.role).toBe('PM');
    expect(updated.isActive).toBe(false);
  });

  it('lets a user update only their own profile fields via updateSelf', async () => {
    const updated = await usersService.updateSelf(memberB.sub, { name: 'Member B Renamed' });
    expect(updated.name).toBe('Member B Renamed');
  });
});
