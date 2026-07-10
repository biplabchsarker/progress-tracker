import { api } from './api';
import type { EngagementMutationResult, Project, ProjectCategory, ProjectPriority, ProjectStatus } from '../types/entities';

export interface ProjectInput {
  name: string;
  category: ProjectCategory;
  clientId?: string;
  priority?: ProjectPriority;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  teamId?: string;
}

export interface ProjectUpdateInput {
  name?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  teamId?: string;
  tasksEnabled?: boolean;
}

export async function listProjects(category?: ProjectCategory): Promise<Project[]> {
  const { data } = await api.get<{ projects: Project[] }>('/projects', { params: category ? { category } : undefined });
  return data.projects;
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get<{ project: Project }>(`/projects/${id}`);
  return data.project;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const { data } = await api.post<{ project: Project }>('/projects', input);
  return data.project;
}

export async function updateProject(id: string, input: ProjectUpdateInput): Promise<Project> {
  const { data } = await api.patch<{ project: Project }>(`/projects/${id}`, input);
  return data.project;
}

export async function addEngagement(
  projectId: string,
  input: { userId: string; engagementPct: number; isBillable?: boolean; notes?: string },
): Promise<EngagementMutationResult> {
  const { data } = await api.post<EngagementMutationResult>(`/projects/${projectId}/engagements`, input);
  return data;
}

export async function updateEngagement(
  projectId: string,
  userId: string,
  input: Partial<{ engagementPct: number; isBillable: boolean; notes: string }>,
): Promise<EngagementMutationResult> {
  const { data } = await api.patch<EngagementMutationResult>(`/projects/${projectId}/engagements/${userId}`, input);
  return data;
}

export async function removeEngagement(projectId: string, userId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/engagements/${userId}`);
}
