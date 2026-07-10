import { api } from './api';
import type { Dashboard } from '../types/dashboard';

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>('/dashboard');
  return data;
}
