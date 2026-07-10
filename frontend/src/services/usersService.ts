import { api } from './api';
import type { ManagedUser } from '../types/entities';
import type { Role } from '../types/auth';

export async function listUsers(): Promise<ManagedUser[]> {
  const { data } = await api.get<{ users: ManagedUser[] }>('/users');
  return data.users;
}

export async function updateUser(id: string, input: Partial<{ role: Role; isActive: boolean }>): Promise<ManagedUser> {
  const { data } = await api.patch<{ user: ManagedUser }>(`/users/${id}`, input);
  return data.user;
}
