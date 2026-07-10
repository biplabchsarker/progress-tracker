import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as projectsService from '../services/projectsService';
import type { ProjectCategory } from '../types/entities';

const PROJECTS_KEY = ['projects'];
const projectKey = (id: string) => ['projects', id];

export function useProjects(category?: ProjectCategory) {
  return useQuery({
    queryKey: category ? [...PROJECTS_KEY, category] : PROJECTS_KEY,
    queryFn: () => projectsService.listProjects(category),
  });
}

export function useProject(id: string) {
  return useQuery({ queryKey: projectKey(id), queryFn: () => projectsService.getProject(id), enabled: !!id });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsService.createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: projectsService.ProjectUpdateInput) => projectsService.updateProject(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKey(id) });
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useAddEngagement(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; engagementPct: number; isBillable?: boolean }) =>
      projectsService.addEngagement(projectId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKey(projectId) }),
  });
}

export function useUpdateEngagement(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: Partial<{ engagementPct: number; isBillable: boolean }> }) =>
      projectsService.updateEngagement(projectId, userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKey(projectId) }),
  });
}

export function useRemoveEngagement(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => projectsService.removeEngagement(projectId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKey(projectId) }),
  });
}
