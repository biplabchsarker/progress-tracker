import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { JwtPayload } from '../../middleware/auth';
import { isProjectMember } from '../projects/projects.service';

function assertTaskCreationAllowed(project: { category: string; tasksEnabled: boolean }) {
  const allowed = project.category === 'INTERNAL' || (project.category === 'CLIENT' && project.tasksEnabled);
  if (!allowed) {
    throw new AppError(403, 'TASKS_DISABLED', 'Task creation is not enabled for this project');
  }
}

const TASK_INCLUDE = {
  assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
  subtasks: { select: { id: true, title: true, status: true, progressPct: true } },
} as const;

export async function listForProject(caller: JwtPayload, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');

  const hasAccess = await isProjectMember(caller, projectId);
  if (!hasAccess) throw new AppError(404, 'NOT_FOUND', 'Project not found');

  if (project.category === 'CLIENT' && !project.tasksEnabled) {
    throw new AppError(403, 'TASKS_DISABLED', 'This CLIENT project does not have task tracking enabled');
  }

  return prisma.task.findMany({
    where: { projectId, parentTaskId: null },
    include: TASK_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getById(caller: JwtPayload, taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: TASK_INCLUDE });
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found');

  const hasAccess = await isProjectMember(caller, task.projectId);
  if (!hasAccess) throw new AppError(404, 'NOT_FOUND', 'Task not found');

  return task;
}

export async function create(
  caller: JwtPayload,
  projectId: string,
  data: { title: string; description?: string; priority?: string; dueDate?: string; parentTaskId?: string },
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');

  const hasAccess = await isProjectMember(caller, projectId);
  if (!hasAccess) throw new AppError(404, 'NOT_FOUND', 'Project not found');

  assertTaskCreationAllowed(project);

  if (data.parentTaskId) {
    const parent = await prisma.task.findUnique({ where: { id: data.parentTaskId } });
    if (!parent || parent.projectId !== projectId) {
      throw new AppError(400, 'INVALID_PARENT', 'Parent task not found in this project');
    }
    if (parent.parentTaskId) {
      throw new AppError(400, 'SUBTASK_DEPTH_EXCEEDED', 'Subtasks can only be one level deep');
    }
  }

  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority as never,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      parentTaskId: data.parentTaskId,
      projectId,
      createdById: caller.sub,
    },
  });
}

export async function update(
  caller: JwtPayload,
  taskId: string,
  data: Partial<{
    title: string;
    description: string;
    status: string;
    progressPct: number;
    dueDate: string;
    priority: string;
  }>,
) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { assignments: true } });
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found');

  const isPrivileged = caller.role === 'ADMIN' || caller.role === 'PM';
  const isCreator = task.createdById === caller.sub;
  const isAssignee = task.assignments.some((a) => a.userId === caller.sub);
  if (!isPrivileged && !isCreator && !isAssignee) {
    throw new AppError(403, 'ROLE_INSUFFICIENT', 'Only an assignee, the creator, or a PM can update this task');
  }

  if (data.progressPct !== undefined && data.progressPct % 5 !== 0) {
    throw new AppError(400, 'INVALID_PROGRESS', 'progressPct must be a multiple of 5');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status !== undefined ? { status: data.status as never } : {}),
      ...(data.progressPct !== undefined ? { progressPct: data.progressPct } : {}),
      ...(data.dueDate !== undefined ? { dueDate: new Date(data.dueDate) } : {}),
      ...(data.priority !== undefined ? { priority: data.priority as never } : {}),
    },
    include: TASK_INCLUDE,
  });
}

export async function assign(taskId: string, assignments: { userId: string; engagementPct: number }[], assignedById: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found');

  await Promise.all(
    assignments.map((a) =>
      prisma.taskAssignment.upsert({
        where: { taskId_userId: { taskId, userId: a.userId } },
        update: { engagementPct: a.engagementPct },
        create: { taskId, userId: a.userId, engagementPct: a.engagementPct, assignedById },
      }),
    ),
  );

  return prisma.taskAssignment.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function unassign(taskId: string, userId: string) {
  const existing = await prisma.taskAssignment.findUnique({
    where: { taskId_userId: { taskId, userId } },
  });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'This user is not assigned to the task');
  }
  await prisma.taskAssignment.delete({ where: { taskId_userId: { taskId, userId } } });
}
