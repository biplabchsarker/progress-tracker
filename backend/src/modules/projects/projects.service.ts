import { ProjectCategory } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { JwtPayload } from '../../middleware/auth';

const ACTIVE_STATUSES = ['ACTIVE', 'ON_HOLD'] as const;

function membershipWhere(caller: JwtPayload) {
  if (caller.role === 'ADMIN') return {};
  return {
    OR: [
      { ownerId: caller.sub },
      { engagements: { some: { userId: caller.sub } } },
      { team: { members: { some: { userId: caller.sub } } } },
    ],
  };
}

export async function isProjectMember(caller: JwtPayload, projectId: string): Promise<boolean> {
  if (caller.role === 'ADMIN' || caller.role === 'PM') return true;
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...membershipWhere(caller) },
    select: { id: true },
  });
  return !!project;
}

export async function computeUserEngagement(userId: string) {
  const engagements = await prisma.projectEngagement.findMany({
    where: { userId, project: { status: { in: [...ACTIVE_STATUSES] } } },
    include: { project: { select: { id: true, name: true, category: true } } },
  });

  const total = engagements.reduce((sum, e) => sum + e.engagementPct, 0);
  return {
    total,
    isOverAllocated: total > 100,
    breakdown: engagements.map((e) => ({
      projectId: e.project.id,
      projectName: e.project.name,
      category: e.project.category,
      engagementPct: e.engagementPct,
      isBillable: e.isBillable,
    })),
  };
}

export async function list(caller: JwtPayload, category?: ProjectCategory) {
  return prisma.project.findMany({
    where: { ...membershipWhere(caller), ...(category ? { category } : {}) },
    orderBy: { createdAt: 'desc' },
    include: { client: { select: { id: true, name: true } }, _count: { select: { tasks: true } } },
  });
}

export async function getById(caller: JwtPayload, id: string) {
  const hasAccess = await isProjectMember(caller, id);
  if (!hasAccess) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
      engagements: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }
  return project;
}

export async function create(
  caller: JwtPayload,
  data: {
    name: string;
    category: ProjectCategory;
    clientId?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
    teamId?: string;
  },
) {
  if (data.category === 'CLIENT' && !data.clientId) {
    throw new AppError(400, 'CLIENT_ID_REQUIRED', 'CLIENT projects require a clientId');
  }
  if (data.category === 'INTERNAL' && data.clientId) {
    throw new AppError(400, 'CLIENT_ID_NOT_ALLOWED', 'INTERNAL projects cannot have a clientId');
  }

  return prisma.project.create({
    data: {
      name: data.name,
      category: data.category,
      clientId: data.category === 'CLIENT' ? data.clientId : undefined,
      priority: data.priority as never,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      tags: data.tags ?? [],
      teamId: data.teamId,
      ownerId: caller.sub,
      tasksEnabled: data.category === 'INTERNAL',
    },
  });
}

export async function update(
  caller: JwtPayload,
  id: string,
  data: Partial<{
    name: string;
    status: string;
    priority: string;
    startDate: string;
    endDate: string;
    tags: string[];
    teamId: string;
    tasksEnabled: boolean;
  }>,
) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }
  if (caller.role !== 'ADMIN' && project.ownerId !== caller.sub) {
    throw new AppError(403, 'ROLE_INSUFFICIENT', 'Only the project owner or an Admin can update this project');
  }
  if (data.tasksEnabled !== undefined && project.category !== 'CLIENT' && caller.role !== 'ADMIN') {
    throw new AppError(403, 'ROLE_INSUFFICIENT', 'Only an Admin can toggle task creation for a project');
  }

  return prisma.project.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.status !== undefined ? { status: data.status as never } : {}),
      ...(data.priority !== undefined ? { priority: data.priority as never } : {}),
      ...(data.startDate !== undefined ? { startDate: new Date(data.startDate) } : {}),
      ...(data.endDate !== undefined ? { endDate: new Date(data.endDate) } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.teamId !== undefined ? { teamId: data.teamId } : {}),
      ...(data.tasksEnabled !== undefined ? { tasksEnabled: data.tasksEnabled } : {}),
    },
  });
}

export async function listEngagements(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');

  return prisma.projectEngagement.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { assignedAt: 'asc' },
  });
}

export async function addEngagement(
  projectId: string,
  data: { userId: string; engagementPct: number; isBillable?: boolean; notes?: string },
  assignedById: string,
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');

  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

  const existing = await prisma.projectEngagement.findUnique({
    where: { projectId_userId: { projectId, userId: data.userId } },
  });
  if (existing) {
    throw new AppError(409, 'ALREADY_ENGAGED', 'User is already engaged on this project');
  }

  const before = await computeUserEngagement(data.userId);

  const engagement = await prisma.projectEngagement.create({
    data: {
      projectId,
      userId: data.userId,
      engagementPct: data.engagementPct,
      isBillable: data.isBillable ?? false,
      notes: data.notes,
      assignedById,
    },
  });

  const after = await computeUserEngagement(data.userId);

  return { engagement, previousTotal: before.total, newTotal: after.total, isOverAllocated: after.isOverAllocated };
}

export async function updateEngagement(
  projectId: string,
  userId: string,
  data: Partial<{ engagementPct: number; isBillable: boolean; notes: string }>,
) {
  const existing = await prisma.projectEngagement.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'This user is not engaged on this project');
  }

  const before = await computeUserEngagement(userId);

  const engagement = await prisma.projectEngagement.update({
    where: { projectId_userId: { projectId, userId } },
    data,
  });

  const after = await computeUserEngagement(userId);

  return { engagement, previousTotal: before.total, newTotal: after.total, isOverAllocated: after.isOverAllocated };
}

export async function removeEngagement(projectId: string, userId: string) {
  const existing = await prisma.projectEngagement.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'This user is not engaged on this project');
  }
  await prisma.projectEngagement.delete({ where: { projectId_userId: { projectId, userId } } });
}
