import { api } from './api';
import type { Team, TeamRole } from '../types/entities';

export interface TeamInput {
  name: string;
  description?: string;
}

export async function listTeams(): Promise<Team[]> {
  const { data } = await api.get<{ teams: Team[] }>('/teams');
  return data.teams;
}

export async function getTeam(id: string): Promise<Team> {
  const { data } = await api.get<{ team: Team }>(`/teams/${id}`);
  return data.team;
}

export async function createTeam(input: TeamInput): Promise<Team> {
  const { data } = await api.post<{ team: Team }>('/teams', input);
  return data.team;
}

export async function addTeamMember(teamId: string, userId: string, teamRole: TeamRole): Promise<void> {
  await api.post(`/teams/${teamId}/members`, { userId, teamRole });
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  await api.delete(`/teams/${teamId}/members/${userId}`);
}
