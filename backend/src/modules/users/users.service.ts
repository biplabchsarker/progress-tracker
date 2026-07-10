import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { JwtPayload } from '../../middleware/auth';

const PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
} as const;

export async function list(filters: { role?: Role; isActive?: boolean }) {
  return prisma.user.findMany({
    where: {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    select: PUBLIC_SELECT,
    orderBy: { name: 'asc' },
  });
}

export async function getById(caller: JwtPayload, id: string) {
  if (caller.role !== 'ADMIN' && caller.role !== 'PM' && caller.sub !== id) {
    throw new AppError(403, 'ROLE_INSUFFICIENT', 'You do not have permission to view this user');
  }

  const user = await prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT });
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }
  return user;
}

export async function updateAsAdmin(id: string, data: Partial<{ role: Role; isActive: boolean }>) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  return prisma.user.update({ where: { id }, data, select: PUBLIC_SELECT });
}

export async function updateSelf(userId: string, data: Partial<{ name: string; avatarUrl: string }>) {
  return prisma.user.update({ where: { id: userId }, data, select: PUBLIC_SELECT });
}
