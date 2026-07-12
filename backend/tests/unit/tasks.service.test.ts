import { prisma } from '../../src/config/prisma';
import { AppError } from '../../src/middleware/errorHandler';
import * as projectsService from '../../src/modules/projects/projects.service';
import * as tasksService from '../../src/modules/tasks/tasks.service';
import type { JwtPayload } from '../../src/middleware/auth';

describe('tasks.service', () => {
  let pm: JwtPayload;
  let assignee: JwtPayload;
  let outsider: JwtPayload;
  let clientId: string;

  beforeAll(async () => {
    const pmUser = await prisma.user.create({
      data: { email: 'test-task-pm@example.com', name: 'Test PM', passwordHash: 'x', role: 'PM' },
    });
    const assigneeUser = await prisma.user.create({
      data: { email: 'test-task-assignee@example.com', name: 'Assignee', passwordHash: 'x', role: 'MEMBER' },
    });
    const outsiderUser = await prisma.user.create({
      data: { email: 'test-task-outsider@example.com', name: 'Outsider', passwordHash: 'x', role: 'MEMBER' },
    });

    pm = { sub: pmUser.id, email: pmUser.email, role: 'PM' };
    assignee = { sub: assigneeUser.id, email: assigneeUser.email, role: 'MEMBER' };
    outsider = { sub: outsiderUser.id, email: outsiderUser.email, role: 'MEMBER' };

    const client = await prisma.client.create({
      data: { name: 'Test Task Client', createdById: pmUser.id },
    });
    clientId = client.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { project: { name: { startsWith: 'Test Task' } } } });
    await prisma.project.deleteMany({ where: { name: { startsWith: 'Test Task' } } });
    await prisma.client.deleteMany({ where: { name: { startsWith: 'Test Task' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-task-' } } });
    await prisma.$disconnect();
  });

  it('allows task creation on an INTERNAL project but blocks it on a CLIENT project with tasksEnabled=false', async () => {
    const internal = await projectsService.create(pm, { name: 'Test Task Internal', category: 'INTERNAL' });
    const task = await tasksService.create(pm, internal.id, { title: 'Build the thing' });
    expect(task.projectId).toBe(internal.id);

    const client = await projectsService.create(pm, { name: 'Test Task Client Proj', category: 'CLIENT', clientId });
    await expect(tasksService.create(pm, client.id, { title: 'Should fail' })).rejects.toThrow(AppError);
  });

  it('enforces single-level subtasks', async () => {
    const project = await projectsService.create(pm, { name: 'Test Task Subtask Depth', category: 'INTERNAL' });
    const parent = await tasksService.create(pm, project.id, { title: 'Parent' });
    const child = await tasksService.create(pm, project.id, { title: 'Child', parentTaskId: parent.id });

    await expect(
      tasksService.create(pm, project.id, { title: 'Grandchild', parentTaskId: child.id }),
    ).rejects.toThrow(AppError);
  });

  it('rejects a progressPct that is not a multiple of 5', async () => {
    const project = await projectsService.create(pm, { name: 'Test Task Progress', category: 'INTERNAL' });
    const task = await tasksService.create(pm, project.id, { title: 'Progress task' });

    await expect(tasksService.update(pm, task.id, { progressPct: 42 })).rejects.toThrow(AppError);
    const updated = await tasksService.update(pm, task.id, { progressPct: 45 });
    expect(updated.progressPct).toBe(45);
  });

  it('only lets an assignee, the creator, or a PM update a task', async () => {
    const project = await projectsService.create(pm, { name: 'Test Task Perms', category: 'INTERNAL' });
    const task = await tasksService.create(pm, project.id, { title: 'Perms task' });

    await expect(tasksService.update(outsider, task.id, { status: 'IN_PROGRESS' })).rejects.toThrow(AppError);

    await tasksService.assign(task.id, [{ userId: assignee.sub, engagementPct: 100 }], pm.sub);
    const updated = await tasksService.update(assignee, task.id, { status: 'IN_PROGRESS' });
    expect(updated.status).toBe('IN_PROGRESS');
  });

  it('revokes a former creator\'s update rights once they are removed from the project, but keeps a live assignee\'s rights even with no separate engagement', async () => {
    const project = await projectsService.create(pm, { name: 'Test Task Offboarding', category: 'INTERNAL' });
    await projectsService.addEngagement(project.id, { userId: outsider.sub, engagementPct: 20 }, pm.sub);
    const task = await tasksService.create(outsider, project.id, { title: 'Created by soon-to-be-offboarded user' });

    // Still engaged: the creator can update their own task.
    await expect(tasksService.update(outsider, task.id, { status: 'IN_PROGRESS' })).resolves.toMatchObject({ status: 'IN_PROGRESS' });

    // Offboard: remove their project engagement entirely.
    await projectsService.removeEngagement(project.id, outsider.sub);

    // Stale creator status alone must no longer grant write access.
    await expect(tasksService.update(outsider, task.id, { progressPct: 50 })).rejects.toThrow(AppError);

    // A live TaskAssignment (no separate ProjectEngagement) still works — assignment
    // itself is a current, revocable-via-unassign signal, not a stale one.
    await tasksService.assign(task.id, [{ userId: assignee.sub, engagementPct: 100 }], pm.sub);
    await expect(tasksService.update(assignee, task.id, { progressPct: 60 })).resolves.toMatchObject({ progressPct: 60 });
  });

  it('lets a member see tasks only on a project they are engaged in', async () => {
    const project = await projectsService.create(pm, { name: 'Test Task Visibility', category: 'INTERNAL' });
    await tasksService.create(pm, project.id, { title: 'Visible task' });
    await projectsService.addEngagement(project.id, { userId: assignee.sub, engagementPct: 50 }, pm.sub);

    await expect(tasksService.listForProject(outsider, project.id)).rejects.toThrow(AppError);
    const tasks = await tasksService.listForProject(assignee, project.id);
    expect(tasks.length).toBeGreaterThan(0);
  });
});
