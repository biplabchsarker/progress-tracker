import type { ProjectCategory, ProjectStatus, TaskStatus } from './entities';

export interface EmployeeEngagement {
  id: string;
  name: string;
  clientPct: number;
  internalPct: number;
  total: number;
  isOverAllocated: boolean;
}

export interface ClientProjectSummary {
  id: string;
  name: string;
  clientName: string | null;
  headcount: number;
}

export interface InternalProjectHealth {
  id: string;
  name: string;
  progressPct: number;
  overdueCount: number;
  endDate: string | null;
}

export interface AdminDashboard {
  role: 'ADMIN';
  summary: {
    totalHeadcount: number;
    onClientCount: number;
    internalOnlyCount: number;
    unassignedCount: number;
    overAllocatedCount: number;
    avgUtilization: number;
  };
  employees: EmployeeEngagement[];
  clientProjects: ClientProjectSummary[];
  internalProjects: InternalProjectHealth[];
}

export interface PmDashboard {
  role: 'PM';
  summary: { activeProjectCount: number; overdueTaskCount: number; overallProgress: number };
  clientProjects: ClientProjectSummary[];
  internalProjects: InternalProjectHealth[];
}

export interface MyEngagement {
  projectId: string;
  projectName: string;
  category: ProjectCategory;
  engagementPct: number;
  isBillable: boolean;
}

export interface MyTask {
  id: string;
  title: string;
  status: TaskStatus;
  progressPct: number;
  dueDate: string | null;
  projectName: string;
  isOverdue: boolean;
}

export interface MemberDashboard {
  role: 'MEMBER';
  summary: { totalEngagement: number; clientPct: number; internalPct: number; overdueTaskCount: number };
  myEngagements: MyEngagement[];
  myTasks: MyTask[];
}

export interface ViewerProject {
  id: string;
  name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  endDate: string | null;
  tasksEnabled: boolean;
  progressPct: number | null;
  overdueCount: number | null;
}

export interface ViewerDashboard {
  role: 'VIEWER';
  projects: ViewerProject[];
}

export type Dashboard = AdminDashboard | PmDashboard | MemberDashboard | ViewerDashboard;
