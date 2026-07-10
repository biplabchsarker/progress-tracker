import { prisma } from '../../config/prisma';
import type { JwtPayload } from '../../middleware/auth';
import * as projectsService from '../projects/projects.service';
import { isOverdue } from '../tasks/tasks.service';

const ACTIVE_STATUSES = ['ACTIVE', 'ON_HOLD'] as const;

function splitEngagement(breakdown: Awaited<ReturnType<typeof projectsService.computeUserEngagement>>['breakdown']) {
  const clientPct = breakdown.filter((b) => b.category === 'CLIENT').reduce((s, b) => s + b.engagementPct, 0);
  const internalPct = breakdown.filter((b) => b.category === 'INTERNAL').reduce((s, b) => s + b.engagementPct, 0);
  return { clientPct, internalPct };
}

async function buildInternalProjectHealth(projects: { id: string; name: string; endDate: Date | null }[]) {
  return Promise.all(
    projects.map(async (p) => {
      const tasks = await prisma.task.findMany({ where: { projectId: p.id }, select: { progressPct: true, dueDate: true, status: true } });
      const progressPct = tasks.length ? Math.round(tasks.reduce((s, t) => s + t.progressPct, 0) / tasks.length) : 0;
      const overdueCount = tasks.filter(isOverdue).length;
      return { id: p.id, name: p.name, progressPct, overdueCount, endDate: p.endDate };
    }),
  );
}

async function buildClientProjectSummaries(projects: { id: string; name: string; clientId: string | null }[]) {
  const clients = await prisma.client.findMany({ where: { id: { in: projects.map((p) => p.clientId).filter((id): id is string => !!id) } } });
  const clientNameById = new Map(clients.map((c) => [c.id, c.name]));

  return Promise.all(
    projects.map(async (p) => {
      const headcount = await prisma.projectEngagement.count({ where: { projectId: p.id } });
      return { id: p.id, name: p.name, clientName: p.clientId ? clientNameById.get(p.clientId) ?? null : null, headcount };
    }),
  );
}

export async function getAdminDashboard() {
  const roster = await prisma.user.findMany({
    where: { role: { in: ['MEMBER', 'PM'] }, isActive: true },
    select: { id: true, name: true, email: true },
  });

  const employees = await Promise.all(
    roster.map(async (u) => {
      const engagement = await projectsService.computeUserEngagement(u.id);
      const { clientPct, internalPct } = splitEngagement(engagement.breakdown);
      return { id: u.id, name: u.name, clientPct, internalPct, total: engagement.total, isOverAllocated: engagement.isOverAllocated };
    }),
  );

  const totalHeadcount = employees.length;
  const onClientCount = employees.filter((e) => e.clientPct > 0).length;
  const internalOnlyCount = employees.filter((e) => e.internalPct > 0 && e.clientPct === 0).length;
  const unassignedCount = employees.filter((e) => e.total === 0).length;
  const overAllocatedCount = employees.filter((e) => e.isOverAllocated).length;
  const avgUtilization = totalHeadcount ? Math.round(employees.reduce((s, e) => s + e.total, 0) / totalHeadcount) : 0;

  const clientProjects = await prisma.project.findMany({ where: { category: 'CLIENT' }, select: { id: true, name: true, clientId: true } });
  const internalProjects = await prisma.project.findMany({ where: { category: 'INTERNAL' }, select: { id: true, name: true, endDate: true } });

  return {
    role: 'ADMIN' as const,
    summary: { totalHeadcount, onClientCount, internalOnlyCount, unassignedCount, overAllocatedCount, avgUtilization },
    employees,
    clientProjects: await buildClientProjectSummaries(clientProjects),
    internalProjects: await buildInternalProjectHealth(internalProjects),
  };
}

export async function getPmDashboard(caller: JwtPayload) {
  const owned = await prisma.project.findMany({
    where: { ownerId: caller.sub },
    select: { id: true, name: true, category: true, status: true, endDate: true, clientId: true },
  });

  const clientProjects = await buildClientProjectSummaries(owned.filter((p) => p.category === 'CLIENT'));
  const internalProjects = await buildInternalProjectHealth(owned.filter((p) => p.category === 'INTERNAL'));

  const activeProjectCount = owned.filter((p) => ACTIVE_STATUSES.includes(p.status as (typeof ACTIVE_STATUSES)[number])).length;
  const overdueTaskCount = internalProjects.reduce((s, p) => s + p.overdueCount, 0);
  const overallProgress = internalProjects.length
    ? Math.round(internalProjects.reduce((s, p) => s + p.progressPct, 0) / internalProjects.length)
    : 0;

  return {
    role: 'PM' as const,
    summary: { activeProjectCount, overdueTaskCount, overallProgress },
    clientProjects,
    internalProjects,
  };
}

export async function getMemberDashboard(caller: JwtPayload) {
  const engagement = await projectsService.computeUserEngagement(caller.sub);
  const { clientPct, internalPct } = splitEngagement(engagement.breakdown);

  const assignments = await prisma.taskAssignment.findMany({
    where: { userId: caller.sub },
    include: { task: { include: { project: { select: { id: true, name: true } } } } },
  });

  const myTasks = assignments.map((a) => ({
    id: a.task.id,
    title: a.task.title,
    status: a.task.status,
    progressPct: a.task.progressPct,
    dueDate: a.task.dueDate,
    projectName: a.task.project.name,
    isOverdue: isOverdue(a.task),
  }));

  return {
    role: 'MEMBER' as const,
    summary: {
      totalEngagement: engagement.total,
      clientPct,
      internalPct,
      overdueTaskCount: myTasks.filter((t) => t.isOverdue).length,
    },
    myEngagements: engagement.breakdown,
    myTasks,
  };
}

export async function getViewerDashboard() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, category: true, status: true, endDate: true, tasksEnabled: true },
  });

  const withHealth = await Promise.all(
    projects.map(async (p) => {
      if (p.category === 'INTERNAL' || p.tasksEnabled) {
        const [health] = await buildInternalProjectHealth([p]);
        return { ...p, progressPct: health.progressPct, overdueCount: health.overdueCount };
      }
      return { ...p, progressPct: null, overdueCount: null };
    }),
  );

  return { role: 'VIEWER' as const, projects: withHealth };
}
