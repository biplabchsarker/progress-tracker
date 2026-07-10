import { api } from './api';
import type { Task, TaskPriority, TaskStatus } from '../types/entities';

export interface TaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  parentTaskId?: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  progressPct?: number;
  dueDate?: string;
  priority?: TaskPriority;
}

export async function listTasksForProject(projectId: string): Promise<Task[]> {
  const { data } = await api.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`);
  return data.tasks;
}

export async function createTask(projectId: string, input: TaskInput): Promise<Task> {
  const { data } = await api.post<{ task: Task }>(`/projects/${projectId}/tasks`, input);
  return data.task;
}

export async function updateTask(taskId: string, input: TaskUpdateInput): Promise<Task> {
  const { data } = await api.patch<{ task: Task }>(`/tasks/${taskId}`, input);
  return data.task;
}

export async function assignTask(taskId: string, assignments: { userId: string; engagementPct: number }[]): Promise<void> {
  await api.post(`/tasks/${taskId}/assign`, assignments);
}

export async function unassignTask(taskId: string, userId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}/assign/${userId}`);
}
