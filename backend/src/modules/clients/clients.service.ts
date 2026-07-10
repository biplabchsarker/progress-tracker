import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { JwtPayload } from '../../middleware/auth';

const NON_TERMINAL_STATUSES = ['ACTIVE', 'ON_HOLD'] as const;

function scopeWhere(caller: JwtPayload) {
  if (caller.role === 'ADMIN') return {};
  return {
    OR: [
      { createdById: caller.sub },
      { projects: { some: { ownerId: caller.sub } } },
    ],
  };
}

export async function list(caller: JwtPayload) {
  return prisma.client.findMany({
    where: { isActive: true, ...scopeWhere(caller) },
    orderBy: { name: 'asc' },
  });
}

export async function getById(caller: JwtPayload, id: string) {
  const client = await prisma.client.findFirst({
    where: { id, ...scopeWhere(caller) },
    include: {
      projects: { select: { id: true, name: true, category: true, status: true } },
    },
  });

  if (!client) {
    throw new AppError(404, 'NOT_FOUND', 'Client not found');
  }

  const engagedUserIds = await prisma.projectEngagement.findMany({
    where: { project: { clientId: id } },
    distinct: ['userId'],
    select: { userId: true },
  });

  return { ...client, engagedHeadcount: engagedUserIds.length };
}

export async function create(
  caller: JwtPayload,
  data: { name: string; contactPerson?: string; email?: string; phone?: string; notes?: string },
) {
  const existing = await prisma.client.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new AppError(409, 'CLIENT_EXISTS', 'A client with this name already exists');
  }

  return prisma.client.create({
    data: { ...data, createdById: caller.sub },
  });
}

export async function update(
  caller: JwtPayload,
  id: string,
  data: Partial<{ name: string; contactPerson: string; email: string; phone: string; notes: string }>,
) {
  const client = await prisma.client.findFirst({ where: { id, ...scopeWhere(caller) } });
  if (!client) {
    throw new AppError(404, 'NOT_FOUND', 'Client not found');
  }

  return prisma.client.update({ where: { id }, data });
}

export async function remove(caller: JwtPayload, id: string) {
  if (caller.role !== 'ADMIN') {
    throw new AppError(403, 'ROLE_INSUFFICIENT', 'Only an Admin can delete a client');
  }

  const client = await prisma.client.findUnique({
    where: { id },
    include: { projects: { select: { status: true } } },
  });
  if (!client) {
    throw new AppError(404, 'NOT_FOUND', 'Client not found');
  }

  const hasActiveProject = client.projects.some((p) =>
    NON_TERMINAL_STATUSES.includes(p.status as (typeof NON_TERMINAL_STATUSES)[number]),
  );
  if (hasActiveProject) {
    throw new AppError(409, 'CLIENT_HAS_ACTIVE_PROJECTS', 'Cannot delete a client with active or on-hold projects');
  }

  await prisma.client.update({ where: { id }, data: { isActive: false } });
}
