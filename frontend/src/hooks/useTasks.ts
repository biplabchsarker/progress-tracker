import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as tasksService from '../services/tasksService';

const tasksKey = (projectId: string) => ['projects', projectId, 'tasks'];

export function useTasks(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: tasksKey(projectId),
    queryFn: () => tasksService.listTasksForProject(projectId),
    enabled: enabled && !!projectId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: tasksService.TaskInput) => tasksService.createTask(projectId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(projectId) }),
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: tasksService.TaskUpdateInput }) =>
      tasksService.updateTask(taskId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(projectId) }),
  });
}

export function useAssignTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, userId, engagementPct }: { taskId: string; userId: string; engagementPct: number }) =>
      tasksService.assignTask(taskId, [{ userId, engagementPct }]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(projectId) }),
  });
}

export function useUnassignTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) => tasksService.unassignTask(taskId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(projectId) }),
  });
}
