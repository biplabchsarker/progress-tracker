import { prisma } from '../../src/config/prisma';
import * as projectsService from '../../src/modules/projects/projects.service';
import * as tasksService from '../../src/modules/tasks/tasks.service';
import * as dashboardService from '../../src/modules/dashboard/dashboard.service';
import type { JwtPayload } from '../../src/middleware/auth';

describe('dashboard.service', () => {
  let pm: JwtPayload;
  let memberOver: JwtPayload;
  let memberUnassigned: JwtPayload;
  let clientId: string;

  beforeAll(async () => {
    const pmUser = await prisma.user.create({
      data: { email: 'test-dash-pm@example.com', name: 'Test PM', passwordHash: 'x', role: 'PM' },
    });
    const overUser = await prisma.user.create({
      data: { email: 'test-dash-over@example.com', name: 'Over Allocated', passwordHash: 'x', role: 'MEMBER' },
    });
    const unassignedUser = await prisma.user.create({
      data: { email: 'test-dash-unassigned@example.com', name: 'Unassigned', passwordHash: 'x', role: 'MEMBER' },
    });

    pm = { sub: pmUser.id, email: pmUser.email, role: 'PM' };
    memberOver = { sub: overUser.id, email: overUser.email, role: 'MEMBER' };
    memberUnassigned = { sub: unassignedUser.id, email: unassignedUser.email, role: 'MEMBER' };

    const client = await prisma.client.create({ data: { name: 'Test Dash Client', createdById: pmUser.id } });
    clientId = client.id;
  });

  afterAll(async () => {
    await prisma.taskAssignment.deleteMany({ where: { task: { project: { name: { startsWith: 'Test Dash' } } } } });
    await prisma.task.deleteMany({ where: { project: { name: { startsWith: 'Test Dash' } } } });
    await prisma.projectEngagement.deleteMany({ where: { project: { name: { startsWith: 'Test Dash' } } } });
    await prisma.project.deleteMany({ where: { name: { startsWith: 'Test Dash' } } });
    await prisma.client.deleteMany({ where: { name: { startsWith: 'Test Dash' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-dash-' } } });
    await prisma.$disconnect();
  });

  it('computes admin summary counts: headcount, over-allocated, unassigned', async () => {
    const clientProject = await projectsService.create(pm, { name: 'Test Dash Client Project', category: 'CLIENT', clientId });
    const internalProject = await projectsService.create(pm, { name: 'Test Dash Internal Project', category: 'INTERNAL' });

    await projectsService.addEngagement(clientProject.id, { userId: memberOver.sub, engagementPct: 80 }, pm.sub);
    await projectsService.addEngagement(internalProject.id, { userId: memberOver.sub, engagementPct: 50 }, pm.sub);

    const dashboard = await dashboardService.getAdminDashboard();

    const overEntry = dashboard.employees.find((e) => e.id === memberOver.sub)!;
    expect(overEntry.clientPct).toBe(80);
    expect(overEntry.internalPct).toBe(50);
    expect(overEntry.total).toBe(130);
    expect(overEntry.isOverAllocated).toBe(true);

    const unassignedEntry = dashboard.employees.find((e) => e.id === memberUnassigned.sub)!;
    expect(unassignedEntry.total).toBe(0);

    expect(dashboard.summary.overAllocatedCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.summary.unassignedCount).toBeGreaterThanOrEqual(1);
  });

  it('scopes PM dashboard to owned projects and computes overdue/progress correctly', async () => {
    const project = await projectsService.create(pm, { name: 'Test Dash PM Internal', category: 'INTERNAL' });
    const overdueTask = await tasksService.create(pm, project.id, { title: 'Overdue task', dueDate: '2020-01-01' });
    await tasksService.update(pm, overdueTask.id, { progressPct: 40 });
    const doneTask = await tasksService.create(pm, project.id, { title: 'Done task' });
    await tasksService.update(pm, doneTask.id, { progressPct: 100, status: 'DONE' });

    const dashboard = await dashboardService.getPmDashboard(pm);
    const entry = dashboard.internalProjects.find((p) => p.id === project.id)!;

    expect(entry.overdueCount).toBe(1);
    expect(entry.progressPct).toBe(70);
    expect(dashboard.summary.activeProjectCount).toBeGreaterThanOrEqual(1);
  });

  it('computes member dashboard: engagement split and my-tasks overdue flag', async () => {
    const project = await projectsService.create(pm, { name: 'Test Dash Member Internal', category: 'INTERNAL' });
    await projectsService.addEngagement(project.id, { userId: memberUnassigned.sub, engagementPct: 60 }, pm.sub);
    const task = await tasksService.create(pm, project.id, { title: 'Assigned overdue task', dueDate: '2020-01-01' });
    await tasksService.assign(task.id, [{ userId: memberUnassigned.sub, engagementPct: 100 }], pm.sub);

    const dashboard = await dashboardService.getMemberDashboard(memberUnassigned);

    expect(dashboard.summary.totalEngagement).toBe(60);
    expect(dashboard.summary.internalPct).toBe(60);
    expect(dashboard.summary.clientPct).toBe(0);
    expect(dashboard.myTasks.some((t) => t.id === task.id && t.isOverdue)).toBe(true);
    expect(dashboard.summary.overdueTaskCount).toBeGreaterThanOrEqual(1);
  });

  it('gives the viewer dashboard project health only for INTERNAL/tasksEnabled projects', async () => {
    const clientProject = await projectsService.create(pm, { name: 'Test Dash Viewer Client', category: 'CLIENT', clientId });
    const internalProject = await projectsService.create(pm, { name: 'Test Dash Viewer Internal', category: 'INTERNAL' });
    await tasksService.create(pm, internalProject.id, { title: 'Viewer visible task' });

    const dashboard = await dashboardService.getViewerDashboard();
    const clientEntry = dashboard.projects.find((p) => p.id === clientProject.id)!;
    const internalEntry = dashboard.projects.find((p) => p.id === internalProject.id)!;

    expect(clientEntry.progressPct).toBeNull();
    expect(internalEntry.progressPct).not.toBeNull();
  });
});
