import { PrismaClient, Role, ProjectCategory, ProjectStatus, ProjectPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: await bcrypt.hash('Admin1234', 12),
      role: Role.ADMIN,
    },
  });

  // PM user
  const pm = await prisma.user.upsert({
    where: { email: 'pm@example.com' },
    update: {},
    create: {
      email: 'pm@example.com',
      name: 'Project Manager',
      passwordHash: await bcrypt.hash('Manager1234', 12),
      role: Role.PM,
    },
  });

  // Member users
  const member1 = await prisma.user.upsert({
    where: { email: 'dev1@example.com' },
    update: {},
    create: {
      email: 'dev1@example.com',
      name: 'Dev One',
      passwordHash: await bcrypt.hash('Member1234', 12),
      role: Role.MEMBER,
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'dev2@example.com' },
    update: {},
    create: {
      email: 'dev2@example.com',
      name: 'Dev Two',
      passwordHash: await bcrypt.hash('Member1234', 12),
      role: Role.MEMBER,
    },
  });

  // Viewer user
  await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      email: 'viewer@example.com',
      name: 'View Only',
      passwordHash: await bcrypt.hash('Viewer1234', 12),
      role: Role.VIEWER,
    },
  });

  // Client
  const client = await prisma.client.upsert({
    where: { name: 'Acme Corporation' },
    update: {},
    create: {
      name: 'Acme Corporation',
      contactPerson: 'Jane Smith',
      email: 'jane@acme.example.com',
      phone: '+1-555-0100',
      createdById: admin.id,
    },
  });

  // CLIENT project
  const clientProject = await prisma.project.upsert({
    where: { id: 'seed-client-project-01' },
    update: {},
    create: {
      id: 'seed-client-project-01',
      name: 'Acme Portal Redesign',
      description: 'Full redesign of client portal',
      category: ProjectCategory.CLIENT,
      status: ProjectStatus.ACTIVE,
      priority: ProjectPriority.HIGH,
      tasksEnabled: false,
      clientId: client.id,
      ownerId: pm.id,
      endDate: new Date('2026-09-30'),
    },
  });

  // Engagements on client project
  await prisma.projectEngagement.upsert({
    where: { projectId_userId: { projectId: clientProject.id, userId: member1.id } },
    update: {},
    create: {
      projectId: clientProject.id,
      userId: member1.id,
      engagementPct: 80,
      isBillable: true,
      assignedById: pm.id,
    },
  });

  // INTERNAL project
  const internalProject = await prisma.project.upsert({
    where: { id: 'seed-internal-project-01' },
    update: {},
    create: {
      id: 'seed-internal-project-01',
      name: 'Internal CRM Tool',
      description: 'Company-wide CRM for managing leads',
      category: ProjectCategory.INTERNAL,
      status: ProjectStatus.ACTIVE,
      priority: ProjectPriority.MEDIUM,
      tasksEnabled: true,
      ownerId: pm.id,
      endDate: new Date('2026-12-31'),
    },
  });

  // Engagement on internal project (member1 20%, member2 100%)
  await prisma.projectEngagement.upsert({
    where: { projectId_userId: { projectId: internalProject.id, userId: member1.id } },
    update: {},
    create: {
      projectId: internalProject.id,
      userId: member1.id,
      engagementPct: 20,
      isBillable: false,
      assignedById: pm.id,
    },
  });

  await prisma.projectEngagement.upsert({
    where: { projectId_userId: { projectId: internalProject.id, userId: member2.id } },
    update: {},
    create: {
      projectId: internalProject.id,
      userId: member2.id,
      engagementPct: 100,
      isBillable: false,
      assignedById: pm.id,
    },
  });

  // Task on internal project
  const task = await prisma.task.upsert({
    where: { id: 'seed-task-01' },
    update: {},
    create: {
      id: 'seed-task-01',
      title: 'Build authentication module',
      description: 'JWT-based auth with refresh tokens',
      projectId: internalProject.id,
      createdById: pm.id,
      dueDate: new Date('2026-08-15'),
    },
  });

  await prisma.taskAssignment.upsert({
    where: { taskId_userId: { taskId: task.id, userId: member2.id } },
    update: {},
    create: {
      taskId: task.id,
      userId: member2.id,
      engagementPct: 100,
      assignedById: pm.id,
    },
  });

  console.log('Seed complete.');
  console.log('  admin@example.com  / Admin1234');
  console.log('  pm@example.com     / Manager1234');
  console.log('  dev1@example.com   / Member1234  (80% Acme client + 20% CRM)');
  console.log('  dev2@example.com   / Member1234  (100% CRM internal)');
  console.log('  viewer@example.com / Viewer1234  (read-only)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => void prisma.$disconnect());
