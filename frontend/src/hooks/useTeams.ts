import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as teamsService from '../services/teamsService';
import type { TeamRole } from '../types/entities';

const TEAMS_KEY = ['teams'];
const teamKey = (id: string) => ['teams', id];

export function useTeams() {
  return useQuery({ queryKey: TEAMS_KEY, queryFn: teamsService.listTeams });
}

export function useTeam(id: string) {
  return useQuery({ queryKey: teamKey(id), queryFn: () => teamsService.getTeam(id), enabled: !!id });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teamsService.createTeam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEAMS_KEY }),
  });
}

export function useAddTeamMember(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, teamRole }: { userId: string; teamRole: TeamRole }) =>
      teamsService.addTeamMember(teamId, userId, teamRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKey(teamId) });
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
    },
  });
}

export function useRemoveTeamMember(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => teamsService.removeTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKey(teamId) });
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
    },
  });
}
