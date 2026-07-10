import { prisma } from '../../src/config/prisma';
import { AppError } from '../../src/middleware/errorHandler';
import * as projectsService from '../../src/modules/projects/projects.service';
import type { JwtPayload } from '../../src/middleware/auth';

describe('projects.service', () => {
  let admin: JwtPayload;
  let pm: JwtPayload;
  let member: JwtPayload;
  let outsider: JwtPayload;
  let clientId: string;

  beforeAll(async () => {
    const adminUser = await prisma.user.create({
      data: { email: 'test-proj-admin@example.com', name: 'Test Admin', passwordHash: 'x', role: 'ADMIN' },
    });
    const pmUser = await prisma.user.create({
      data: { email: 'test-proj-pm@example.com', name: 'Test PM', passwordHash: 'x', role: 'PM' },
    });
    const memberUser = await prisma.user.create({
      data: { email: 'test-proj-member@example.com', name: 'Test Member', passwordHash: 'x', role: 'MEMBER' },
    });
    const outsiderUser = await prisma.user.create({
      data: { email: 'test-proj-outsider@example.com', name: 'Outsider', passwordHash: 'x', role: 'MEMBER' },
    });

    admin = { sub: adminUser.id, email: adminUser.email, role: 'ADMIN' };
    pm = { sub: pmUser.id, email: pmUser.email, role: 'PM' };
    member = { sub: memberUser.id, email: memberUser.email, role: 'MEMBER' };
    outsider = { sub: outsiderUser.id, email: outsiderUser.email, role: 'MEMBER' };

    const client = await prisma.client.create({
      data: { name: 'Test Proj Client', createdById: adminUser.id },
    });
    clientId = client.id;
  });

  afterAll(async () => {
    await prisma.projectEngagement.deleteMany({ where: { project: { name: { startsWith: 'Test Proj' } } } });
    await prisma.project.deleteMany({ where: { name: { startsWith: 'Test Proj' } } });
    await prisma.client.deleteMany({ where: { name: { startsWith: 'Test Proj' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-proj-' } } });
    await prisma.$disconnect();
  });

  it('requires a clientId for CLIENT projects and rejects one for INTERNAL', async () => {
    await expect(projectsService.create(pm, { name: 'Test Proj Client-less', category: 'CLIENT' })).rejects.toThrow(AppError);
    await expect(
      projectsService.create(pm, { name: 'Test Proj Internal-with-client', category: 'INTERNAL', clientId }),
    ).rejects.toThrow(AppError);
  });

  it('creates an INTERNAL project with tasksEnabled true, and a CLIENT project with it false', async () => {
    const internal = await projectsService.create(pm, { name: 'Test Proj Internal A', category: 'INTERNAL' });
    expect(internal.tasksEnabled).toBe(true);

    const client = await projectsService.create(pm, { name: 'Test Proj Client A', category: 'CLIENT', clientId });
    expect(client.tasksEnabled).toBe(false);
  });

  it('scopes project visibility: owner sees it, an unrelated member does not, Admin always does', async () => {
    const project = await projectsService.create(pm, { name: 'Test Proj Scoped', category: 'INTERNAL' });

    const pmList = await projectsService.list(pm);
    expect(pmList.some((p) => p.id === project.id)).toBe(true);

    const outsiderList = await projectsService.list(outsider);
    expect(outsiderList.some((p) => p.id === project.id)).toBe(false);

    const adminList = await projectsService.list(admin);
    expect(adminList.some((p) => p.id === project.id)).toBe(true);

    await expect(projectsService.getById(outsider, project.id)).rejects.toThrow(AppError);
  });

  it('computes total engagement and flags over-allocation, warning but not blocking', async () => {
    const projectA = await projectsService.create(pm, { name: 'Test Proj Engage A', category: 'INTERNAL' });
    const projectB = await projectsService.create(pm, { name: 'Test Proj Engage B', category: 'INTERNAL' });

    const first = await projectsService.addEngagement(projectA.id, { userId: member.sub, engagementPct: 80 }, pm.sub);
    expect(first.isOverAllocated).toBe(false);
    expect(first.newTotal).toBe(80);

    const second = await projectsService.addEngagement(projectB.id, { userId: member.sub, engagementPct: 40 }, pm.sub);
    expect(second.previousTotal).toBe(80);
    expect(second.newTotal).toBe(120);
    expect(second.isOverAllocated).toBe(true);

    const { total } = await projectsService.computeUserEngagement(member.sub);
    expect(total).toBe(120);
  });

  it('rejects double-engaging the same user on a project', async () => {
    const project = await projectsService.create(pm, { name: 'Test Proj Dup Engage', category: 'INTERNAL' });
    await projectsService.addEngagement(project.id, { userId: member.sub, engagementPct: 10 }, pm.sub);
    await expect(
      projectsService.addEngagement(project.id, { userId: member.sub, engagementPct: 10 }, pm.sub),
    ).rejects.toThrow(AppError);
  });

  it('lets Admin or the owner update a project but blocks a non-owner PM', async () => {
    const project = await projectsService.create(pm, { name: 'Test Proj Owner Check', category: 'INTERNAL' });
    const otherPm = await prisma.user.create({
      data: { email: 'test-proj-other-pm@example.com', name: 'Other PM', passwordHash: 'x', role: 'PM' },
    });
    const otherPmCaller: JwtPayload = { sub: otherPm.id, email: otherPm.email, role: 'PM' };

    await expect(projectsService.update(otherPmCaller, project.id, { status: 'ON_HOLD' })).rejects.toThrow(AppError);
    const updated = await projectsService.update(pm, project.id, { status: 'ON_HOLD' });
    expect(updated.status).toBe('ON_HOLD');

    await prisma.user.delete({ where: { id: otherPm.id } });
  });
});
