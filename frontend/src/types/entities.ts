import type { Role } from './auth';

export interface Client {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdById: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export type TeamRole = 'LEAD' | 'MEMBER';

export interface TeamMember {
  teamId: string;
  userId: string;
  teamRole: TeamRole;
  joinedAt: string;
  user: { id: string; name: string; email: string; role: Role };
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdById: string;
  _count?: { members: number };
  members?: TeamMember[];
}

export type ProjectCategory = 'CLIENT' | 'INTERNAL';
export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProjectEngagement {
  projectId: string;
  userId: string;
  engagementPct: number;
  isBillable: boolean;
  notes: string | null;
  assignedAt: string;
  user: { id: string; name: string; email: string };
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  tasksEnabled: boolean;
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  createdAt: string;
  ownerId: string;
  teamId: string | null;
  clientId: string | null;
  client?: { id: string; name: string } | null;
  owner?: { id: string; name: string; email: string };
  team?: { id: string; name: string } | null;
  engagements?: ProjectEngagement[];
  _count?: { tasks: number };
}

export interface EngagementMutationResult {
  engagement: ProjectEngagement;
  previousTotal: number;
  newTotal: number;
  isOverAllocated: boolean;
}

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskAssignment {
  taskId: string;
  userId: string;
  engagementPct: number;
  user: { id: string; name: string; email: string };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progressPct: number;
  dueDate: string | null;
  createdAt: string;
  projectId: string;
  parentTaskId: string | null;
  createdById: string;
  assignments: TaskAssignment[];
  subtasks: { id: string; title: string; status: TaskStatus; progressPct: number }[];
}
