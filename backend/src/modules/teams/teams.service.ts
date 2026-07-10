import { TeamRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { JwtPayload } from '../../middleware/auth';

export async function list() {
  return prisma.team.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function getById(id: string) {
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  if (!team) {
    throw new AppError(404, 'NOT_FOUND', 'Team not found');
  }
  return team;
}

export async function create(caller: JwtPayload, data: { name: string; description?: string }) {
  return prisma.team.create({
    data: { ...data, createdById: caller.sub },
  });
}

export async function update(id: string, data: Partial<{ name: string; description: string }>) {
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    throw new AppError(404, 'NOT_FOUND', 'Team not found');
  }
  return prisma.team.update({ where: { id }, data });
}

export async function addMember(teamId: string, userId: string, teamRole: TeamRole) {
  const [team, user] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  if (!team) throw new AppError(404, 'NOT_FOUND', 'Team not found');
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (existing) {
    throw new AppError(409, 'ALREADY_MEMBER', 'User is already a member of this team');
  }

  return prisma.teamMember.create({
    data: { teamId, userId, teamRole },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
}

export async function removeMember(teamId: string, userId: string) {
  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'This user is not a member of the team');
  }

  await prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId } } });
}
