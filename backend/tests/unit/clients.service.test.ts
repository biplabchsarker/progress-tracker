import { prisma } from '../../src/config/prisma';
import { AppError } from '../../src/middleware/errorHandler';
import * as clientsService from '../../src/modules/clients/clients.service';
import type { JwtPayload } from '../../src/middleware/auth';

describe('clients.service', () => {
  let admin: JwtPayload;
  let pm: JwtPayload;
  let otherPm: JwtPayload;

  beforeAll(async () => {
    const adminUser = await prisma.user.create({
      data: { email: 'test-admin@example.com', name: 'Test Admin', passwordHash: 'x', role: 'ADMIN' },
    });
    const pmUser = await prisma.user.create({
      data: { email: 'test-pm@example.com', name: 'Test PM', passwordHash: 'x', role: 'PM' },
    });
    const otherPmUser = await prisma.user.create({
      data: { email: 'test-other-pm@example.com', name: 'Other PM', passwordHash: 'x', role: 'PM' },
    });

    admin = { sub: adminUser.id, email: adminUser.email, role: 'ADMIN' };
    pm = { sub: pmUser.id, email: pmUser.email, role: 'PM' };
    otherPm = { sub: otherPmUser.id, email: otherPmUser.email, role: 'PM' };
  });

  afterAll(async () => {
    await prisma.project.deleteMany({ where: { owner: { email: { contains: 'test-' } } } });
    await prisma.client.deleteMany({ where: { name: { startsWith: 'Test Client ' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } });
    await prisma.$disconnect();
  });

  it('creates a client scoped to its creator', async () => {
    const client = await clientsService.create(pm, { name: 'Test Client Alpha' });
    expect(client.createdById).toBe(pm.sub);
  });

  it('rejects a duplicate client name', async () => {
    await clientsService.create(pm, { name: 'Test Client Beta' });
    await expect(clientsService.create(pm, { name: 'Test Client Beta' })).rejects.toThrow(AppError);
  });

  it('lets Admin see every client, but a PM only sees their own', async () => {
    const created = await clientsService.create(pm, { name: 'Test Client Gamma' });

    const adminList = await clientsService.list(admin);
    expect(adminList.some((c) => c.id === created.id)).toBe(true);

    const otherPmList = await clientsService.list(otherPm);
    expect(otherPmList.some((c) => c.id === created.id)).toBe(false);

    const pmList = await clientsService.list(pm);
    expect(pmList.some((c) => c.id === created.id)).toBe(true);
  });

  it('lets a PM see a client through a project they own, even if another PM created it', async () => {
    const created = await clientsService.create(pm, { name: 'Test Client Delta' });
    await prisma.project.create({
      data: {
        name: 'Test Project via Delta',
        category: 'CLIENT',
        clientId: created.id,
        ownerId: otherPm.sub,
      },
    });

    const otherPmList = await clientsService.list(otherPm);
    expect(otherPmList.some((c) => c.id === created.id)).toBe(true);
  });

  it('blocks deletion while an active project references the client, allows it once resolved', async () => {
    const created = await clientsService.create(admin, { name: 'Test Client Epsilon' });
    const project = await prisma.project.create({
      data: {
        name: 'Test Project Epsilon',
        category: 'CLIENT',
        clientId: created.id,
        ownerId: admin.sub,
        status: 'ACTIVE',
      },
    });

    await expect(clientsService.remove(admin, created.id)).rejects.toThrow(AppError);

    await prisma.project.update({ where: { id: project.id }, data: { status: 'COMPLETED' } });
    await expect(clientsService.remove(admin, created.id)).resolves.toBeUndefined();
  });

  it('forbids a non-Admin from deleting a client', async () => {
    const created = await clientsService.create(pm, { name: 'Test Client Zeta' });
    await expect(clientsService.remove(pm, created.id)).rejects.toThrow(AppError);
  });
});
